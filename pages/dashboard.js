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

  // ✅ Fetch flats
  const fetchFlats = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("flats").select("*");
    if (error) console.error("Error fetching flats:", error);
    else {
      setFlats(data);
      setFilteredFlats(data); // initialize
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFlats();
  }, []);

  // ✅ Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert("You have logged out");
    router.push("/");
  };

  // ✅ Handle Search Logic
  useEffect(() => {
    const filtered = flats.filter((flat) =>
      flat.apartment_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flat.flat_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flat.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFlats(filtered);
  }, [searchQuery, flats]);

  // ✅ Handle Payment Update
  const handleStatusUpdate = async (flatId, currentStatus) => {
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

      alert(`✅ Status updated to ${newStatus.toUpperCase()} on ${paidDate}`);
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
        <AddFlatsForm onClose={() => setShowForm(false)} onFlatAdded={fetchFlats} />
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
                  onClick={() => handleStatusUpdate(flat.flat_id, flat.status)}
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
    