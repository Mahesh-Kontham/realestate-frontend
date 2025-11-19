import { Dialog } from "@headlessui/react";

export default function DocumentViewerModal({ open, onClose, fileUrl }) {
  if (!open) return null;

  const isPDF = fileUrl?.toLowerCase().endsWith(".pdf");

 const downloadFile = async () => {
  try {
    const response = await fetch(fileUrl);
    const blob = await response.blob();

    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileUrl.split("/").pop();
    a.click();

    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Download failed:", err);
    alert("Failed to download file.");
  }
};

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xl max-w-3xl w-full">

          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold dark:text-white">
              Document Preview
            </h2>
            <button
              className="text-gray-600 dark:text-gray-300 hover:text-red-500"
              onClick={onClose}
            >
              ✖
            </button>
          </div>

          {/* Viewer */}
          <div className="w-full h-[70vh] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
            {isPDF ? (
              <iframe
                src={fileUrl}
                className="w-full h-full"
                title="PDF Viewer"
              />
            ) : (
              <img
                src={fileUrl}
                alt="document"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Download Button */}
          <div className="flex justify-end mt-4">
            <button
              onClick={downloadFile}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ⬇ Download
            </button>
          </div>

        </div>
      </div>
    </Dialog>
  );
}
