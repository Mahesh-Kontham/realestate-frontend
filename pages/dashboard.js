import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AddFlatsForm from "../components/AddFlatsForm";
import Link from "next/link";

export default function Dashboard() {
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // ✅ Fetch logged-in user
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
      } else {
        setUser(user);
      }
    }
    getUser();
  }, []);

  // ✅ Determine if the user is admin
  const isAdmin = user?.email === "admin@realestate.com";

  // ✅ Fetch flats from Supabase
  const fetchFlats = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("flats").select("*");
    if (error) console.error("Error fetching flats:", error);
    else setFlats(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFlats();
  }, []);

  // ✅ Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert("You have logged out");
    router.push("/");
  };

  // ✅ Handle payment status update (Admin only)
  const handleStatusUpdate = async (flatId, currentStatus) => {
    try {
    // ✅ Get logged-in user (to include JWT in RLS)
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

      // Wait for user to select date
      paidDate = await new Promise((resolve) => {
        box.querySelector("#confirmBtn").onclick = () => {
          const selected = box.querySelector("#paidDateInput").value;
          if (!selected) {
            alert("⚠️ Please select a date");
            return;
          }
          const formatted = new Date(selected)
            .toLocaleDateString("en-GB") // ✅ DD-MM-YYYY format
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

    console.log("🟢 Updating Flat:", flatId, "→", newStatus, paidDate);

    // ✅ Perform update
    const { data, error } = await supabase
      .from("flats")
      .update({
        status: newStatus,
        paid_on: newStatus === "paid" ? paidDate : null,
      })
      .ilike("flat_id", flatId)
      .select("*");

    if (error) {
      console.error("❌ Supabase Error:", error);
      alert("Failed to update Supabase: " + error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert("⚠️ No rows updated. Check flat_id and RLS policies.");
      return;
    }

    console.log("✅ Supabase Updated Data:", data);

    // ✅ Update frontend state
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
    <div className="dashboard">
      {/* 🔝 Navbar */}
      <div className="navbar">
        {isAdmin && (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "10px",
      marginBottom: "20px",
    }}
  >
    {/* ➕ Add Flat + Tenant (Side by Side) */}
    <div style={{ display: "flex", gap: "10px" }}>
      <button
        className="add-btn"
        onClick={() => setShowForm(true)}
        style={{
          backgroundColor: "#22c55e", // green
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
          backgroundColor: "#3b82f6", // blue
          color: "white",
          padding: "8px 14px",
          borderRadius: "8px",
          fontSize: "14px",
          textDecoration: "none",
          fontWeight: "500",
          transition: "background-color 0.2s ease",
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#2563eb")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#3b82f6")}
      >
        ➕ Add Tenant
      </Link>
    </div>

    {/* 🔚 Tenant Exit Wizard (Below Buttons) */}
    <Link
      href="/tenants/TenantExitWizard"
      style={{
        backgroundColor: "#f97316", // orange
        color: "white",
        padding: "8px 14px",
        borderRadius: "8px",
        fontSize: "14px",
        textDecoration: "none",
        fontWeight: "500",
        transition: "background-color 0.2s ease",
      }}
      onMouseOver={(e) => (e.target.style.backgroundColor = "#ea580c")}
      onMouseOut={(e) => (e.target.style.backgroundColor = "#f97316")}
    >
      🔚 Tenant Exit Wizard
    </Link>
  </div>
)}
      </div>

      {/* 🧑‍💻 Role Display */}
      {user && (
        <p
          style={{
            textAlign: "right",
            margin: "10px 0",
            fontWeight: "bold",
            color: isAdmin ? "#2563eb" : "#16a34a",
          }}
        >
          Logged in as {user.email} ({isAdmin ? "Admin" : "Owner"})
        </p>
      )}


      {/* Add Flat Form — only Admin can use */}
      {isAdmin && showForm && (
        <AddFlatsForm
          onClose={() => setShowForm(false)}
          onFlatAdded={fetchFlats}
        />
      )}

      <h2
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "28px",
          fontWeight: "600",
          color: "#2c3e50",
          marginBottom: "20px",
        }}
      >
        🏠 Available Flats
      </h2>

      {/* 🏗️ Flats Grid */}
      {loading ? (
        <p>Loading flats...</p>
      ) : flats.length === 0 ? (
        <p>No flats found.</p>
      ) : (
        <div className="flats-grid">
          {flats.map((flat) => (
            <div
                key={flat.flat_id}
                className="flat-card"
                style={{ cursor: "pointer" }}
                onClick={() => router.push(`/tenants/${flat.flat_id}`)}>
              <h3>{flat.apartment_name}</h3>
              {/* 🏠 Flat Number */}
              <p>🏠 Flat Number: {flat.flat_id || "—"}</p>

              {/* 💰 Rent */}
              <p>💰 Rent: ₹{flat.rent_amount || 0}</p>

              {/* 📅 Due Date */}
              <p className="mt-2">
                📅 Due Date:{" "}
                {flat.due_date
                  ? new Date(flat.due_date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </p>

              {/* 🟢 Status */}
              <p>
                🟢 Status (
                {new Date().toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
                ):
                <span
                  style={{
                    color: flat.status === "paid" ? "green" : "red",
                    fontWeight: "bold",
                    marginLeft: "5px",
                  }}
                >
                  {flat.status || "unpaid"}
                </span>
              </p>
              {flat.status === "paid" && flat.paid_on && (
                <p>🗓️ Paid On: {new Date(flat.paid_on).toLocaleDateString("en-IN")}</p>
              )}


              {/* ✅ Paid Button (Admin Only) */}
              {isAdmin && (
                <button
                  onClick={() =>
                    handleStatusUpdate(flat.flat_id, flat.status)
                  }
                  style={{
                    backgroundColor:
                      flat.status === "paid" ? "#f87171" : "#4ade80",
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
