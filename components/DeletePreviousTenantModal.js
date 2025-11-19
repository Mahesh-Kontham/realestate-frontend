import { Dialog } from "@headlessui/react";
import { supabase } from "../lib/supabaseClient";

export default function DeletePreviousTenantModal({ open, onClose, tenantId, onDeleted }) {

  const handleDelete = async () => {
    const { error } = await supabase
      .from("tenancies")
      .delete()
      .eq("id", tenantId);

    if (error) {
      alert("Delete failed");
      console.log(error);
      return;
    }

    alert("Tenant deleted!");
    onDeleted();
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl max-w-md w-full shadow-xl">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            Confirm Delete
          </h2>

          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Are you sure you want to delete this previous tenant?
          </p>

          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 bg-gray-300 rounded dark:bg-gray-700 dark:text-white"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="px-4 py-2 bg-red-600 text-white rounded"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
