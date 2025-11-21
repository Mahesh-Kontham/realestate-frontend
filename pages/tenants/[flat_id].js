// pages/tenants/[flat_id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import DocumentViewerModal from "../../components/DocumentViewerModal";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import EditPreviousTenantModal from "@/components/EditPreviousTenantModal";
import DeletePreviousTenantModal from "@/components/DeletePreviousTenantModal";
import EditMaintenanceModal from "../../components/EditMaintenanceModal";
import DeleteMaintenanceModal from "../../components/DeleteMaintenanceModal";
import DeleteTenantModal from "@/components/DeleteTenantModal";
import EditTenantModal from "@/components/EditTenantModal";
import EditDocumentModal from "@/components/EditDocumentModal";
import DeleteDocumentModal from "@/components/DeleteDocumentModal";

export default function TenantDetails() {
  const router = useRouter();
  const { flat_id } = router.query;

  const [flat, setFlat] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [pastTenants, setPastTenants] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  

const [userRole, setUserRole] = useState(null);
const [currentUser, setCurrentUser] = useState(null);
const [selectedDoc, setSelectedDoc] = useState(null);
const [showDocumentModal, setShowDocumentModal] = useState(false);
const [selectedDocument, setSelectedDocument] = useState(null);

const [selectedPastTenant, setSelectedPastTenant] = useState(null);
const [showPastTenantModal, setShowPastTenantModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [showDeleteModal, setShowDeleteModal] = useState(false);

const [maintenanceHistory, setMaintenanceHistory] = useState([]);
const [selectedMaintenance, setSelectedMaintenance] = useState(null);
const [showEditMaintenanceModal, setShowEditMaintenanceModal] = useState(false);
const [maintenanceToDelete, setMaintenanceToDelete] = useState(null);
const [showDeleteMaintenanceModal, setShowDeleteMaintenanceModal] = useState(false);

const [showEditTenantModal, setShowEditTenantModal] = useState(false);
const [tenantToEdit, setTenantToEdit] = useState(null);
const [showDeleteTenantModal, setShowDeleteTenantModal] = useState(false);
const [tenantToDelete, setTenantToDelete] = useState(null);

const [docToEdit, setDocToEdit] = useState(null);
const [showEditDocModal, setShowEditDocModal] = useState(false);
const [docToDelete, setDocToDelete] = useState(null);
const [showDeleteDocModal, setShowDeleteDocModal] = useState(false);



const openEditPastTenantModal = (tenant) => {
  setSelectedPastTenant(tenant);
  setShowEditModal(true);
};

const openDeletePastTenantModal = (id) => {
  setSelectedPastTenant({ id });
  setShowDeleteModal(true);
} ;

const openEditMaintenanceModal = (maintenance) => {
  setSelectedMaintenance(maintenance);
  setShowEditMaintenanceModal(true);
};


const openDeleteMaintenanceModal = (id) => {
  setMaintenanceToDelete(id);
  setShowDeleteMaintenanceModal(true);
};

const openEditTenantModal = (tenantData) => {
  setTenantToEdit(tenantData);
  setShowEditTenantModal(true);
};

const openDeleteTenantModal = (tenantId) => {
  setTenantToDelete(tenantId);
  setShowDeleteTenantModal(true);
};

const openEditDocumentModal = (doc) => {
  setDocToEdit(doc);
  setShowEditDocModal(true);
};

const openDeleteDocumentModal = (doc) => {
  setDocToDelete(doc);   // store full row object
  setShowDeleteDocModal(true);
};

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
}, [flat_id, fetchDocuments]);

  // -------------------------
  // 🏡 Fetch Flat & Tenant & Past Tenants & Maintenance
  // -------------------------
  const fetchDetails = async () => {
    setLoading(true);

    // Fetch flat
    const { data: flatData } = await supabase
      .from("flats")
      .select("*")
      .eq("flat_id", flat_id)
      .single();

    // Current tenant
    const { data: activeTenant } = await supabase
      .from("tenancies")
      .select("*")
      .eq("flat_id", flat_id)
      .eq("is_active", true)
      .single();

    // Past tenants
    const { data: oldTenants } = await supabase
      .from("tenancies")
      .select("*")
      .eq("flat_id", flat_id)
      .eq("is_active", false);

    // Maintenance History FIXED
    const { data: maintenanceData, error: maintenanceError } = await supabase
  .from("maintenance")
  .select("*")
  .eq("flat_id", flat_id)
  .order("reported_at", { ascending: false });

if (maintenanceError) {
  console.error("Error fetching maintenance:", maintenanceError);
  setMaintenanceHistory([]);
} else {
  setMaintenanceHistory(Array.isArray(maintenanceData) ? maintenanceData : []);
}

    setFlat(flatData);
    setTenant(activeTenant);
    setPastTenants(oldTenants || []);
    setMaintenanceHistory(maintenanceData || []);
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

  // ===========================
  // LOADING & NOT FOUND STATES
  // ===========================
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
  // 🔥 UI STARTS HERE — FULL PAGE LAYOUT
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
    <div className="card p-6 mb-8 relative">

  <h2 className="text-xl font-semibold mb-4">👤 Current Tenant</h2>

  {/* ⭐ EDIT & DELETE BUTTONS — ADMIN ONLY */}
  {userRole === "admin" && tenant && (
    <div className="absolute top-6 right-6 flex gap-4 z-20">
      <PencilIcon
        className="w-5 h-5 text-blue-500 dark:text-blue-300 cursor-pointer hover:scale-110 transition"
        onClick={() => openEditTenantModal(tenant)}
      />
      <TrashIcon
        className="w-5 h-5 text-red-500 dark:text-red-300 cursor-pointer hover:scale-110 transition"
        onClick={() => openDeleteTenantModal(tenant.id)}
      />
    </div>
  )}

  {/* Tenant Details */}
 {tenant ? (
  <>
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

      {userRole === "admin" && tenant.tenant_email && (
        <p><strong>Email:</strong> {tenant.tenant_email}</p>
      )}

    </div>

    {/* ✅ ID Proofs MUST be outside grid */}
    {userRole === "admin" && (
      <div className="mt-4 p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800">

        <h3 className="text-lg font-semibold dark:text-white mb-2">ID Proofs</h3>

        {/* Aadhaar */}
        <div className="mb-2">
          <p className="font-medium dark:text-gray-300">Aadhaar:</p>
          {tenant?.aadhar_url ? (
            <button
              className="text-blue-600 dark:text-blue-400 hover:underline"
              onClick={() => {
                console.log("Opening Aadhaar →", tenant.aadhar_url);
                setSelectedDoc(tenant.aadhar_url);
                

              }}
            >
              View Aadhaar
            </button>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Not uploaded</p>
          )}
        </div>

        {/* PAN */}
        <div>
          <p className="font-medium dark:text-gray-300">PAN:</p>
          {tenant?.pan_url ? (
            <button
              className="text-blue-600 dark:text-blue-400 hover:underline"
              onClick={() => {
                console.log("Opening PAN →", tenant.pan_url);
                setSelectedDocument(tenant.pan_url);
              }}
            >
              View PAN
            </button>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Not uploaded</p>
          )}
        </div>

      </div>
    )}
  </>
):(
    <p className="text-gray-500 dark:text-gray-400">No active tenant.</p>
  )}
</div>

      {/* ===========================
          🧑‍🤝‍🧑 PREVIOUS TENANTS
      ============================ */}
    <h2 className="text-xl font-semibold mb-4">Previous Tenants</h2>
      {pastTenants.map((t) => (
  <div
    key={t.id}
    onClick={() => {
      setSelectedPastTenant(t);
      setShowPastTenantModal(true);
    }}
    className="relative p-4 rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer 
               hover:shadow-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
  >
    {/* EDIT + DELETE ICONS */}
   {userRole === "admin" && (
  <div className="absolute top-3 right-3 flex gap-3 z-20">

    <PencilIcon
      className="w-5 h-5 text-blue-500 dark:text-blue-300 cursor-pointer hover:scale-110 transition"
      onClick={(e) => {
        e.stopPropagation();
        openEditPastTenantModal(t);
      }}
    />

    <TrashIcon
      className="w-5 h-5 text-red-500 dark:text-red-300 cursor-pointer hover:scale-110 transition"
      onClick={(e) => {
        e.stopPropagation();
        openDeletePastTenantModal(t.id);
      }}
    />

  </div>
)}


    {/* TENANT INFO */}
    <p><strong>Name:</strong> {t.tenant_name}</p>

    <p>
      <strong>Period:</strong>{" "}
      {new Date(t.start_date).toLocaleDateString("en-IN")} →
      {t.end_date
        ? new Date(t.end_date).toLocaleDateString("en-IN")
        : "—"}
    </p>

    {userRole === "admin" && t.phone_number && (
      <p><strong>Phone:</strong> {t.phone_number}</p>
    )}

    {userRole === "admin" && t.tenant_email && (
      <p><strong>Email:</strong> {t.tenant_email}</p>
    )}
      {/* PDF viewer buttons */}
     {t.pdf_url && (
      <div className="mt-2 flex gap-4">
        
        {/* VIEW PDF IN POPUP */}
        <button
          className="text-blue-600 dark:text-blue-300 hover:underline"
          onClick={(e) => {
            console.log("Opening document preview → ", t.pdf_url);

            e.stopPropagation();
            setSelectedDoc(t.pdf_url);
            setShowDocumentModal(true);
          }}
        >
          View PDF
        </button>

        {/* DOWNLOAD PDF */}
        <button
          className="text-green-600 dark:text-green-300 hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            const a = document.createElement("a");
            a.href = t.pdf_url;
            a.download = `PastTenant_${t.tenant_name}.pdf`;
            a.click();
          }}
        >
          Download
        </button>

      </div>
    )}
    

  </div>
))}


      {/* ===========================
          🛠️ MAINTENANCE HISTORY (FIXED)
      ============================ */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">🛠️ Maintenance History</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {maintenanceHistory.length} record{maintenanceHistory.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* If no maintenance records */}
        {maintenanceHistory.length === 0 ? (
          <div className="flex items-center gap-4 p-6 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-700">
              <svg
                className="w-6 h-6 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7v6a4 4 0 004 4h10"
                />
                <path
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 17V7a2 2 0 012-2h2"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-800 dark:text-gray-200 font-medium">No maintenance yet.</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add maintenance from the Dashboard → Add Maintenance
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(maintenanceHistory) && maintenanceHistory.map((m) => (
              <div
                key={m.id}
                className="relative p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                {userRole === "admin" && (
              <div className="absolute top-3 right-3 flex gap-3 z-20">
            <PencilIcon
              className="w-5 h-5 text-blue-500 dark:text-blue-300 cursor-pointer hover:scale-110 transition"
              onClick={(e) => {
                e.stopPropagation();
                openEditMaintenanceModal(m);
              }}
            />
            <TrashIcon
              className="w-5 h-5 text-red-500 dark:text-red-300 cursor-pointer hover:scale-110 transition"
              onClick={(e) => {
                e.stopPropagation();
                openDeleteMaintenanceModal(m.id);
              }}
            />
           </div>
        )}
                <div className="flex items-start justify-between">
                  <div className="flex-1">

                    {/* Title + Category */}
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {m.category || "Maintenance"}
                      </h3>

                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          m.severity === "high"
                            ? "bg-red-200 text-red-700 dark:bg-red-900/40"
                            : m.severity === "medium"
                            ? "bg-yellow-200 text-yellow-700 dark:bg-yellow-900/40"
                            : "bg-green-200 text-green-700 dark:bg-green-900/40"
                        }`}
                      >
                        {m.severity?.toUpperCase() || "UNKNOWN"}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="mt-2 text-gray-700 dark:text-gray-300">
                      {m.description || "No description provided."}
                    </p>

                    {/* Date + Cost */}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 8v4l3 3"
                          />
                        </svg>
                        {new Date(m.reported_at).toLocaleDateString("en-IN")}
                      </span>

                      <span className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6c-1.657 0-3 1.343-3 3v1h6V9c0-1.657-1.343-3-3-3z"
                          />
                        </svg>
                        Cost: ₹{m.cost}
                      </span>
                    </div>
                  </div>

                  {/* Record ID */}
                  {/* <div className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                    ID: {m.id}
                  </div> */}
                </div>
              </div>
            ))}   
          </div>
        )}
      </div>
      {/* ===========================
          📁 DOCUMENTS
      ============================ */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">📁 Rental Documents</h2>

        {/* Admin Upload Inputs */}
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
              <label className="block mb-1 font-medium">
                Upload Payment Proof:
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e, "payment")}
                className="w-full border p-2 rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>
        )}

        {/* Documents List */}
    <ul key={documents.length} className="list-none space-y-4">
  {documents.map((doc) => (
    <li
      key={doc.id}
      className="relative p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
    >
      {/* ADMIN ACTION BUTTONS */}
      {userRole === "admin" && (
        <div className="absolute top-3 right-3 flex gap-4 z-20">
          <PencilIcon
            className="w-5 h-5 text-blue-500 dark:text-blue-300 cursor-pointer hover:scale-110 transition"
            onClick={() => {
               console.log("DOCUMENT BEING DELETED:", doc);
              openEditDocumentModal(doc)}}
          />

          <TrashIcon
            className="w-5 h-5 text-red-500 dark:text-red-300 cursor-pointer hover:scale-110 transition"
            onClick={() => openDeleteDocumentModal(doc)}
          />
        </div>
      )}

      {/* TITLE */}
      <div className="flex flex-col">
  <span className="font-medium">
    {doc.type === "agreement"
      ? "📄 Agreement"
      : doc.type === "payment"
      ? "💵 Payment Proof"
      : doc.type === "exit_pdf"
      ? "📘 Exit Report"
      : "📁 Document"}
  </span>

  <span className="text-xs text-gray-500 dark:text-gray-400">
    Uploaded on {new Date(doc.uploaded_at).toLocaleDateString("en-IN")}
  </span>
</div>


      {/* VIEW BUTTON */}
      <button
        className="text-blue-600 dark:text-blue-400 hover:underline mt-1"
        onClick={() => {
          setSelectedDocument(doc.file_url);
          setShowDocumentModal(true);
        }}
      >
        View
      </button>

      {/* DOWNLOAD BUTTON */}
      <button
        className="text-green-600 dark:text-green-400 hover:underline ml-4"
        onClick={() => {
          const a = document.createElement("a");
          a.href = doc.file_url;
          a.download = doc.file_url.split("/").pop(); // forces download
          document.body.appendChild(a);
          a.click();
          a.remove();
        }}
      >
        Download
      </button>

      
    </li>
  ))}
</ul>


    <DocumentViewerModal
      open={showDocumentModal}
      onClose={() => setShowDocumentModal(false)}
      fileUrl={selectedDocument}
    />


      </div>
              {showPastTenantModal && selectedPastTenant && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-md shadow-lg">

              <h2 className="text-xl font-semibold mb-4 dark:text-white">
                Past Tenant Details
              </h2>

              <div className="space-y-2 dark:text-gray-200">
                <p><strong>Name:</strong> {selectedPastTenant.tenant_name}</p>
                <p><strong>Age:</strong> {selectedPastTenant.age || "—"}</p>
                 <p><strong>Occupation:</strong> {selectedPastTenant.occupation_type || "—"}</p>
                <p><strong>Company:</strong> {selectedPastTenant.company_name || "—"}</p>
                <p><strong>Business:</strong> {selectedPastTenant.business_name || "—"}</p>
                {userRole === "admin" && (
                  <p>
                    <strong>Phone:</strong> {selectedPastTenant.phone_number || "—"}
                  </p>
                )}

                <p>
                  <strong>Period:</strong>{" "}
                  {new Date(selectedPastTenant.start_date).toLocaleDateString("en-IN")} →
                  {selectedPastTenant.end_date
                    ? new Date(selectedPastTenant.end_date).toLocaleDateString("en-IN")
                    : "—"}
                </p>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowPastTenantModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
         )} 
        {selectedDoc && (
      <DocumentViewerModal
        fileUrl={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    )}
           <EditPreviousTenantModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          tenant={selectedPastTenant}
          onUpdated={fetchDetails}
        />

        <DeletePreviousTenantModal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          tenantId={selectedPastTenant?.id}
          onDeleted={fetchDetails}
        />

      <EditMaintenanceModal
  open={showEditMaintenanceModal}
  maintenance={selectedMaintenance}   // ✅ CORRECT
  onClose={() => {
    setSelectedMaintenance(null);
    setShowEditMaintenanceModal(false);
  }}
  onSuccess={() => fetchDetails()}
/>
<DeleteMaintenanceModal
  open={showDeleteMaintenanceModal}
  id={maintenanceToDelete}
  onClose={() => {
    setMaintenanceToDelete(null);
    setShowDeleteMaintenanceModal(false);
  }}
  onSuccess={() => fetchDetails()}
/>
{/* Edit Current Tenant Modal */}
<EditTenantModal
  open={showEditTenantModal}
  tenant={tenantToEdit}
  onClose={() => setShowEditTenantModal(false)}
  onSuccess={() => fetchDetails()}
/>

{/* Delete Current Tenant Modal */}
<DeleteTenantModal
  open={showDeleteTenantModal}
  id={tenantToDelete}
  onClose={() => setShowDeleteTenantModal(false)}
  onSuccess={() => fetchDetails()}
/>
<EditDocumentModal
  open={showEditDocModal}
  doc={docToEdit}
  onClose={() => setShowEditDocModal(false)}
  onSuccess={() => fetchDocuments()}
/>
<DeleteDocumentModal
  open={showDeleteDocModal}
  id={docToDelete?.id}
  fileUrl={docToDelete?.file_url} // <-- USE YOUR COLUMN NAME HERE
  onClose={() => setShowDeleteDocModal(false)}
  onSuccess={fetchDocuments}
/>
{selectedDoc && (
  <DocumentViewerModal
    open={!!selectedDoc}
    fileUrl={selectedDoc}
    onClose={() => setSelectedDoc(null)}
  />
)}
 </div>
 
  );
}
