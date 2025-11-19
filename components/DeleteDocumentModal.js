import { Dialog } from "@headlessui/react";
import { supabase } from "../lib/supabaseClient";
import { useState } from "react";

export default function DeleteDocumentModal({ open, id, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);

      // Delete record from DB
      const { error } = await supabase
        .from("rental_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;

      onSuccess(); // refresh parent UI
      onClose();   // close modal
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete the document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      {/* Background */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal Center */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Delete Document
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Are you sure you want to delete this document? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
