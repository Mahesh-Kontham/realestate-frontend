import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { supabase } from "../../lib/supabaseClient";

export default function AddTenantModal({ open, onClose, onSuccess }) {
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
    children_count: "",
    children_ages: [],   // array of ages entered
    partner_aadhar: null,
    bachelors_count: "",
    bachelors_aadhars: [],


  });

  const [flatOptions, setFlatOptions] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return; // only load when modal is opened

    const loadFlats = async () => {
      const { data, error } = await supabase
        .from("flats")
        .select("flat_id, apartment_name")
        .order("flat_id");

      if (!error) setFlatOptions(data);
    };

    loadFlats();
  }, [open]);

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
  const addBachelor = () => {
  setFormData({
    ...formData,
    bachelors_aadhars: [
      ...formData.bachelors_aadhars,
      { file: null }
    ],
  });
};

const updateBachelorAadhar = (index, file) => {
  const updated = [...formData.bachelors_aadhars];
  updated[index].file = file;
  setFormData({ ...formData, bachelors_aadhars: updated });
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

  const addChildAge = () => {
  setFormData({
    ...formData,
    children_ages: [...formData.children_ages, ""],
  });
};

const updateChildAge = (index, value) => {
  const updatedAges = [...formData.children_ages];
  updatedAges[index] = value;
  setFormData({ ...formData, children_ages: updatedAges });
};


  // -------------------------
  // Submit Handler
  // -------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    const partnerAadharUrl = await uploadFile(formData.partner_aadhar, "aadhar");
    const aadharUrl = await uploadFile(formData.aadharFile, "aadhar");
    const panUrl = await uploadFile(formData.panFile, "pan");
    const offerLetterUrl = await uploadFile(
      formData.offerLetterFile,
      "work-docs"
    );

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
       
          children_count:
          formData.family_status === "Family"
            ? formData.children_count
            : null,


              children_ages:
              formData.family_status === "Family"
                ? formData.children_ages
                : null,

            partner_aadhar_url:
              formData.family_status === "Family"
                ? partnerAadharUrl
                : null,

                 // BACHELOR DETAILS
        bachelors_count:
          formData.family_status === "Bachelors"
            ? formData.bachelors_count
            : null,

        bachelors_aadhar_urls:
          formData.family_status === "Bachelors"
            ? bachelorsAadharUrls
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
      onSuccess(); // refresh dashboard list
      onClose(); // close modal
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
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      {/* background overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      {/* modal center */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">

          {/* Heading */}
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Add Tenant
          </h2>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">

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

            {/* ORIGINAL FORM FIELDS — unchanged */}
            <input
              type="text"
              name="tenant_name"
              placeholder="Tenant Name"
              value={formData.tenant_name}
              onChange={handleChange}
              required
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500 dark:text-white"
            />

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
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500 dark:text-white"
            />

            <input
              type="email"
              name="tenant_email"
              placeholder="📧 Email Address"
              value={formData.tenant_email}
              onChange={handleChange}
              required
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500 dark:text-white"
            />
             <input
            type="text"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ""); // remove non-numbers
              setFormData({ ...formData, age: value });
            }}
            required
            style={styles.input}
            className="dark:bg-gray-700 dark:border-gray-500"
            inputMode="numeric"
          />
            

             <input
            type="text"
            name="deposit_amount"
            placeholder="💰 Deposit Amount"
            value={formData.deposit_amount}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ""); // remove non-numbers
              setFormData({ ...formData, deposit_amount: value });
            }}
            required
            style={styles.input}
            className="dark:bg-gray-700 dark:border-gray-500"
            inputMode="numeric"
          />

            {/* occupation */}
            <label className="dark:text-gray-300">Occupation</label>

            <select
              name="occupation_type"
              value={formData.occupation_type}
              onChange={handleChange}
              required
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500 dark:text-white"
            >
              <option value="">Select Occupation</option>
              <option value="Working">Working</option>
              <option value="Business">Business</option>
            </select>

            {formData.occupation_type === "Working" && (
              <>
                <input
                  type="text"
                  name="company_name"
                  placeholder="Company Name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500 dark:text-white"
                />
                <label className="dark:text-gray-300">Offer Letter / ID</label>
                <input
                  type="file"
                  name="offerLetterFile"
                  accept="image/*,.pdf"
                  onChange={handleChange}
                  required
                  className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500"
                />
              </>
            )}

            {formData.occupation_type === "Business" && (
              <input
                type="text"
                name="business_name"
                placeholder="Business Name"
                value={formData.business_name}
                onChange={handleChange}
                required
                className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500 dark:text-white"
              />
            )}

            {/* Family / Bachelors */}
            <label className="dark:text-gray-300">Family / Bachelors</label>

            <select
              name="family_status"
              value={formData.family_status}
              onChange={handleChange}
              required
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500 dark:text-white"
            >
              <option value="">Select Type</option>
              <option value="Family">Family</option>
              <option value="Bachelors">Bachelors</option>
            </select>
                          {formData.family_status === "Family" && (
              <div className="flex flex-col gap-3">

                {/* Number of Family Members (your original field) */}
                <input
                  type="text"
                  name="family_members"
                  placeholder="Number of Family Members"
                  value={formData.family_members}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      family_members: e.target.value.replace(/\D/g, ""), // numbers only
                    })
                  }
                  required
                  className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500 dark:text-white"
                />

                {/* Number of Children */}
                <input
                  type="text"
                  name="children_count"
                  placeholder="Number of Children"
                  value={formData.children_count}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ""); // only numbers
                    setFormData({
                      ...formData,
                      children_count: val,
                      children_ages: Array(Number(val) || 0).fill(""),
                    });
                  }}
                  className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500 dark:text-white"
                />

                {/* Children Age Inputs */}
                {formData.children_ages?.map((age, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder={`Child ${index + 1} Age`}
                    value={age}
                    onChange={(e) => {
                      const updated = [...formData.children_ages];
                      updated[index] = e.target.value.replace(/\D/g, "");
                      setFormData({ ...formData, children_ages: updated });
                    }}
                    className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500 dark:text-white"
                  />
                ))}

                {/* Add Another Child Button */}
                {formData.children_count > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        children_ages: [...formData.children_ages, ""],
                        children_count: (Number(formData.children_count) + 1).toString(),
                      })
                    }
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    + Add Another Child
                  </button>
                )}

                {/* Partner Aadhaar Upload */}
                <div className="flex flex-col">
                  <label className="dark:text-gray-300 font-medium">
                    Upload Partner Aadhaar
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setFormData({ ...formData, partner_aadhar: e.target.files[0] })
                    }
                    className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500 dark:text-white"
                  />
                </div>

              </div>
            )}


            {formData.family_status === "Bachelors" && (
  <div className="flex flex-col gap-3">

    {/* GENDER SELECTION (YOUR ORIGINAL CODE) */}
    <select
      name="gender"
      value={formData.gender}
      onChange={handleChange}
      required
      className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500 dark:text-white"
    >
      <option value="">Select Gender</option>
      <option value="Men">Male</option>
      <option value="Women">Female</option>
    </select>

          {/* NUMBER OF PEOPLE */}
          <input
            type="text"
            placeholder="Number of People"
            value={formData.bachelors_count}
            onChange={(e) => {
              const count = e.target.value.replace(/\D/g, "");
              setFormData({
                ...formData,
                bachelors_count: count,
                bachelors_aadhars: Array(Number(count) || 0).fill({ file: null }),
              });
            }}
            className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500 dark:text-white"
          />

          {/* AADHAAR UPLOAD FOR EACH PERSON */}
          {formData.bachelors_aadhars.map((person, index) => (
            <div key={index} className="flex flex-col gap-2">
              <label className="font-medium dark:text-gray-300">
                Aadhaar for Person {index + 1}
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => updateBachelorAadhar(index, e.target.files[0])}
                className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500 dark:text-white"
              />
            </div>
          ))}

          {/* ADD ANOTHER PERSON BUTTON */}
          {formData.bachelors_count > 0 && (
            <button
              type="button"
              onClick={() => {
                addBachelor();
                setFormData({
                  ...formData,
                  bachelors_count: (Number(formData.bachelors_count) + 1).toString(),
                });
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Add Another Person
            </button>
          )}
        </div>
      )}

            <label className="dark:text-gray-300">Aadhaar Upload</label>
            <input
              type="file"
              name="aadharFile"
              accept="image/*,.pdf"
              onChange={handleChange}
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500"
            />

            <label className="dark:text-gray-300">PAN Upload</label>
            <input
              type="file"
              name="panFile"
              accept="image/*,.pdf"
              onChange={handleChange}
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-500"
            />

            <button
              type="submit"
              disabled={uploading}
              className="bg-green-600 text-white py-2 rounded-lg"
            >
              {uploading ? "Uploading..." : "Add Tenant"}
            </button>
          </form>

          <button
            onClick={onClose}
            className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
}
