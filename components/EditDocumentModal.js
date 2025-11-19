import { Dialog } from "@headlessui/react";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function EditDocumentModal({ open, doc, onClose, onSuccess }) {
  const [type, setType] = useState(doc?.type || "");
  const [month, setMonth] = useState(doc?.month || "");

  const handleSave = async () => {
    const { error } = await supabase
      .from("rental_documents")
      .update({ type, month })
      .eq("id", doc.id);

    if (!error) {
      onSuccess();
      onClose();
    } else {
      console.error(error);
    }
  };

  if (!open || !doc) return null;

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-md shadow-lg">

          <h2 className="text-xl font-semibold dark:text-white mb-4">
            Edit Document
          </h2>

          <label className="block mb-2 dark:text-gray-300">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="agreement">Agreement</option>
            <option value="payment">Payment</option>
          </select>

          {type === "payment" && (
            <>
              <label className="block mt-4 mb-2 dark:text-gray-300">
                Month
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
