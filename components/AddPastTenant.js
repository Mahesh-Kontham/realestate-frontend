// components/AddPastTenant.jsx
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AddPastTenant({ flatId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    flat_id: flatId || "",
    tenant_name: "",
    start_date: "",
    end_date: "",
    reason_for_exit: "",
    deposit_amount: "",
    phone_number: null,
    email:  null,
    occupation:  null
    
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

const handleSubmit = async () => {
  if (!form.flat_id) {
    alert("⚠️ Flat ID is required");
    return;
  }
  

  let pdfUrl = null;

  // 1️⃣ Upload PDF FIRST (correct order)
  if (form.pdfFile) {
    const fileName = `previous_tenants/${form.flat_id}_${Date.now()}.pdf`;

    const { error: uploadErr } = await supabase.storage
      .from("tenant-docs")
      .upload(fileName, form.pdfFile);

    if (uploadErr) {
      console.error("Upload failed:", uploadErr);
      alert("Failed to upload PDF");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("tenant-docs")
      .getPublicUrl(fileName);

    pdfUrl = urlData.publicUrl;
  }

  // 2️⃣ Insert AFTER pdfUrl is created
  const { error } = await supabase.from("tenancies").insert([
    {
      flat_id: form.flat_id,
      tenant_name: form.tenant_name,
      start_date: form.start_date,
      end_date: form.end_date,
      reason_for_exit: form.reason_for_exit,
      deposit_amount: Number(form.deposit_amount),
      is_active: false,
      pdf_url: pdfUrl,                     // now safe
      pdf_uploaded_at: pdfUrl ? new Date().toISOString() : null,
    }
  ]);

  if (error) {
    alert("❌ Failed to add tenant");
    console.error(error);
  } else {
    alert("✅ Past tenant added successfully!");
    onSuccess();
    onClose();
  }
};
 const styles = {
    container:
    {
      maxWidth: "500px",
      margin: "50px auto",
      padding: "24px",
      border: "1px solid #ddd",
      borderRadius: "12px",
      backgroundColor: "white"
    },
    heading: {
      textAlign: "center",
      marginBottom: "20px",
      fontWeight: "600",
      fontSize: "22px",
  
    },
    form: { display: "flex", flexDirection: "column", gap: "14px" },
    input: { padding: "10px", border: "1px solid #ccc", borderRadius: "6px" },
    select: { padding: "10px", border: "1px solid #ccc", borderRadius: "6px" },
    fileInput: { border: "1px solid #ccc", padding: "8px", borderRadius: "6px" },
    button: {
      marginTop: "10px",
      backgroundColor: "#22c55e",
      color: "#fff",
      padding: "12px",
      fontSize: "15px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
    },
    backBtn: {
      marginTop: "15px",
      backgroundColor: "#2563eb",
      color: "#fff",
      padding: "10px",
      fontSize: "15px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
    },
  };

  return (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
    <div
      className="
        bg-white dark:bg-gray-800 
        p-6 rounded-xl 
        w-full max-w-md 
        shadow-lg 
        max-h-[90vh] 
        overflow-y-auto 
        scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600
      "
    >
      <h2 className="text-xl font-semibold mb-5 dark:text-white">
        Add Past Tenant
      </h2>

      <div className="flex flex-col gap-4">

        {/* 🏠 FLAT ID INPUT */}
        <input
          type="text"
          name="flat_id"
          placeholder="Flat ID (e.g., C-203 or flat-101)"
          value={form.flat_id}
          onChange={handleChange}
          className="p-3 rounded-lg border border-gray-300 
                     dark:bg-gray-800 dark:text-white dark:border-gray-600 
                     dark:placeholder-gray-400 outline-none focus:ring-2 
                     focus:ring-blue-500"
        />

        {/* Tenant Name */}
        <input
          type="text"
          name="tenant_name"
          placeholder="Tenant Name"
          value={form.tenant_name}
          onChange={handleChange}
          className="p-3 rounded-lg border border-gray-300 
                     dark:bg-gray-800 dark:text-white dark:border-gray-600
                     dark:placeholder-gray-400 outline-none focus:ring-2 
                     focus:ring-blue-500"
        />

        {/* Phone Number */}
        <div>
          <label className="text-sm font-medium dark:text-gray-300">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone_number"
            placeholder="Enter phone number"
            value={form.phone_number || ""}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded-lg bg-white 
                       dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-sm font-medium dark:text-gray-300">
            Email
          </label>
          <input
            type="email"
            name="tenant_email"
            placeholder="Enter email"
            value={form.tenant_email || ""}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded-lg bg-white 
                       dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Occupation */}
          {/* Occupation */}
        <label className="dark:text-gray-300">Occupation</label>
        <select
          name="occupation_type"
          value={form.occupation_type}
          onChange={handleChange}
          required
          style={styles.select}
          className="dark:bg-gray-700 dark:border-gray-500"
        >
          <option value="">Select Occupation</option>
          <option value="Working">Working</option>
          <option value="Business">Business</option>
        </select>

        {form.occupation_type === "Working" && (
          <>
            <input
              type="text"
              name="company_name"
              placeholder="Company Name"
              value={form.company_name}
              onChange={handleChange}
              required
              style={styles.input}
              className="dark:bg-gray-700 dark:border-gray-500"
            />

            <label className="dark:text-gray-300">Offer Letter / ID</label>
            <input
              type="file"
              name="offerLetterFile"
              accept="image/*,.pdf"
              onChange={handleChange}
              required
              style={styles.fileInput}
              className="dark:bg-gray-700 dark:border-gray-500"
            />
          </>
        )}
        {form.occupation_type === "Business" && (
          <input
            type="text"
            name="business_name"
            placeholder="Business Name"
            value={form.business_name}
            onChange={handleChange}
            required
            style={styles.input}
            className="dark:bg-gray-700 dark:border-gray-500"
          />
        )}
           <label className="dark:text-gray-300">Family / Bachelors</label>
        <select
          name="family_status"
          value={form.family_status}
          onChange={handleChange}
          required
          style={styles.select}
          className="dark:bg-gray-700 dark:border-gray-500"
        >
          <option value="">Select Type</option>
          <option value="Family">Family</option>
          <option value="Bachelors">Bachelors</option>
        </select>

        {/* Family Members */}
        {form.family_status === "Family" && (
          <input
            type="number"
            name="family_members"
            placeholder="Number of Family Members"
            value={form.family_members}
            onChange={(e) =>
              e.target.value >= 1 &&
              setForm({ ...form, family_members: e.target.value })
            }
            required
            style={styles.input}
            className="dark:bg-gray-700 dark:border-gray-500"
          />
        )}
        {form.family_status === "Bachelors" && (
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            required
            style={styles.select}
            className="dark:bg-gray-700 dark:border-gray-500"
          >
            <option value="">Select Gender</option>
            <option value="Men">Male</option>
            <option value="Women">Female</option>
          </select>
        )}

        {/* Start Date */}
        <div>
          <label className="text-sm dark:text-gray-300">Start Date</label>
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            className="p-3 rounded-lg border border-gray-300 
                       dark:bg-gray-800 dark:text-white dark:border-gray-600 
                       outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        </div>

        {/* Moved Out Date */}
        <div>
          <label className="text-sm dark:text-gray-300">Moved Out On</label>
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            className="p-3 rounded-lg border border-gray-300 
                       dark:bg-gray-800 dark:text-white dark:border-gray-600 
                       outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        </div>

        {/* Reason for exit */}
        <textarea
          name="reason_for_exit"
          placeholder="Reason for exit"
          value={form.reason_for_exit}
          onChange={handleChange}
          className="p-3 h-24 rounded-lg border border-gray-300 
                     dark:bg-gray-800 dark:text-white dark:border-gray-600 
                     dark:placeholder-gray-400 outline-none focus:ring-2 
                     focus:ring-blue-500"
        />

        {/* Deposit Amount (numeric only, no spinner) */}
        <input
          type="text"
          name="deposit_amount"
          placeholder="Deposit Amount"
          value={form.deposit_amount}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            setForm({ ...form, deposit_amount: value });
          }}
          className="p-3 rounded-lg border border-gray-300 
                     dark:bg-gray-800 dark:text-white dark:border-gray-600
                     dark:placeholder-gray-400 outline-none focus:ring-2 
                     focus:ring-blue-500"
        />

        {/* PDF Upload */}
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setForm({ ...form, pdfFile: e.target.files[0] })}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* FOOTER BUTTONS */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-gray-300 
                     dark:bg-gray-700 dark:text-white hover:bg-gray-400"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white 
                     hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  </div>
);
  
}
