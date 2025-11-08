import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Dialog } from "@headlessui/react";

export default function TenantDetails() {
  const router = useRouter();
  const { flat_id } = router.query;
   const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantRepairs, setTenantRepairs] = useState([]);

  const [flat, setFlat] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [pastTenants, setPastTenants] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!flat_id) return;

    const fetchDetails = async () => {
      setLoading(true);
      const { data: flatData } = await supabase
        .from("flats")
        .select("*")
        .ilike("flat_id", flat_id)
        .single();

      const { data: tenantData } = await supabase
        .from("tenancies")
        .select("*")
        .ilike("flat_id", flat_id)
        .eq("is_active", true)
        .single();

      const { data: oldTenants } = await supabase
        .from("tenancies")
        .select("*")
        .ilike("flat_id", flat_id)
        .eq("is_active", false)
        .order("moved_out_on", { ascending: false });

      const { data: repairHistory } = await supabase
        .from("maintenance")
        .select("*")
        .ilike("flat_id", flat_id)
        .order("reported_at", { ascending: false });

      setFlat(flatData);
      setTenant(tenantData);
      setPastTenants(oldTenants || []);
      setRepairs(repairHistory || []);
      setLoading(false);
    };

    fetchDetails();
  }, [flat_id]);

  const fetchTenantRepairs = async (tenancyId) => {
  const { data, error } = await supabase
    .from("maintenance")
    .select("*")
    .eq("tenancy_id", tenancyId)
    .order("reported_at", { ascending: false });
  
  if (error) console.error("Error fetching tenant maintenance:", error);
  setTenantRepairs(data || []);
};

  if (loading) return <p className="text-center text-gray-600 mt-10">Loading flat details...</p>;

  if (!flat) return <p className="text-center text-red-500 mt-10">Flat not found.</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 🔙 Back to Dashboard */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-4 text-blue-600 font-semibold hover:underline"
      >
        ← Back to Dashboard
      </button>

      {/* 🏡 Flat Overview */}
      <div className="bg-white shadow-md rounded-2xl p-6 mb-8 border border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          🏡 {flat.apartment_name} ({flat.flat_id})
        </h1>
        <p className="text-gray-600">💰 Rent: ₹{flat.rent_amount || 0}</p>
        <p className="text-gray-600">📅 Due Date: {flat.Due_Date || "Not set"}</p>
        <p className="text-gray-600">📩 Owner: {flat.owner_email}</p>
      </div>

      {/* 👤 Current Tenant */}
     <div className="bg-white shadow-md rounded-2xl p-6 mb-8 border border-gray-200">
  <h2 className="text-xl font-semibold text-gray-800 mb-4">👤 Current Tenant</h2>

  {tenant ? (
    <div
      className="grid grid-cols-2 gap-4 cursor-pointer hover:bg-gray-50 rounded-md p-3 transition"
      onClick={() => {
        setSelectedTenant(tenant);
        fetchTenantRepairs(tenant.id);
      }}
      title="Click to view maintenance history"
    >
      <p><strong>Name:</strong> {tenant.tenant_name}</p>
      <p><strong>Age:</strong> {tenant.age}</p>
      <p><strong>Occupation:</strong> {tenant.occupation_type}</p>
      <p><strong>Family:</strong> {tenant.family_status}</p>
      {tenant.salary && <p><strong>Salary:</strong> ₹{tenant.salary}</p>}
      {tenant.gender && <p><strong>Gender:</strong> {tenant.gender}</p>}
      {tenant.aadhar_url && (
        <p>
          <strong>Aadhaar:</strong>{" "}
          <a
            href={tenant.aadhar_url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            View File
          </a>
        </p>
      )}
      {tenant.pan_url && (
        <p>
          <strong>PAN:</strong>{" "}
          <a
            href={tenant.pan_url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            View File
          </a>
        </p>
      )}
    </div>  
  ) : (
    <p className="text-gray-600">No active tenant for this flat.</p>
  )}
</div>

      {/* 📜 Previous Tenants */}
      <div className="bg-white shadow-md rounded-2xl p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📜 Tenant History</h2>
        {pastTenants.length > 0 ? (
          pastTenants.map((t) => (
            <div
              key={t.id}
              className="border-b border-gray-100 pb-3 mb-3 last:border-none last:mb-0 cursor-pointer hover:bg-gray-50 rounded-md p-2 transition"
              onClick={() => {
                setSelectedTenant(t);
                fetchTenantRepairs(t.id);
              }}
            >
              <p className="font-medium text-gray-800">{t.tenant_name}</p>
              <p className="text-gray-600 text-sm">
                Stayed: {t.start_date} → {t.moved_out_on || "N/A"}
              </p>
              <p className="text-gray-600 text-sm">
                Reason for Exit: {t.reason_for_exit || "Not specified"}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No previous tenants found.</p>
        )}
      </div>

      {/* 🛠️ Maintenance History */}
      <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🛠️ Maintenance & Repairs</h2>
        {repairs.length > 0 ? (
          repairs.map((r) => (
            <div
              key={r.id}
              className="border-b border-gray-100 pb-3 mb-3 last:border-none last:mb-0"
            >
              <p><strong>{r.category}</strong> ({r.severity})</p>
              <p className="text-gray-600">{r.description}</p>
              <p className="text-gray-600">Reported: {r.reported_at}</p>
              <p className="text-gray-600">Resolved: {r.resolved_at || "Pending"}</p>
              <p className="text-gray-600">Cost: ₹{r.cost || 0}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No maintenance history for this flat.</p>
        )}
        {/* 🪟 Tenant-specific Maintenance Modal */}
            {selectedTenant && (
              <Dialog
                open={true}
                onClose={() => setSelectedTenant(null)}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
              >
                <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-2xl relative">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">
                    🧾 Maintenance for {selectedTenant.tenant_name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Duration: {selectedTenant.start_date} → {selectedTenant.moved_out_on || "Ongoing"}
                  </p>

                  {tenantRepairs.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      {tenantRepairs.map((r) => (
                        <div key={r.id} className="border-b border-gray-200 pb-2 mb-2">
                          <p><strong>{r.category}</strong> ({r.severity})</p>
                          <p className="text-gray-600">{r.description}</p>
                          <p className="text-gray-500 text-sm">Reported: {r.reported_at}</p>
                          <p className="text-gray-500 text-sm">
                            Resolved: {r.resolved_at || "Pending"}
                          </p>
                          <p className="text-gray-600">Cost: ₹{r.cost || 0}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No maintenance records for this tenant.</p>
                  )}

                  <button
                    className="absolute top-3 right-4 text-gray-500 hover:text-red-500"
                    onClick={() => setSelectedTenant(null)}
                  >
                    ✖
                  </button>
                </div>
              </Dialog>
            )}
      </div>
    </div>
  );
}
