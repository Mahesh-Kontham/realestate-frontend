import { useState,useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { supabase } from "../lib/supabaseClient";

export default function EditPreviousTenantModal({ open, onClose, tenant, onUpdated }) {
 const [form, setForm] = useState({
  tenant_name: "",
  start_date: "",
  end_date: "",
  phone_number: "",
  tenant_email: "",
  occupation_type_type: ""
});

useEffect(() => {
  if (tenant) {
    setForm({
      tenant_name: tenant.tenant_name || "",
      start_date: tenant.start_date || "",
      end_date: tenant.end_date || "",
      phone_number: tenant.phone_number || "",
      tenant_email: tenant.tenant_email || "",
      occupation_type_type: tenant.occupation_type_type || ""
    });
  }
}, [tenant]);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    const { error } = await supabase
      .from("tenancies")
      .update({
        tenant_name: form.tenant_name,
        start_date: form.start_date,
        end_date: form.end_date,
        phone_number: form.phone_number,
        tenant_email: form.tenant_email,
        occupation_type: form.occupation_type,
      })
      .eq("id", tenant.id);

    if (error) {
      alert("Update failed");
      console.log(error);
      return;
    }

    alert("Updated successfully!");
    onUpdated();
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl max-w-lg w-full shadow-xl">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            Edit Previous Tenant
          </h2>

          <div className="space-y-3">
            <input
              name="tenant_name"
              placeholder="Name"
              value={form.tenant_name}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />

            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />

            <input
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />

            <input
              name="phone_number"
              placeholder="Phone"
              value={form.phone_number}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />

            <input
              name="tenant_email"
              placeholder="Email"
              value={form.tenant_email}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />

            <input
              name="occupation_type"
              placeholder="occupation_type"
              value={form.occupation_type}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              className="px-4 py-2 bg-gray-300 rounded dark:bg-gray-700 dark:text-white"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={handleUpdate}
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
