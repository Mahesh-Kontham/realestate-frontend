// pages/tenants/[flat_id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function TenantDetails() {
  const router = useRouter();
  const { flat_id } = router.query;

  const [flat, setFlat] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [pastTenants, setPastTenants] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userRole, setUserRole] = useState(null); // admin or owner
  const [currentUser, setCurrentUser] = useState(null);

  // -------------------------
  // 🔐 Fetch User Role (Admin/Owner)
  // -------------------------
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const email = data.user.email;
        setCurrentUser(email);
        setUserRole(email === "admin@realestate.com" ? "admin" : "owner");
      }
    };
    getUser();
  }, []);

  // -------------------------
  // 📄 Fetch Documents
  // -------------------------
  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from("rental_documents")
      .select("*")
      .eq("flat_id", flat_id)
      .order("uploaded_at", { ascending: false });

    if (!error) setDocuments(data || []);
  };

  useEffect(() => {
    if (flat_id) fetchDocuments();
  }, [flat_id]);

  // -------------------------
  // 🏡 Fetch Flat & Tenant Details
  // -------------------------
  const fetchDetails = async () => {
    setLoading(true);

    const { data: flatData } = await supabase
      .from("flats")
      .select("*")
      .eq("flat_id", flat_id)
      .single();

    const { data: activeTenant } = await supabase
      .from("tenancies")
      .select("*")
      .eq("flat_id", flat_id)
      .eq("is_active", true)
      .single();

    const { data: oldTenants } = await supabase
      .from("tenancies")
      .select("*")
      .eq("flat_id", flat_id)
      .eq("is_active", false);

    const { data: maintenanceHistory } = await supabase
      .from("maintenance")
      .select("*")
      .eq("flat_id", flat_id)
      .order("reported_at", { ascending: false });

    setFlat(flatData);
    setTenant(activeTenant);
    setPastTenants(oldTenants || []);
    setRepairs(maintenanceHistory || []);
    setLoading(false);
  };

  useEffect(() => {
    if (flat_id) fetchDetails();
  }, [flat_id]);

  // -------------------------
  // 📤 File Upload (Admin Only)
  // -------------------------
  const handleFileUpload = async (e, type) => {
    if (userRole !== "admin") return alert("Only admin can upload files.");

    const file = e.target.files[0];
    if (!file) return;

    const folder = type === "agreement" ? "rental-agreements" : "rent-screenshots";
    const month = type === "payment" ? new Date().toISOString().slice(0, 7) : null;

    try {
      const path = `${folder}/${flat_id}_${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("tenant-docs")
        .upload(path, file);

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("tenant-docs")
        .getPublicUrl(path);

      await supabase.from("rental_documents").insert([
        {
          flat_id,
          tenant_id: tenant?.id || null,
          type,
          month,
          file_url: urlData.publicUrl,
          uploaded_by: currentUser,
        },
      ]);

      alert("Uploaded successfully");
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  if (loading)
    return (
      <p className="text-center mt-20 text-gray-600 dark:text-gray-300">
        Loading flat details...
      </p>
    );

  if (!flat)
    return (
      <p className="text-center mt-20 text-red-500 dark:text-red-400">
        Flat not found.
      </p>
    );

  // ===========================================================
  // 🔥 UI STARTS HERE — SUPER PROFESSIONAL
  // ===========================================================

  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition">

      {/* 🔙 Back Button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-6 text-blue-600 dark:text-blue-400 hover:underline"
      >
        ← Back to Dashboard
      </button>

      {/* ===========================
          🏡 FLAT OVERVIEW CARD
      ============================ */}
      <div className="card p-6 mb-8">
        <h1 className="text-2xl font-semibold mb-2">
          🏡 {flat.apartment_name} — {flat.flat_id}
        </h1>

        <p>💰 Rent: ₹{flat.rent_amount}</p>
        <p>
          📅 Due Date:{" "}
          {flat.due_date
            ? new Date(flat.due_date).toLocaleDateString("en-IN")
            : "Not Set"}
        </p>
        <p>📩 Owner: {flat.owner_email}</p>

        {userRole === "admin" && tenant?.email && (
          <p className="mt-2">
            📧 Tenant Email:{" "}
            <span className="font-medium">{tenant.email}</span>
          </p>
        )}
      </div>

      {/* ===========================
          👤 CURRENT TENANT
      ============================ */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">👤 Current Tenant</h2>

        {tenant ? (
          <div className="grid grid-cols-2 gap-y-2">
            <p><strong>Name:</strong> {tenant.tenant_name}</p>
            <p><strong>Age:</strong> {tenant.age}</p>

            <p><strong>Occupation:</strong> {tenant.occupation_type}</p>
            {tenant.company_name && (
              <p><strong>Company:</strong> {tenant.company_name}</p>
            )}
            {tenant.business_name && (
              <p><strong>Business:</strong> {tenant.business_name}</p>
            )}

            <p><strong>Family Status:</strong> {tenant.family_status}</p>

            {userRole === "admin" && tenant.phone_number && (
              <p><strong>Phone:</strong> {tenant.phone_number}</p>
            )}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No active tenant.</p>
        )}
      </div>

      {/* ===========================
          🛠️ MAINTENANCE
      ============================ */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">🛠️ Maintenance History</h2>

        {repairs.length > 0 ? (
          repairs.map((r) => (
            <div key={r.id} className="border-b border-gray-200 dark:border-gray-700 py-3">
              <p className="font-semibold">{r.category} ({r.severity})</p>
              <p className="text-gray-600 dark:text-gray-400">{r.description}</p>
              <p className="text-sm text-gray-500">
                Reported on {new Date(r.reported_at).toLocaleDateString("en-IN")}
              </p>
              <p className="text-sm">Cost: ₹{r.cost || 0}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No maintenance records.</p>
        )}
      </div>

      {/* ===========================
          📁 DOCUMENTS
      ============================ */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">📁 Rental Documents</h2>

        {userRole === "admin" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-1 font-medium">Upload Agreement:</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e, "agreement")}
                className="w-full border p-2 rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Upload Payment Proof:</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e, "payment")}
                className="w-full border p-2 rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>
        )}

        {documents.length > 0 ? (
          <ul className="list-disc ml-6">
            {documents.map((doc) => (
              <li key={doc.id} className="mb-2">
                <strong className="mr-2">
                  {doc.type === "agreement" ? "📄 Agreement" : `💵 Payment (${doc.month})`}
                </strong>
                <a
                  href={doc.file_url}
                  target="_blank"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View / Download
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No documents uploaded.</p>
        )}
      </div>

    </div>
  );
}
