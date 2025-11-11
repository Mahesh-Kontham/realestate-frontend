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
    <div className="dashboard" style={{ padding: "20px" }}>
      {/* 🔝 Navbar */}
      <div className="navbar">
        {isAdmin && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "10px", marginBottom: "20px" }}>
            {/* ➕ Add Flat + Tenant */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="add-btn"
                onClick={() => setShowForm(true)}
                style={{
                  backgroundColor: "#22c55e",
                  color: "white",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ➕ Add Flat
              </button>

              <Link
                href="/tenants/add"
                style={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                ➕ Add Tenant
              </Link>
            </div>

            <Link
              href="/tenants/TenantExitWizard"
              style={{
                backgroundColor: "#f97316",
                color: "white",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "14px",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              🔚 Tenant Exit Wizard
            </Link>
          </div>
        )}
      </div>

      {/* 🧑‍💻 Role Display */}
      {user && (
        <p style={{ textAlign: "right", margin: "10px 0", fontWeight: "bold", color: isAdmin ? "#2563eb" : "#16a34a" }}>
          Logged in as {user.email} ({isAdmin ? "Admin" : "Owner"})
        </p>
      )}

      {/* 🔍 Search Bar */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
        <input
          type="text"
          placeholder="🔍 Search by Flat ID, Apartment Name, or Tenant..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "70%",
            padding: "10px 15px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            fontSize: "16px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            outline: "none",
            transition: "0.2s ease",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "#ccc")}
        />
      </div>

      {/* Add Flat Form */}
      {isAdmin && showForm && (
        <AddFlatsForm onClose={() => setShowForm(false)} onFlatAdded={() => fetchFlats(filter)} />
      )}

      {/* 🆕 Filter Buttons for Admin */}
      {isAdmin && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button
              onClick={() => setFilter("all")}
              style={{
                backgroundColor: filter === "all" ? "#3b82f6" : "#e5e7eb",
                color: filter === "all" ? "white" : "black",
                padding: "8px 14px",
                borderRadius: "8px",
                fontWeight: "500",
                border: "none",
                cursor: "pointer",
                transition: "0.2s",
              }}
            >
              All
            </button>

            <button
              onClick={() => setFilter("filled")}
              style={{
                backgroundColor: filter === "filled" ? "#16a34a" : "#e5e7eb",
                color: filter === "filled" ? "white" : "black",
                padding: "8px 14px",
                borderRadius: "8px",
                fontWeight: "500",
                border: "none",
                cursor: "pointer",
                transition: "0.2s",
              }}
            >
              Filled Flats
            </button>

            <button
              onClick={() => setFilter("vacant")}
              style={{
                backgroundColor: filter === "vacant" ? "#f59e0b" : "#e5e7eb",
                color: filter === "vacant" ? "white" : "black",
                padding: "8px 14px",
                borderRadius: "8px",
                fontWeight: "500",
                border: "none",
                cursor: "pointer",
                transition: "0.2s",
              }}
            >
              Vacant Flats
            </button>
          </div>

          {/* 🆕 Summary counts */}
          <div style={{ textAlign: "center", marginTop: "6px", color: "#374151", fontWeight: "500" }}>
            <p style={{ margin: 0 }}>
              Total Flats: {flats.length} |
              Filled: {flats.filter(f => (f.tenancies || []).length > 0).length} |
              Vacant: {flats.filter(f => !(f.tenancies || []).length).length}
            </p>
          </div>
        </div>
      )}

      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "28px", fontWeight: "600", color: "#2c3e50", marginBottom: "20px", textAlign: "center" }}>
        🏠 Available Flats
      </h2>

      {/* Flats Grid */}
      {loading ? (
        <p>Loading flats...</p>
      ) : filteredFlats.length === 0 ? (
        <p>No flats found for "{searchQuery}".</p>
      ) : (
        <div className="flats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
          {filteredFlats.map((flat) => (
            <div
              key={flat.flat_id}
              className="flat-card"
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "15px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                transition: "transform 0.2s ease",
                cursor: "pointer",
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onClick={() => router.push(`/tenants/${flat.flat_id}`)}
            >
              <h3 style={{ marginBottom: "8px", color: "#111827" }}>{flat.apartment_name}</h3>
              <p>🏠 Flat Number: {flat.flat_id || "—"}</p>
              <p>💰 Rent: ₹{flat.rent_amount || 0}</p>
              <p>📅 Due Date: {flat.due_date ? new Date(flat.due_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p>
              <p>
                🟢 Status:
                <span style={{ color: flat.status === "paid" ? "green" : "red", fontWeight: "bold", marginLeft: "5px" }}>
                  {flat.status || "unpaid"}
                </span>
              </p>
              {flat.status === "paid" && flat.paid_on && <p>🗓️ Paid On: {new Date(flat.paid_on).toLocaleDateString("en-IN")}</p>}
              {isAdmin && (
                <button
                  onClick={(e) => handleStatusUpdate(e, flat.flat_id, flat.status)}
                  style={{
                    backgroundColor: flat.status === "paid" ? "#f87171" : "#4ade80",
                    color: "#fff",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    marginTop: "8px",
                  }}
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
