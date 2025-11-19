import { supabase } from "../lib/supabaseClient";

export default function DeleteTenantModal({ open, id, onClose, onSuccess }) {
  if (!open || !id) return null;

  const handleDelete = async () => {
    const { error } = await supabase
      .from("tenancies")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Delete failed");
    } else {
      alert("Tenant deleted");
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-sm shadow-xl">

        <h2 className="text-lg font-semibold dark:text-white mb-4">
          Delete Tenant?
        </h2>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Are you sure you want to delete this tenant record?  
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 dark:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded bg-red-600 text-white"
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  );
}
