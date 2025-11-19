import React, { useState,useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";

export default function AddTenant() {
  const [formData, setFormData] = useState({
    flat_id: "",
    tenant_name: "",
    tenant_email: "",
    phone_number: "",
    occupation_type: "",
    company_name: "",
    business_name: "",
    family_status: "",
    family_members: "",
    gender: "",
    age: "",
    deposit_amount: "",
    aadharFile: null,
    panFile: null,
    offerLetterFile: null,

  });

  const [flatOptions, setFlatOptions] = useState([]);

useEffect(() => {
  const loadFlats = async () => {
    const { data, error } = await supabase
      .from("flats")
      .select("flat_id, apartment_name")
      .order("flat_id");

    if (!error) setFlatOptions(data);
  };

  loadFlats();
}, []);


  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  // -------------------------
  // Handle Input Change
  // -------------------------
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  // -------------------------
  // Upload File → Supabase
  // -------------------------
  const uploadFile = async (file, folder) => {
    if (!file) return null;

    try {
      const filePath = `${folder}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from("tenant-docs")
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("tenant-docs").getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error("❌ Upload Error:", err.message);
      alert("Failed to upload file.");
      return null;
    }
  };

  // -------------------------
  // Handle Submit
  // -------------------------
 const handleSubmit = async (e) => {
  e.preventDefault();

  setUploading(true);
  // -------------------------------
  // 2️⃣ Upload Aadhar, PAN, Offer Letter
  // -------------------------------
  const aadharUrl = await uploadFile(formData.aadharFile, "aadhar");
  const panUrl = await uploadFile(formData.panFile, "pan");
  const offerLetterUrl = await uploadFile(formData.offerLetterFile, "work-docs");

  // -------------------------------
  // 3️⃣ FINAL INSERT (AFTER pdfUrl is ready)
  // -------------------------------
   const { error } = await supabase.from("tenancies").insert([
      {
        flat_id: formData.flat_id,
        tenant_name: formData.tenant_name,
        tenant_email: formData.tenant_email,
        phone_number: formData.phone_number,

        occupation_type: formData.occupation_type,
        company_name:
          formData.occupation_type === "Working"
            ? formData.company_name
            : null,
        business_name:
          formData.occupation_type === "Business"
            ? formData.business_name
            : null,

        family_status: formData.family_status,
        family_members:
          formData.family_status === "Family"
            ? formData.family_members
            : null,
        gender:
          formData.family_status === "Bachelors" ? formData.gender : null,

        age: formData.age,
        deposit_amount: formData.deposit_amount,

        aadhar_url: aadharUrl,
        pan_url: panUrl,
        offer_letter_url: offerLetterUrl,

        start_date: new Date().toISOString(),
        is_active: true,
      },
    ]);

    setUploading(false);

    if (error) {
      console.error("❌ Error:", error);
      alert("Failed to add tenant.");
    } else {
      alert("✅ Tenant added successfully!");
      router.push("/dashboard");
    }
  };



  // -------------------------
  // STYLES (same as your pattern)
  // -------------------------
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
    <div
      style={styles.container}
      className="dark:bg-gray-800 dark:text-white"
    >
      <h2 style={styles.heading} className="dark:text-white">
        Add Tenant  
      </h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Flat ID */}
        <label className="dark:text-gray-300">Select Flat</label>
        <select
          name="flat_id"
          value={formData.flat_id}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-500 dark:text-white"
        >
          <option value="">-- Select Flat --</option>

          {flatOptions.map((flat) => (
            <option key={flat.flat_id} value={flat.flat_id}>
              {flat.apartment_name} — {flat.flat_id}
            </option>
          ))}
        </select>


        {/* Tenant Name */}
        <input
          type="text"
          name="tenant_name"
          placeholder="Tenant Name"
          value={formData.tenant_name}
          onChange={handleChange}
          required
          style={styles.input}
          className="dark:bg-gray-700 dark:border-gray-500"
        />

        {/* Phone */}
        <input
          type="text"
          name="phone_number"
          placeholder="📞 Phone Number"
          maxLength="10"
          value={formData.phone_number}
          onChange={(e) =>
            setFormData({
              ...formData,
              phone_number: e.target.value.replace(/\D/g, ""),
            })
          }
          required
          style={styles.input}
          className="dark:bg-gray-700 dark:border-gray-500"
        />

        {/* Email */}
        <input
          type="email"
          name="tenant_email"
          placeholder="📧 Email Address"
          value={formData.tenant_email}
          onChange={handleChange}
          required
          style={styles.input}
          className="dark:bg-gray-700 dark:border-gray-500"
        />

        {/* Age */}
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={formData.age}
          onChange={(e) =>
            e.target.value >= 1 &&
            setFormData({ ...formData, age: e.target.value })
          }
          required
          style={styles.input}
          className="dark:bg-gray-700 dark:border-gray-500"
        />

        {/* Deposit */}
        <input
          type="number"
          name="deposit_amount"
          placeholder="💰 Deposit Amount"
          value={formData.deposit_amount}
          onChange={(e) =>
            e.target.value >= 0 &&
            setFormData({ ...formData, deposit_amount: e.target.value })
          }
          required
          style={styles.input}
          className="dark:bg-gray-700 dark:border-gray-500"
        />

        {/* Occupation */}
        <label className="dark:text-gray-300">Occupation</label>
        <select
          name="occupation_type"
          value={formData.occupation_type}
          onChange={handleChange}
          required
          style={styles.select}
          className="dark:bg-gray-700 dark:border-gray-500"
        >
          <option value="">Select Occupation</option>
          <option value="Working">Working</option>
          <option value="Business">Business</option>
        </select>

        {/* Working */}
        {formData.occupation_type === "Working" && (
          <>
            <input
              type="text"
              name="company_name"
              placeholder="Company Name"
              value={formData.company_name}
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

        {/* Business */}
        {formData.occupation_type === "Business" && (
          <input
            type="text"
            name="business_name"
            placeholder="Business Name"
            value={formData.business_name}
            onChange={handleChange}
            required
            style={styles.input}
            className="dark:bg-gray-700 dark:border-gray-500"
          />
        )}

        {/* Family / Bachelors */}
        <label className="dark:text-gray-300">Family / Bachelors</label>
        <select
          name="family_status"
          value={formData.family_status}
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
        {formData.family_status === "Family" && (
          <input
            type="number"
            name="family_members"
            placeholder="Number of Family Members"
            value={formData.family_members}
            onChange={(e) =>
              e.target.value >= 1 &&
              setFormData({ ...formData, family_members: e.target.value })
            }
            required
            style={styles.input}
            className="dark:bg-gray-700 dark:border-gray-500"
          />
        )}

        {/* Gender */}
        {formData.family_status === "Bachelors" && (
          <select
            name="gender"
            value={formData.gender}
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

        {/* Aadhar */}
        <label className="dark:text-gray-300">Aadhaar Upload</label>
        <input
          type="file"
          name="aadharFile"
          accept="image/*,.pdf"
          onChange={handleChange}
          style={styles.fileInput}
          className="dark:bg-gray-700 dark:border-gray-500"
        />

        {/* PAN */}
        <label className="dark:text-gray-300">PAN Upload</label>
        <input
          type="file"
          name="panFile"
          accept="image/*,.pdf"
          onChange={handleChange}
          style={styles.fileInput}
          className="dark:bg-gray-700 dark:border-gray-500"
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={uploading}
          style={styles.button}
          className="dark:bg-green-600"
        >
          {uploading ? "Uploading..." : "Add Tenant"}
        </button>
      </form>

      {/* Back btn */}
      <button
        onClick={() => router.push("/dashboard")}
        style={styles.backBtn}
        className="dark:bg-blue-700"
      >
        🔙 Back to Dashboard
      </button>
    </div>
  );
}
