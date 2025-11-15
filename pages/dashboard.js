import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AddFlatsForm from "../components/AddFlatsForm";
import Link from "next/link";

export default function Dashboard() {
  const [flats, setFlats] = useState([]);
  const [filteredFlats, setFilteredFlats] = useState([]); // 🔍 For search results
  const [searchQuery, setSearchQuery] = useState(""); // ✅ Track search input
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all"); // 🆕 admin filter state: "all" | "filled" | "vacant"
  const router = useRouter();

  // ✅ Fetch logged-in user
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/");
      else setUser(user);
    }
    getUser();
  }, []);

  const isAdmin = user?.email === "admin@realestate.com";

  // 🆕 Fetch flats with optional filter
    const fetchFlats = async (status = "all") => {
  setLoading(true);
  try {
    let data = [];

    if (status === "filled") {
      // Get filled flats from the SQL view
      const { data: filledData, error } = await supabase
        .from("filled_flats")
        .select("*");
      if (error) throw error;
      data = filledData || [];
    } else if (status === "vacant") {
      // Get all flats
      const { data: allFlats, error: flatsError } = await supabase
        .from("flats")
        .select("*");
      if (flatsError) throw flatsError;

      // Get all filled flats (to exclude them)
      const { data: filledFlats, error: filledError } = await supabase
        .from("filled_flats")
        .select("flat_id");
      if (filledError) throw filledError;

      const filledIds = (filledFlats || []).map((f) => f.flat_id);
      data = (allFlats || []).filter((f) => !filledIds.includes(f.flat_id));
    } else {
      // Show all flats
      const { data: allData, error } = await supabase
        .from("flats")
        .select("*");
      if (error) throw error;
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


  // fetch when filter changes (and on mount)
  useEffect(() => {
    fetchFlats(filter);
  }, [filter]);

  // ✅ Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert("You have logged out");
    router.push("/");
  };

  // ✅ Handle Search Logic
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setFilteredFlats(flats);
      return;
    }

    const filtered = flats.filter((flat) => {
      const apt = (flat.apartment_name || "").toString().toLowerCase();
      const id = (flat.flat_id || "").toString().toLowerCase();
      // tenant_name might be in tenancies or in flat. We check both.
      const tenantNamesFromTenancies = (flat.tenancies || [])
        .map((t) => (t.tenant_name || t.name || "").toString().toLowerCase())
        .join(" ");
      const tenantField = (flat.tenant_name || "") .toString().toLowerCase() + " " + tenantNamesFromTenancies;

      return apt.includes(q) || id.includes(q) || tenantField.includes(q);
    });
    setFilteredFlats(filtered);
  }, [searchQuery, flats]);

  // ✅ Handle Payment Update
  const handleStatusUpdate = async (e, flatId, currentStatus) => {
    // prevent card onClick navigation
    e.stopPropagation();

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("❌ You must be logged in to perform this action.");
        return;
      }

      const newStatus = currentStatus === "paid" ? "unpaid" : "paid";
      let paidDate = null;

      if (newStatus === "paid") {
        const modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = "0";
        modal.style.left = "0";
        modal.style.width = "100vw";
        modal.style.height = "100vh";
        modal.style.background = "rgba(0, 0, 0, 0.5)";
        modal.style.display = "flex";
        modal.style.alignItems = "center";
        modal.style.justifyContent = "center";
        modal.style.zIndex = "1000";

        const box = document.createElement("div");
        box.style.background = "#fff";
        box.style.padding = "20px";
        box.style.borderRadius = "10px";
        box.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
        box.style.textAlign = "center";

        box.innerHTML = `
          <h3 style="margin-bottom:10px;">📅 Select Paid Date</h3>
          <input type="date" id="paidDateInput" style="padding:6px; border:1px solid #ccc; border-radius:5px;">
          <br><br>
          <button id="confirmBtn" style="background:#22c55e;color:white;padding:6px 12px;border:none;border-radius:5px;cursor:pointer;">Confirm</button>
          <button id="cancelBtn" style="margin-left:8px;background:#ef4444;color:white;padding:6px 12px;border:none;border-radius:5px;cursor:pointer;">Cancel</button>
        `;
        modal.appendChild(box);
        document.body.appendChild(modal);

        paidDate = await new Promise((resolve) => {
          box.querySelector("#confirmBtn").onclick = () => {
            const selected = box.querySelector("#paidDateInput").value;
            if (!selected) {
              alert("⚠️ Please select a date");
              return;
            }
            const formatted = new Date(selected)
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-");
            resolve(formatted);
            modal.remove();
          };
          box.querySelector("#cancelBtn").onclick = () => {
            modal.remove();
            resolve(null);
          };
        });

        if (!paidDate) {
          alert("❌ Payment date is required!");
          return;
        }
      }

      const { data, error } = await supabase
        .from("flats")
        .update({
          status: newStatus,
          paid_on: newStatus === "paid" ? paidDate : null,
        })
        .ilike("flat_id", flatId)
        .select("*");

      if (error) throw error;

      setFlats((prev) =>
        prev.map((flat) =>
          flat.flat_id === flatId
            ? { ...flat, status: newStatus, paid_on: paidDate }
            : flat
        )
      );

      // update filtered too so UI reflects change immediately
      setFilteredFlats((prev) =>
        prev.map((flat) =>
          flat.flat_id === flatId
            ? { ...flat, status: newStatus, paid_on: paidDate }
            : flat
        )
      );

      alert(`✅ Status updated to ${newStatus.toUpperCase()}${paidDate ? ` on ${paidDate}` : ""}`);
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      alert("Something went wrong. Check console for details.");
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
        className="w-full md:w-2/3 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 
                   bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>

    {/* ADD FLAT FORM */}
    {isAdmin && showForm && (
      <AddFlatsForm onClose={() => setShowForm(false)} onFlatAdded={() => fetchFlats(filter)} />
    )}

    {/* FILTERS */}
    {isAdmin && (
      <div className="space-y-2 text-center">
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg shadow 
              ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-white"}`}
          >
            All
          </button>

          <button
            onClick={() => setFilter("filled")}
            className={`px-4 py-2 rounded-lg shadow 
              ${filter === "filled" ? "bg-green-600 text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-white"}`}
          >
            Filled Flats
          </button>

          <button
            onClick={() => setFilter("vacant")}
            className={`px-4 py-2 rounded-lg shadow 
              ${filter === "vacant" ? "bg-yellow-500 text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-white"}`}
          >
            Vacant Flats
          </button>
        </div>

        {/* COUNTS */}
        <p className="text-gray-700 dark:text-gray-300 font-medium">
          Total Flats: {flats.length} |
          Filled: {flats.filter(f => (f.tenancies || []).length > 0).length} |
          Vacant: {flats.filter(f => !(f.tenancies || []).length).length}
        </p>
      </div>
    )}

    {/* ====== SECTION TITLE ====== */}
    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white flex items-center justify-center gap-2">
      🏠 Available Flats
    </h2>

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
            className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                       shadow hover:shadow-lg transform hover:-translate-y-1 transition cursor-pointer"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {flat.apartment_name}
            </h3>

            <p className="text-gray-700 dark:text-gray-300">🏠 Flat Number: {flat.flat_id}</p>
            <p className="text-gray-700 dark:text-gray-300">💰 Rent: ₹{flat.rent_amount}</p>
            <p className="text-gray-700 dark:text-gray-300">📅 Due Date: {flat.due_date ? new Date(flat.due_date).toLocaleDateString("en-IN") : "—"}</p>

            <p className="text-gray-700 dark:text-gray-300">
              🟢 Status:
              <span className={`font-semibold ml-1 ${flat.status === "paid" ? "text-green-500" : "text-red-500"}`}>
                {flat.status}
              </span>
            </p>

            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusUpdate(e, flat.flat_id, flat.status);
                }}
                className={`mt-3 w-full px-4 py-2 rounded-lg text-white 
                  ${flat.status === "paid" ? "bg-red-500" : "bg-green-600"}`}
              >
                {flat.status === "paid" ? "Mark Unpaid" : "Mark Paid"}
              </button>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

 

}
