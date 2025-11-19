import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function PaymentProofModal({ flatId, onClose, onSuccess }) {
  const [date, setDate] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  
  const handleSubmit = async () => {
    if (!date) return alert("Please select a paid date.");
    if (!file) return alert("Please upload payment proof.");

    setLoading(true);

    try {
      // 1️⃣ Upload file to Supabase storage
      const filePath = `payments/${flatId}_${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("tenant-docs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("tenant-docs")
        .getPublicUrl(filePath);

      // 2️⃣ Insert into rental_documents table
      await supabase.from("rental_documents").insert([
        {
          flat_id: flatId,
          type: "payment",
          month: date.slice(0, 7),
          file_url: urlData.publicUrl,
          uploaded_by: "admin@realestate.com",
        },
      ]);
      const convertToISO = (d) => {
        const [day, month, year] = d.split("-");
        return `${year}-${month}-${day}`;
      };

      const isoDate = convertToISO(date);

      // 3️⃣ Update flat status as paid
      await supabase
        .from("flats")
        .update({ status: "paid", paid_on: isoDate })
        .eq("flat_id", flatId);

      onSuccess();
      onClose();

    } catch (err) {
      console.error(err);
      alert("Failed to upload payment proof.");
    }

    setLoading(false); 
  };


  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-lg">

        <h2 className="text-xl font-semibold mb-4 dark:text-white">
          Upload Payment Proof
        </h2>

        {/* Paid Date */}
        <label className="text-sm dark:text-gray-300">Select Paid Date</label>
        <div className="relative">
  {/* Visible Text Input - DD-MM-YYYY */}
  <input
    type="text"
    value={date}
    placeholder="DD-MM-YYYY"
    onChange={(e) => {
      // Only allow numbers & dashes
      let val = e.target.value.replace(/[^0-9-]/g, "");

      // Auto-insert dashes: DD-MM-YYYY
      if (val.length === 2 || val.length === 5) {
        val += "-";
      }

      setDate(val);
    }}
    className="w-full p-2 pr-10 border rounded dark:bg-gray-700 dark:text-white"
  />

  {/* Calendar Icon */}
  <button
    type="button"
    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300"
    onClick={() => document.getElementById("hiddenDateInput").showPicker()}
  >
    📅
  </button>

  {/* Hidden Real Calendar Input */}
  <input
    type="date"
    id="hiddenDateInput"
    className="absolute opacity-0 pointer-events-none"
    onChange={(e) => {
      const picked = e.target.value; // yyyy-mm-dd

      if (picked) {
        const [y, m, d] = picked.split("-");
        setDate(`${d}-${m}-${y}`); // convert → DD-MM-YYYY
      }
    }}
  />
</div>
        

        {/* File Upload */}
        <label className="text-sm dark:text-gray-300">Upload Payment Screenshot</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          accept="image/*,.pdf"
          className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:text-white"
        />

        <div className="flex justify-end mt-4 gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Save"}
          </button>
        </div>

      </div>
    </div>
  );
}
