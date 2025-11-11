import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";

export default function AddTenant() {
  const [formData, setFormData] = useState({
    flat_id: "",
    tenant_name: "",
    occupation_type: "",
    company_name: "",
    family_status: "",
    gender: "",
    age: "",
    deposit_amount: "",
    aadharFile: null,
    panFile: null,
    offerLetterFile: null, // 🆕 Added for offer letter / company ID
  });

  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  // ✅ Upload file to Supabase Storage bucket → tenant-docs/{folder}
  const uploadFile = async (file, folder) => {
    try {
      const filePath = `${folder}/${Date.now()}_${file.name}`;

      const { data, error } = await supabase.storage
        .from("tenant-docs")
        .upload(filePath, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("tenant-docs").getPublicUrl(filePath);

      console.log(`✅ Uploaded ${folder} file:`, publicUrl);
      return publicUrl;
    } catch (err) {
      console.error("❌ Upload failed:", err.message);
      alert(`Upload failed: ${err.message}`);
      return null;
    }
  };

  // ✅ Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.flat_id || !formData.tenant_name || !formData.deposit_amount) {
      alert("⚠️ Please fill all required fields including deposit amount.");
      return;
    }

    // 🧠 Validation for “Working” tenants
    if (formData.occupation_type === "Working" && !formData.offerLetterFile) {
      alert("⚠️ Please upload an Offer Letter or Company ID for Working tenants.");
      return;
    }

    setUploading(true);
    let aadharUrl = null;
    let panUrl = null;
    let offerLetterUrl = null;

    try {
      if (formData.aadharFile)
        aadharUrl = await uploadFile(formData.aadharFile, "aadhar");
      if (formData.panFile)
        panUrl = await uploadFile(formData.panFile, "pan");
      if (formData.offerLetterFile)
        offerLetterUrl = await uploadFile(formData.offerLetterFile, "work-docs"); // 🆕 Folder for working docs
    } catch (err) {
      console.error("❌ File upload error:", err);
      alert("File upload failed!");
      setUploading(false);
      return;
    }

    // ✅ Insert into Supabase
    const { data, error } = await supabase.from("tenancies").insert([
      {
        flat_id: formData.flat_id,
        tenant_name: formData.tenant_name,
        occupation_type: formData.occupation_type,
        company_name:
          formData.occupation_type === "Working" ? formData.company_name : null,
        family_status: formData.family_status,
        gender:
          formData.family_status === "Bachelors" ? formData.gender : null,
        age: formData.age,
        deposit_amount: formData.deposit_amount,
        aadhar_url: aadharUrl,
        pan_url: panUrl,
        offer_letter_url: offerLetterUrl, // 🆕 saved in DB
        start_date: new Date().toISOString(),
        is_active: true,
      },
    ]);

    setUploading(false);

    if (error) {
      console.error("❌ Supabase error:", error);
      alert("Failed to add tenant.");
    } else {
      alert("✅ Tenant added successfully!");
      router.push("/dashboard");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>➕ Add Tenant</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          name="flat_id"
          placeholder="Flat ID (e.g. sunshine-101)"
          value={formData.flat_id}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <input
          type="text"
          name="tenant_name"
          placeholder="Tenant Name"
          value={formData.tenant_name}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <input
          type="number"
          name="age"
          placeholder="Age"
          value={formData.age}
          onChange={(e) => {
            const value = e.target.value;
            if (value >= 0) setFormData({ ...formData, age: value });
          }}
          onKeyDown={(e) => {
            if (["-", "+"].includes(e.key)) e.preventDefault();
          }}
          min="1"
          required
          style={styles.input}
        />

        <input
          type="number"
          name="deposit_amount"
          placeholder="💰 Deposit Amount"
          value={formData.deposit_amount}
          onChange={(e) => {
            const value = e.target.value;
            if (value >= 0) setFormData({ ...formData, deposit_amount: value });
          }}
          onKeyDown={(e) => {
            if (["-", "+"].includes(e.key)) e.preventDefault();
          }}
          min="1"
          required
          style={styles.input}
        />

        {/* Occupation Dropdown */}
        <label>Occupation:</label>
        <select
          name="occupation_type"
          value={formData.occupation_type}
          onChange={handleChange}
          required
          style={styles.select}
        >
          <option value="">Select Occupation</option>
          <option value="Working">Working</option>
          <option value="Business">Business</option>
        </select>

        {/* Company details and Offer Letter */}
        {formData.occupation_type === "Working" && (
          <>
            <input
              type="text"
              name="company_name"
              placeholder="Company Name"
              value={formData.company_name}
              onChange={handleChange}
              style={styles.input}
              required
            />

            <label>Upload Offer Letter or Company ID:</label>
            <input
              type="file"
              name="offerLetterFile"
              accept="image/*,.pdf"
              onChange={handleChange}
              style={styles.fileInput}
              required
            />
          </>
        )}

        {/* Family/Bachelors */}
        <label>Family / Bachelors:</label>
        <select
          name="family_status"
          value={formData.family_status}
          onChange={handleChange}
          required
          style={styles.select}
        >
          <option value="">Select Type</option>
          <option value="Family">Family</option>
          <option value="Bachelors">Bachelors</option>
        </select>

        {/* Gender (only for Bachelors) */}
        {formData.family_status === "Bachelors" && (
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            style={styles.select}
          >
            <option value="">Select Gender</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
          </select>
        )}

        {/* File Uploads */}
        <label>Aadhaar Upload:</label>
        <input
          type="file"
          name="aadharFile"
          accept="image/*,.pdf"
          onChange={handleChange}
          style={styles.fileInput}
        />

        <label>PAN Upload:</label>
        <input
          type="file"
          name="panFile"
          accept="image/*,.pdf"
          onChange={handleChange}
          style={styles.fileInput}
        />

        <button type="submit" style={styles.button} disabled={uploading}>
          {uploading ? "Uploading..." : "Add Tenant"}
        </button>
      </form>

      <button style={styles.backBtn} onClick={() => router.push("/dashboard")}>
        🔙 Back to Dashboard
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "500px",
    margin: "50px auto",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    backgroundColor: "#f8fafc",
  },
  heading: {
    textAlign: "center",
    marginBottom: "20px",
    fontWeight: "600",
    color: "#2c3e50",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  select: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  fileInput: {
    border: "1px solid #ccc",
    padding: "8px",
    borderRadius: "6px",
  },
  button: {
    marginTop: "10px",
    backgroundColor: "#22c55e",
    color: "#fff",
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  backBtn: {
    marginTop: "15px",
    backgroundColor: "#2563eb",
    color: "#fff",
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
