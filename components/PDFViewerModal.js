import React from "react";

export default function PDFViewerModal({ url, open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg w-[80%] h-[80%] relative">

        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-red-500 text-xl"
          onClick={onClose}
        >
          ✖
        </button>

        {/* PDF Frame */}
        <iframe
          src={url}
          className="w-full h-full rounded"
          title="PDF View"
        ></iframe>
      </div>
    </div>
  );
}
