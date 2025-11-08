import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";

export default function AddTenant() {
  const [formData, setFormData] = useState({
    flat_id: "",
    tenant_name: "",
    occupation_type: "",
    salary: "",
    family_status: "",
    gender: "",
    age: "",
    deposit_amount: "",
    aadharFile: null,
    panFile: null,
  });

  const router = useRouter();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  // 🔼 Upload file to Supabase Edge Function → Google Drive
    const uploadFile = async (file) => {
      // Get current session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const form = new FormData();
      form.append("file", file);

      const res = await fetch(
        "https://rsqvusfanywhzqryzqck.supabase.co/functions/v1/upload-to-drive",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`, // ✅ send user's access token
          },
          body: form,
        }
      );

      if (!res.ok) {
        console.error("❌ Upload failed:", await res.text());
        throw new Error("Upload failed");
      }

      const data = await res.json();
      return `https://drive.google.com/file/d/${data.fileId}/view`;
    };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.flat_id || !formData.tenant_name || !formData.deposit_amount) {
      alert("Please fill all required fields including deposit amount.");
      return;
    }

    let aadharUrl = null;
    let panUrl = null;

    try {
      if (formData.aadharFile) aadharUrl = await uploadFile(formData.aadharFile);
      if (formData.panFile) panUrl = await uploadFile(formData.panFile);
    } catch (err) {
      console.error("❌ Error uploading file:", err);
      alert("File upload failed!");
      return;
    }

    const { data, error } = await supabase.from("tenancies").insert([
      {
        flat_id: formData.flat_id,
        tenant_name: formData.tenant_name,
        occupation_type: formData.occupation_type,
        salary: formData.occupation_type === "Working" ? formData.salary : null,
        family_status: formData.family_status,
        gender:
          formData.family_status === "Bachelors" ? formData.gender : null,
        age: formData.age,
        deposit_amount: formData.deposit_amount,
        aadhar_url: aadharUrl,
        pan_url: panUrl,
        start_date: new Date().toISOString(), // default start date
        is_active: true,
      },
    ]);

    if (error) {
      console.error("❌ Error adding tenant:", error);
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
          placeholder="Flat ID (e.g. FLAT-001)"
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
            // Prevent negative or zero numbers
            if (value >= 0) {
              setFormData({ ...formData, age: value });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "+") {
              e.preventDefault(); // stop typing negative/positive signs
            }
          }}
          min="1"
          step="1"
          required
          style={{
            ...styles.input,
            borderColor: "#22c55e",
            backgroundColor: "#f9fffa",
          }}
        />

       <input
          type="number"
          name="deposit_amount"
          placeholder="💰 Deposit Amount"
          value={formData.deposit_amount}
          onChange={(e) => {
            const value = e.target.value;
            // Prevent negative or zero numbers
            if (value >= 0) {
              setFormData({ ...formData, deposit_amount: value });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "+") {
              e.preventDefault(); // stop typing negative/positive signs
            }
          }}
          min="1"
          step="1"
          required
          style={{
            ...styles.input,
            borderColor: "#22c55e",
            backgroundColor: "#f9fffa",
          }}
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

        {/* Show salary if Working */}
        {formData.occupation_type === "Working" && (
          <input
            type="number"
            name="salary"
            placeholder="Monthly Salary"
            value={formData.salary}
            onChange={handleChange}
            style={styles.input}
          />
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

        {/* Show gender if Bachelors */}
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
        <label>Aadhar Upload:</label>
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

        <button type="submit" style={styles.button}>
          Add Tenant
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
