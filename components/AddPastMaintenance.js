import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AddPastMaintenance({ onClose, flatId, tenantId, onSuccess }) {
  const [flats, setFlats] = useState([]);
  const [selectedFlatId, setSelectedFlatId] = useState(flatId || "");
  const [form, setForm] = useState({
    category: "",
    description: "",
    severity: "",
    cost: "",
    otherCategory: "",
  });
  const handleChange = (e) => {
  setForm({
    ...form,
    [e.target.name]: e.target.value,
  });
};


  // Load flats for dropdown
  useEffect(() => {
    async function fetchFlats() {
      const { data, error } = await supabase.from("flats").select("flat_id, apartment_name");
      if (!error) setFlats(data);
    }
    fetchFlats();
  }, []);

  const handleSubmit = async () => {
    if (!selectedFlatId) {
      alert("⚠ Please select a Flat.");
      return;
    }
    const finalCategory =
    form.category === "Other" ? form.otherCategory : form.category;

    const { error } = await supabase.from("maintenance").insert([
      {
        flat_id: selectedFlatId,       // SELECTED FLAT
        tenancy_id: tenantId || null,
        category: finalCategory,
        description: form.description,
        severity: form.severity,
        cost: Number(form.cost),
        reported_at: new Date().toISOString()
      }
    ]);

    if (error) {
      alert("❌ Failed");
      console.error(error);
    } else {
      alert("✅ Maintenance added");
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-lg">

        <h2 className="text-xl font-semibold mb-4 dark:text-white">
          Add Maintenance
        </h2>

        {/* SELECT FLAT DROPDOWN */}
        <label className="block mb-1 dark:text-gray-300 font-medium">
          Select Flat
        </label>
        <select
          value={selectedFlatId}
          onChange={(e) => setSelectedFlatId(e.target.value)}
          className="w-full p-3 border dark:bg-gray-700 dark:text-white rounded mb-4"
        >
          <option value="">-- Select Flat --</option>

          {flats.map((f) => (
            <option key={f.flat_id} value={f.flat_id}>
              {f.flat_id} — {f.apartment_name}
            </option>
          ))}
        </select>

        {/* CATEGORY */}
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          required
        >
          <option value="">Select Category</option>
          <option value="Plumbing">Plumbing</option>
          <option value="Electrical">Electrical</option>
          <option value="Carpentry">Carpentry</option>
          <option value="Cleaning">Cleaning</option>
          <option value="Painting">Painting</option>
          <option value="Pest Control">Pest Control</option>
          <option value="General Repair">General Repair</option>
          <option value="Appliance Repair">Appliance Repair</option>
          <option value="Security">Security</option>
          <option value="Other">Other</option>
        </select>
                {form.category === "Other" && (
          <input
            name="otherCategory"
            value={form.otherCategory}
            onChange={handleChange}
            placeholder="Enter category"
            className="w-full p-2 border rounded mb-3 dark:bg-gray-700 dark:text-white"
            required
          />
)}
        {/* DESCRIPTION */}
        <textarea
          className="w-full p-2 border rounded mb-3 dark:bg-gray-700 dark:text-white"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        {/* SEVERITY */}
        <select
          className="w-full p-2 border rounded mb-3 dark:bg-gray-700 dark:text-white"
          value={form.severity}
          onChange={(e) => setForm({ ...form, severity: e.target.value })}
        >
          <option value="">Select Severity</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>

        {/* COST */}
        <input
            type="number"
            className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:text-white
                      [-moz-appearance:textfield]
                      [&::-webkit-inner-spin-button]:appearance-none
                      [&::-webkit-outer-spin-button]:appearance-none"
            placeholder="Cost"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
            min="0"
            inputMode="numeric"
          />

        {/* BUTTONS */}
        <div className="flex justify-end gap-3">
          <button className="px-4 py-2 bg-gray-400 rounded" onClick={onClose}>
            Cancel
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleSubmit}>
            Save
          </button>
        </div>

      </div>
    </div>
  );
}
