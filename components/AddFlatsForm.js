import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import styles from "./AddFlatsForm.module.css";

export default function AddFlatForm({ onClose, onFlatAdded }) {
  const [formData, setFormData] = useState({
    apartment_name: "",
    FlatNumber: "",
    owner_email: "",
    rent_amount: "",
    due_date: "",
  });

  // ✅ Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.apartment_name) {
      alert("Please fill apartment name");
      return;
    }

    // ✅ Get logged-in user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      alert("You must be logged in to add a flat.");
      console.error("User not found or not logged in:", userError);
      return;
    }

    // ✅ Prepare flat object
    const flat = {
      flat_id: `flat-${String(Date.now()).slice(-4)}`,
      apartment_name: formData.apartment_name,
      FlatNumber: formData.FlatNumber ? parseInt(formData.FlatNumber) : null,
      owner_email: user.email, // use logged-in user's email
      rent_amount: formData.rent_amount,
      due_date: formData.due_date,
    };

    // ✅ Insert into Supabase
    const { error } = await supabase.from("flats").insert([flat]);
    if (error) {
      console.error("❌ Error adding flat to Supabase:", error);
      alert("Failed to add flat to Supabase.");
      return;
    }

    alert("✅ Flat added successfully!");
    if (onFlatAdded) onFlatAdded(flat);

    // ✅ Step 4: Sync to Google Sheet via Edge Function
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const response = await fetch(
        "https://rsqvusfanywhzqryzqck.supabase.co/functions/v1/google-sheet",
        {
          method: "POST",
         headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
          body: JSON.stringify({
            table: "flats",
            data: {
              apartment_name: formData.apartment_name,
              FlatNumber: formData.FlatNumber,
              owner_email: user.email,
              rent_amount: formData.rent_amount,
              due_date: formData.due_date,
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("Error syncing to Google Sheet:", errText);
        alert("⚠️ Flat added but failed to sync with Google Sheet.");
        return;
      }

      alert("✅ Flat added successfully and synced to Google Sheet!");
      onClose();
    } catch (err) {
      console.error("❌ Network error:", err);
      alert("Network error while syncing with Google Sheet.");
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>Add New Flat</h3>
        <form onSubmit={handleSubmit}>
          <input
            name="apartment_name"
            placeholder="Apartment Name"
            onChange={handleChange}
            value={formData.apartment_name}
          />
          <input
            name="FlatNumber"
            placeholder="Flat Number"
            type="number"
            onChange={handleChange}
            value={formData.FlatNumber}
          />
          <input
            name="owner_email"
            type="email"
            placeholder="Owner Email"
            onChange={handleChange}
            value={formData.owner_email}
          />

          <input
            name="rent_amount"
            type="number"
            placeholder="Rent Amount"
            onChange={handleChange}
            value={formData.rent_amount}
          />
          <input
            name="due_date"
            type="date"
            placeholder="Due Date"
            onChange={handleChange}
            value={formData.due_date}
          />

          <div className={styles.modalButtons}>
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
