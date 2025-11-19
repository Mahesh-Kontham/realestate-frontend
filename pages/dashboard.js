import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AddFlatsForm from "../components/AddFlatsForm";
import Link from "next/link";
import AddPastTenantModal from "../components/AddPastTenant";
import AddPastMaintenanceModal from "../components/AddPastMaintenance";
import PaymentProofModal from "../components/PaymentProofModal";
import EditFlatModal from "../components/EditFlatModal";


export default function Dashboard() {
  const [flats, setFlats] = useState([]);
  const [filteredFlats, setFilteredFlats] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");

  const [showPastTenant, setShowPastTenant] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentFlat, setSelectedPaymentFlat] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFlat, setEditFlat] = useState(null);



  const router = useRouter();

  const fetchDetails = () => fetchFlats(filter);

  // FETCH USER
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/");
      else setUser(user);
    }
    getUser();
  }, []);
    const handleDeleteFlat = async (flat) => {
          if (!confirm(`Delete flat ${flat.flat_id}?`)) return;

          const { error } = await supabase
            .from("flats")
            .delete()
            .eq("flat_id", flat.flat_id);   // or .eq("id", flat.id)

          if (error) {
            console.error(error);
            alert("Delete failed due to RLS or wrong key.");
            return;
          }

          alert("Flat deleted!");

          setFlats(prev => prev.filter(f => f.flat_id !== flat.flat_id));
          setFilteredFlats(prev => prev.filter(f => f.flat_id !== flat.flat_id));
        };


  const isAdmin = user?.email === "admin@realestate.com";

  // FETCH FLATS
  const fetchFlats = async (status = "all") => {
    setLoading(true);
    try {
      let data = [];

      if (status === "filled") {
        const { data: filledData } = await supabase.from("filled_flats").select("*");
        data = filledData || [];
      } else if (status === "vacant") {
        const { data: allFlats } = await supabase.from("flats").select("*");
        const { data: filledFlats } = await supabase.from("filled_flats").select("flat_id");

        const filledIds = filledFlats?.map((f) => f.flat_id) || [];
        data = allFlats?.filter((f) => !filledIds.includes(f.flat_id)) || [];
      } else {
        const { data: allData } = await supabase.from("flats").select("*");
        data = allData || [];
      }

      setFlats(data);
      setFilteredFlats(data);
    } catch (err) {
      console.error("Error fetching flats:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlats(filter);
  }, [filter]);

  // SEARCH
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setFilteredFlats(flats);
      return;
    }

    const filtered = flats.filter((flat) => {
      const apt = (flat.apartment_name || "").toLowerCase();
      const id = (flat.flat_id || "").toLowerCase();
      const tenantNames = (flat.tenancies || [])
        .map((t) => (t.tenant_name || t.name || "").toLowerCase())
        .join(" ");

      return apt.includes(q) || id.includes(q) || tenantNames.includes(q);
    });

    setFilteredFlats(filtered);
  }, [searchQuery, flats]);

  // PAYMENT UPDATE
 const handleStatusUpdate = async (e, flatId, currentStatus) => {
  e.preventDefault();
  e.stopPropagation();

  // 1️⃣ If currently unpaid → open upload modal
  if (currentStatus === "unpaid") {
    setSelectedPaymentFlat(flatId);      // FIXED
    setShowPaymentModal(true);           // FIXED
    return;                              // STOP HERE
  }

  // 2️⃣ If already paid → mark unpaid directly
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in.");
      return;
    }

    const newStatus = "unpaid"; // because currentStatus === "paid"

    const { error } = await supabase
      .from("flats")
      .update({
        status: newStatus,
        paid_on: null,
      })
      .eq("flat_id", flatId);

    if (error) throw error;

    // Refresh UI
    setFlats(prev =>
      prev.map(flat =>
        flat.flat_id === flatId
          ? { ...flat, status: newStatus, paid_on: null }
          : flat
      )
    );

    setFilteredFlats(prev =>
      prev.map(flat =>
        flat.flat_id === flatId
          ? { ...flat, status: newStatus, paid_on: null }
          : flat
      )
    );

  } catch (err) {
    console.error("Payment update failed:", err);
  }
};


  return (
    <div className="space-y-8">

      {/* ===== TOP ACTION BUTTONS ===== */}
      {isAdmin && (
        <div className="flex flex-wrap gap-4 items-center">

          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700"
          >
            Add Flat
          </button>

          <Link
            href="/tenants/add"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700"
          >
            Add Tenant
          </Link>

          <Link
            href="/tenants/TenantExitWizard"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg shadow-sm hover:bg-orange-700"
          >
            Tenant Exit Wizard
          </Link>

          {/* FIXED BUTTONS – ONLY ON DASHBOARD */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedFlat(null);
              setShowPastTenant(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700"
          >
            Add Past Tenant
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedFlat(null);
              setShowMaintenance(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700"
          >
            Add Maintenance
          </button>

        </div>
      )}

      {/* USER INFO */}
      {user && (
        <p className="text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
          Logged in as {user.email} ({isAdmin ? "Admin" : "Owner"})
        </p>
      )}

      {/* SEARCH */}
      <div className="flex justify-center">
        <input
          type="text"
          placeholder="🔍 Search by Flat ID, Apartment Name, or Tenant..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-2/3 px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 
                     text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* ADD FLAT FORM */}
      {showForm && (
        <AddFlatsForm
          onClose={() => setShowForm(false)}
          onFlatAdded={() => fetchFlats(filter)}
        />
      )}

      {/* FILTERS */}
      {isAdmin && (
        <div className="space-y-2 text-center">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg shadow ${
                filter === "all" ? "bg-blue-600 text-white" : " bg-red-500"
              }`}
            >
              All
            </button>

            <button
              onClick={() => setFilter("filled")}
              className={`px-4 py-2 rounded-lg shadow ${
                filter === "filled" ? "bg-blue-600 text-white" : "bg-red-500"
              }`}
            >
              Filled Flats
            </button>

            <button
              onClick={() => setFilter("vacant")}
              className={`px-4 py-2 rounded-lg shadow ${
                filter === "vacant" ? "bg-blue-500 text-white" : "bg-red-500"
              }`}
            >
              Vacant Flats
            </button>
          </div>

          {/* COUNTS */}
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            Total Flats: {flats.length} |
            Filled: {flats.filter((f) => (f.tenancies || []).length > 0).length} |
            Vacant: {flats.filter((f) => !(f.tenancies || []).length).length}
          </p>
        </div>
      )}

      {/* SECTION TITLE */}
      <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">🏠 Available Flats</h2>

      {/* ===== FLATS GRID ===== */}
      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Loading flats...</p>
      ) : filteredFlats.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-300">
          No flats found for "{searchQuery}"
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFlats.map((flat) => (
            <div
              key={flat.flat_id}
              onClick={() => router.push(`/tenants/${flat.flat_id}`)}
              className="p-6 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 
                         shadow hover:shadow-lg transform hover:-translate-y-1 transition cursor-pointer"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {flat.apartment_name}
              </h3>

              <p className="text-gray-800 dark:text-white">🏠 Flat Number: {flat.flat_id}</p>
              <p className="text-gray-800 dark:text-white">💰 Rent: ₹{flat.rent_amount}</p>
              <p className="text-gray-800 dark:text-white">
                📅 Due Date:{" "}
                {flat.due_date ? new Date(flat.due_date).toLocaleDateString("en-IN") : "—"}
              </p>

              <p className="text-gray-800 dark:text-white">
                🟢 Status:{" "}
                <span
                  className={`font-semibold ${
                    flat.status === "paid" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {flat.status}
                </span>
              </p>
                {isAdmin && (
                  <div className="mt-4 flex gap-2">

                {/* EDIT BUTTON */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditFlat(flat);
                    setShowEditModal(true);
                  }}
                  className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                >
                  Edit
                </button>

                {/* DELETE BUTTON */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFlat(flat);
                  }}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>

              </div>
            )}

              {/* ONLY MARK PAID / UNPAID LEFT */}
              {isAdmin && (
                <button
                  onClick={(e) => handleStatusUpdate(e, flat.flat_id, flat.status)}
                  className={`mt-4 w-full px-4 py-2 rounded-lg text-white ${
                    flat.status === "paid" ? "bg-red-500" : "bg-green-600"
                  }`}
                >
                  {flat.status === "paid" ? "Mark Unpaid" : "Mark Paid"}
                </button>
              )}
            </div>
            
          ))}
          
        </div>
      )}

      {/* ===== MODALS ===== */}
      {showPastTenant && (
        <AddPastTenantModal
         flatId={selectedFlat ?? ""}
           onClose={() => {
            setShowPastTenant(false);
            setSelectedFlat(null);
          }}
          onSuccess={fetchDetails}
        />
      )}

      {showMaintenance && (
        <AddPastMaintenanceModal
        flatId={selectedFlat ?? ""}    // SAFE fallback
          onClose={() => {
            setShowMaintenance(false);
            setSelectedFlat(null);
          }}
          onSuccess={fetchDetails}
        />
      )}
      {showPaymentModal && (
        <PaymentProofModal
          flatId={selectedPaymentFlat}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => fetchFlats(filter)}
        />
      )}
      
      {showEditModal && (
        <EditFlatModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          flat={editFlat}
          onSuccess={() => fetchFlats(filter)}
        />
      )}


    </div>
  );
}
