import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";


export default function DeleteMaintenanceModal({ open, id, onClose, onSuccess }) {
  if (!open || !id) return null;

  const handleDelete = async () => {
    const { error } = await supabase
      .from("maintenance")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Delete failed");
      console.error(error);
      return;
    }

    alert("Deleted successfully");
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-sm shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Confirm Delete?</h2>

        <div className="flex justify-end gap-3">
          <button className="px-4 py-2 bg-gray-400 rounded" onClick={onClose}>
            Cancel
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
