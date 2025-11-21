import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";

export default function DocumentViewerModal({ open, onClose, fileUrl }) {
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  useEffect(() => {
    if (!open) {
      setLoadingPreview(true);
      setDownloading(false);
      setPreviewError(null);
    }
  }, [open]);

  if (!open) return null;

  // Correct file type detection
  const extension = fileUrl ? fileUrl.split("?")[0].split(".").pop().toLowerCase() : "";
  const isPDF = extension === "pdf";
  const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(extension);

  const downloadFile = async () => {
    if (!fileUrl) {
      alert("No file to download");
      return;
    }

    setDownloading(true);
    setPreviewError(null);

    try {
      const response = await fetch(fileUrl, { method: "GET" });

      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileUrl.split("/").pop() || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn("Download failed via fetch:", err);

      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = fileUrl.split("/").pop() || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setDownloading(false);
    }
  };

  const onIframeLoad = () => {
    setLoadingPreview(false);
    setPreviewError(null);
  };

  const onPreviewError = () => {
    setLoadingPreview(false);
    setPreviewError("Failed to load preview (CORS or unsupported format).");
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xl max-w-3xl w-full">

          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold dark:text-white">Document Preview</h2>
            <button
              className="text-gray-600 dark:text-gray-300 hover:text-red-500"
              onClick={onClose}
            >
              ✖
            </button>
          </div>

          {/* Viewer */}
          <div className="w-full h-[70vh] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 relative">

            {loadingPreview && (
              <div className="absolute inset-0 flex items-center justify-center z-10 text-gray-600 dark:text-gray-300">
                Loading preview…
              </div>
            )}

            {/* PDF */}
            {fileUrl && !previewError && isPDF && (
              <iframe
                src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`}
                className="w-full h-full"
                onLoad={onIframeLoad}
                onError={onPreviewError}
              />
            )}

            {/* Image */}
            {fileUrl && !previewError && isImage && (
              <img
                src={fileUrl}
                className="w-full h-full object-contain"
                onLoad={() => setLoadingPreview(false)}
                onError={onPreviewError}
              />
            )}

          {fileUrl && !isPDF && !isImage && (
            <div className="p-6 text-center text-yellow-600">
              Unsupported file type.
              <button onClick={() => window.open(fileUrl, "_blank")} className="underline ml-2">
                Open in new tab
              </button>
            </div>
          )}


            {/* Preview error */}
            {previewError && (
              <div className="p-6 text-center text-red-600 dark:text-red-400">
                {previewError}
              </div>
            )}
          </div>

          {/* Download Button */}
          <div className="flex justify-end mt-4">
            <button
              onClick={downloadFile}
              disabled={downloading}
              className={`px-4 py-2 rounded-lg text-white ${
                downloading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {downloading ? "Downloading…" : "⬇ Download"}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
