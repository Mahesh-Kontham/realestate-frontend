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

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.apartment_name) {
    alert("Please fill apartment name");
    return;
  }

  // ✅ Step 1: Get the logged-in user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    alert("You must be logged in to add a flat.");
    console.error("User not found or not logged in:", userError);
    return;
  }

  // ✅ Step 2: Create flat object with the logged-in user’s email
  const flat = {
    flat_id: `flat-${String(Date.now()).slice(-4)}`,
    apartment_name: formData.apartment_name,
    FlatNumber: formData.FlatNumber ? parseInt(formData.FlatNumber) : null, 
    owner_email: user.email, // ✅ Now user is defined
    rent_amount: formData.rent_amount,
    due_date: formData.due_date,
  };

  // ✅ Step 3: Insert into Supabase
  const { error } = await supabase.from("flats").insert([flat]);
  if (error) {
    console.error("❌ Error adding flat to Supabase:", error);
    alert("Failed to add flat to Supabase.");
    return;
  }

  // ✅ Step 4: Sync to Edge Function
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      "https://rsqvusfanywhzqryzqck.supabase.co/functions/v1/sync-data",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          table: "flats",
          data: [flat],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      // console.error("Error syncing to Google Sheet:", err);
      // alert("Failed to sync flat with Google Sheet.");
      return;
    }

    alert("✅ Flat added successfully and synced!");
    if (onFlatAdded) onFlatAdded(flat);
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
          />
          <input name="block" placeholder="FlatNumber" onChange={handleChange} />
          <input
            name="owner_email"
            type="email"
            placeholder="Owner Email"
            onChange={handleChange}
          />
          <input
            name="rent_amount"
            type="number"
            placeholder="Rent Amount"
            onChange={handleChange}
          />
          <input
            name="due_date"
            type="date"
            placeholder="Due Date"
            value={formData.due_date || ""}
            onChange={handleChange}
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
