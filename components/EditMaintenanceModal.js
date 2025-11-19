import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function EditMaintenanceModal({ open, onClose, maintenance, onSuccess }) {
  const [form, setForm] = useState({
    category: "",
    description: "",
    severity: "",
    cost: "",
  });

  const handleChange = (e) => {
  setForm({
    ...form,
    [e.target.name]: e.target.value,
  });
};
  // Load existing data when modal opens
  useEffect(() => {
    if (maintenance) {
      setForm({
        category: maintenance.category || "",
        description: maintenance.description || "",
        severity: maintenance.severity || "",
        cost: maintenance.cost || "",
      });
    }
  }, [maintenance]);

  if (!open || !maintenance) return null;

  // Only allow numeric values (text input)
  const handleCostChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setForm({ ...form, cost: value });
  };

  const handleUpdate = async () => {
    const { error } = await supabase
      .from("maintenance")
      .update({
        category: form.category,
        description: form.description,
        severity: form.severity,
        cost: Number(form.cost),
      })
      .eq("id", maintenance.id);

    if (error) {
      alert("❌ Update failed");
      console.error(error);
      return;
    }

    alert("✅ Updated successfully");
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40" />

      {/* Modal Card */}
      <div className="relative z-50 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-md">

        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Edit Maintenance
        </h2>

        {/* Category */}
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

        {/* Description */}
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description"
          className="w-full mt-2 p-3 rounded border dark:bg-gray-800 dark:text-white dark:border-gray-700"
        />

        {/* Severity */}
        <select
          value={form.severity}
          onChange={(e) => setForm({ ...form, severity: e.target.value })}
          className="w-full mt-2 p-3 rounded border dark:bg-gray-800 dark:text-white dark:border-gray-700"
        >
          <option value="">Select Severity</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {/* Cost (numeric text input) */}
        <input
          type="text"
          value={form.cost}
          onChange={handleCostChange}
          placeholder="Cost"
          className="w-full mt-2 p-3 rounded border dark:bg-gray-800 dark:text-white dark:border-gray-700"
        />

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </Dialog>
  );
}
