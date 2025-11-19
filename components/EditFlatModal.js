import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function EditFlatModal({ open, onClose, flat, onSuccess }) {
  if (!open) return null;

  const [form, setForm] = useState({
    apartment_name: "",
     FlatNumber: "",
    rent_amount: "",
    due_date: "",
    owner_email: "",
  });

  useEffect(() => {
    if (flat) {
      setForm({
        apartment_name: flat.apartment_name,
         FlatNumber: flat. FlatNumber,
        rent_amount: flat.rent_amount,
        due_date: flat.due_date ? flat.due_date.split("T")[0] : "",
        owner_email: flat.owner_email,
      });
    }
  }, [flat]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async () => {
    const { error } = await supabase
      .from("flats")
      .update({
        apartment_name: form.apartment_name,
        rent_amount: form.rent_amount,
        due_date: form.due_date,
        owner_email: form.owner_email,
      })
      .eq(" FlatNumber", form. FlatNumber);

    if (error) {
      alert("Failed to update flat");
      console.error(error);
    } else {
      alert("Flat updated successfully");
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-lg shadow-lg">
        
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Edit Flat</h2>

        <div className="space-y-3">
          <input
            name="apartment_name"
            className="input"
            placeholder="Apartment Name"
            value={form.apartment_name}
            onChange={handleChange}
          />

          <input
            disabled
            className="input bg-gray-200 dark:bg-gray-700 cursor-not-allowed"
            value={form. FlatNumber}
          />

          <input
            name="rent_amount"
            className="input"
            placeholder="Rent Amount"
            type="number"
            value={form.rent_amount}
            onChange={handleChange}
          />

          <input
            name="due_date"
            className="input"
            type="date"
            value={form.due_date}
            onChange={handleChange}
          />

          <input
            name="owner_email"
            className="input"
            placeholder="Owner Email"
            type="email"
            value={form.owner_email}
            onChange={handleChange}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Update
          </button>
        </div>

      </div>
    </div>
  );
}
