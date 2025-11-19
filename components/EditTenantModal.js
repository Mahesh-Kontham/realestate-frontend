import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function EditTenantModal({ open, tenant, onClose, onSuccess }) {
  const [form, setForm] = useState({
    tenant_name: "",
    phone_number: "",
    tenant_email: "",
    occupation_type: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        tenant_name: tenant.tenant_name || "",
        phone_number: tenant.phone_number || "",
        tenant_email: tenant.tenant_email || "",
        occupation_type: tenant.occupation_type || "",
        start_date: tenant.start_date
          ? tenant.start_date.split("T")[0]
          : "",
        end_date: tenant.end_date ? tenant.end_date.split("T")[0] : "",
      });
    }
  }, [tenant]);

  if (!open || !tenant) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from("tenancies")
      .update({
        tenant_name: form.tenant_name,
        phone_number: form.phone_number,
        tenant_email: form.tenant_email,
        occupation_type: form.occupation_type,
        start_date: form.start_date,
        end_date: form.end_date,
      })
      .eq("id", tenant.id);

    if (error) {
      console.error(error);
      alert("Update failed");
    } else {
      alert("Tenant updated");
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">
          Edit Tenant
        </h2>

        <input
          name="tenant_name"
          type="text"
          value={form.tenant_name}
          onChange={handleChange}
          className="w-full p-3 mb-3 border rounded dark:bg-gray-800 dark:text-white"
          placeholder="Tenant Name"
        />

        <input
          name="start_date"
          type="date"
          value={form.start_date}
          onChange={handleChange}
          className="w-full p-3 mb-3 border rounded dark:bg-gray-800 dark:text-white"
        />

        <input
          name="end_date"
          type="date"
          value={form.end_date}
          onChange={handleChange}
          className="w-full p-3 mb-3 border rounded dark:bg-gray-800 dark:text-white"
        />

        <input
          name="phone_number"
          type="text"
          value={form.phone_number}
          onChange={handleChange}
          className="w-full p-3 mb-3 border rounded dark:bg-gray-800 dark:text-white"
          placeholder="Phone"
        />

        <input
          name="tenant_email"
          type="email"
          value={form.tenant_email}
          onChange={handleChange}
          className="w-full p-3 mb-3 border rounded dark:bg-gray-800 dark:text-white"
          placeholder="Email"
        />

        <input
          name="occupation_type"
          type="text"
          value={form.occupation_type}
          onChange={handleChange}
          className="w-full p-3 mb-5 border rounded dark:bg-gray-800 dark:text-white"
          placeholder="Occupation"
        />

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 dark:text-white"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 rounded bg-blue-600 text-white"
            onClick={handleSave}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
