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

  if (!formData.apartment_name || !formData.FlatNumber) {
    alert("⚠️ Please fill in all required fields");
    return;
  }

  if (isNaN(Number(formData.FlatNumber))) {
    alert("⚠️ Flat Number must be numeric only");
    return;
  }

    // ✅ Get logged-in user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      alert("You must be logged in to add a flat.");
      console.error("User not found or not logged in:", userError);
      return;
    }
   const generateFlatId = (apartmentName, flatNumber) => {
  const cleanName = apartmentName.trim().toLowerCase().replace(/\s+/g, "-");
  return `${cleanName}-${flatNumber}`;
      };
    // ✅ Prepare flat object
    // ✅ Prepare flat object
const flat = {
  flat_id: generateFlatId(formData.apartment_name, formData.FlatNumber),
  apartment_name: formData.apartment_name,
  FlatNumber: formData.FlatNumber ? Number(formData.FlatNumber) : null,
  rent_amount: formData.rent_amount,
  owner_email:  formData.owner_email,
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

  };
return (
  <div className={styles.modalOverlay + " dark:bg-black/40 z-50"}>
    <div
      className={
        styles.modal +
        " dark:bg-gray-800 dark:text-gray-100 transition-all duration-200"
      }
    >
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
         Add New Flat
      </h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Apartment Name */}
        <div>
          <label className="text-sm font-medium dark:text-gray-300">
            Apartment Name
          </label>
          <input
            name="apartment_name"
            placeholder="Enter Apartment Name"
            onChange={handleChange}
            value={formData.apartment_name}
            className="w-full mt-1 p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>

        {/* Flat Number */}
        <div>
          <label className="text-sm font-medium dark:text-gray-300">
            Flat Number
          </label>
          <input
            type="number"
            id="FlatNumber"
            name="FlatNumber"
            placeholder="Enter Flat Number (e.g., 101)"
            value={formData.FlatNumber || ""}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setFormData({ ...formData, FlatNumber: value });
            }}
            className="w-full mt-1 p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>

        {/* Owner Email */}
        <div>
          <label className="text-sm font-medium dark:text-gray-300">
            Owner Email
          </label>
          <input
            type="email"
            name="owner_email"
            placeholder="Owner Email Address"
            value={formData.owner_email}
            onChange={handleChange}
            required
            className="w-full mt-1 p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Rent */}
        <div>
          <label className="text-sm font-medium dark:text-gray-300">
            Rent Amount (₹)
          </label>
          <input
            name="rent_amount"
            type="number"
            placeholder="Enter Rent Amount"
            onChange={handleChange}
            value={formData.rent_amount}
            className="w-full mt-1 p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="text-sm font-medium dark:text-gray-300">
            Rent Due Date
          </label>
          <input
            name="due_date"
            type="date"
            onChange={handleChange}
            value={formData.due_date}
            className="w-full mt-1 p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
          >
            Save Flat
          </button>
        </div>
      </form>
    </div>
  </div>
);


}