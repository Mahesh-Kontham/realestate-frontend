import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const TABLE_NAME = "rental_documents"; // <--- change if needed
const BUCKET_FALLBACK = "tenant-docs"; // used if we can't extract bucket, adjust if necessary

export default function DeleteDocumentModal({ open, id, fileUrl, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) setLoading(false);
  }, [open]);

  // Robust extractor: supports URLs like:
  // https://.../storage/v1/object/public/<bucket>/<path...>
  const extractStoragePath = (publicUrl) => {
    if (!publicUrl) return null;

    try {
      const prefix = "/object/public/";
      const idx = publicUrl.indexOf(prefix);
      if (idx === -1) {
        // fallback: try to find '/storage/v1/object/'
        const alt = "/storage/v1/object/";
        const altIdx = publicUrl.indexOf(alt);
        if (altIdx !== -1) {
          // everything after alt is bucket/... -> remove leading bucket
          const after = publicUrl.substring(altIdx + alt.length);
          // if it contains 'public/', remove that part
          const afterPublic = after.startsWith("public/") ? after.substring("public/".length) : after;
          const parts = afterPublic.split("/");
          // first part is bucket, rest is path
          parts.shift();
          return parts.join("/");
        }
        return null;
      }

      const after = publicUrl.substring(idx + prefix.length); // "<bucket>/<path...>"
      const parts = after.split("/");
      const bucket = parts.shift(); // bucket name
      const path = parts.join("/");
      // return object so we have both bucket and path if needed
      return { bucket, path };
    } catch (err) {
      console.warn("Failed to extract path from url:", publicUrl, err);
      return null;
    }
  };

 const handleDelete = async () => {
  try {
    setLoading(true);
    console.log("Delete clicked!");
    console.log("Modal props:", { id, fileUrl });

    // -----------------------------
    // 1. Delete from STORAGE
    // -----------------------------
    if (fileUrl) {
      // Extract bucket & path from public URL
      const prefix = "/object/public/";
      const idx = fileUrl.indexOf(prefix);

      if (idx !== -1) {
        // this gives "<bucket>/<path/to/file>"
        const bucketAndPath = fileUrl.substring(idx + prefix.length);

        // bucketAndPath = "tenant-docs/folder/file.jpg"
        const [bucket, ...pathParts] = bucketAndPath.split("/");
        const path = pathParts.join("/");

        console.log("Deleting storage file:", { bucket, path });

        const { error: storageError } = await supabase.storage
          .from(bucket)
          .remove([path]);

        if (storageError) {
          console.warn("Storage delete failed:", storageError);
        } else {
          console.log("Storage file deleted successfully.");
        }
      } else {
        console.warn("Could not extract storage path.");
      }
    } else {
      console.log("No fileUrl provided; skipping storage delete.");
    }

    // -----------------------------
    // 2. Delete from DATABASE
    // -----------------------------
    const { error: dbError } = await supabase
      .from("rental_documents")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;

    console.log("DB record deleted successfully.");

   await onSuccess();
    onClose();
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Failed to delete document.");
  } finally {
    setLoading(false);
  }
};


  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      {/* Background */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
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
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:text-white"
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
