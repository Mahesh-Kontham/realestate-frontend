"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Dialog } from "@headlessui/react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { useRouter } from "next/router";


export default function TenantExitWizard() {
  const [tenancies, setTenancies] = useState([]);
  const [selectedTenancy, setSelectedTenancy] = useState(null);
  const [deposit, setDeposit] = useState(0);
  const [deductions, setDeductions] = useState([{ reason: "", amount: "" }]);
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

  const finalRefund =
    deposit -
    deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  // Load active tenants
  useEffect(() => {
    const fetchTenancies = async () => {
      const { data } = await supabase
        .from("tenancies")
        .select("*")
        .eq("is_active", true);

      setTenancies(data || []);
    };
    fetchTenancies();
  }, []);

  const handleSelect = (id) => {
    const tenancy = tenancies.find((t) => t.id === Number(id));
    setSelectedTenancy(tenancy);
    setDeposit(tenancy?.deposit_amount || 0);
  };

  const updateDeduction = (i, key, value) => {
    const updated = [...deductions];
    updated[i][key] = value;
    setDeductions(updated);
  };

  const addDeduction = () => {
    setDeductions([...deductions, { reason: "", amount: "" }]);
  };

  const next = () => setStep(step + 1);
  const prev = () => setStep(step - 1);

  // ---------------------------------------------------------
  // ⭐ FIX: PDF GENERATION + DOWNLOAD (WORKING)
  // ---------------------------------------------------------
  const generatePDF = async () => {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([600, 750]);

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 700;

  // Title
  page.drawText("Tenant Exit Report", {
    x: 200,
    y,
    size: 20,
    font: titleFont,
    color: rgb(0, 0.2, 0.6),
  });

  y -= 40;

  // Helper Function
  const addLine = (label, value) => {
    let safeValue = value ? String(value) : "N/A";

    // Replace unsupported characters
    safeValue = safeValue.replace("₹", "Rs.");
    safeValue = safeValue.replace("•", "-");

    page.drawText(`${label}: ${safeValue}`, {
      x: 50,
      y,
      size: 12,
      font,
    });

    y -= 20;
  };

  // MAIN DETAILS
  addLine("Tenant Name", selectedTenancy?.tenant_name);
  addLine("Flat ID", selectedTenancy?.flat_id);
  addLine("Deposit Amount", `Rs. ${deposit}`);
  addLine("Final Refund", `Rs. ${finalRefund}`);

  // DEDUCTIONS
  y -= 20;
  page.drawText("Deductions:", {
    x: 50,
    y,
    size: 14,
    font: titleFont,
  });
  y -= 30;

  deductions.forEach((d) => {
    const reason = d.reason || "No reason";
    const amount = d.amount ? `Rs. ${d.amount}` : "Rs. 0";
    addLine(`- ${reason}`, amount);
  });

  // SAVE PDF
  const pdfBytes = await pdf.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });

  // FILE NAME
  const fileName = `Exit_Wizard_${selectedTenancy.flat_id}_${Date.now()}.pdf`;

  // 1️⃣ Download to device
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);

  // 2️⃣ Upload to Supabase Storage
  const file = new File([pdfBytes], fileName, {
    type: "application/pdf",
  });

  const { error: uploadError } = await supabase.storage
    .from("tenant-docs")
    .upload(`exit-pdfs/${fileName}`, file);

  if (uploadError) {
    console.error(uploadError);
    alert("PDF uploaded failed.");
    return;
  }

  // 3️⃣ Get Public URL
  const { data: urlData } = supabase.storage
    .from("tenant-docs")
    .getPublicUrl(`exit-pdfs/${fileName}`);

  const publicURL = urlData.publicUrl;

  // 4️⃣ Insert record into rental_documents table
  await supabase.from("rental_documents").insert([
    {
      flat_id: selectedTenancy.flat_id,
      tenant_id: selectedTenancy.id,
      type: "exit_pdf",
      month: null,
      file_url: publicURL,
      uploaded_by: selectedTenancy.email,
    },
  ]);

  alert("PDF Generated, Uploaded & Saved Successfully!");

  // 5️⃣ Redirect
  router.push("/dashboard");
};


  // ---------------------------------------------------------
  // UI BELOW (UNCHANGED, ONLY PDF FIX ADDED)
  // ---------------------------------------------------------

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold dark:text-white">Tenant Exit Wizard</h2>
           <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/dashboard");
                }}
                className="text-gray-500 hover:text-red-500"
              >
                ✖
              </button>

          </div>

          {/* Progress bar */}
          <div className="relative w-full h-2 bg-gray-200 rounded-full mb-6">
            <div
              className="absolute top-0 left-0 h-2 bg-blue-600 rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          {/* ---------------- STEP 1 ---------------- */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Step 1 – Select Tenant</h3>

              <select
                className="border rounded p-3 w-full dark:bg-gray-800 dark:text-white"
                onChange={(e) => handleSelect(e.target.value)}
              >
                <option value="">-- Select Tenancy --</option>
                {tenancies.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tenant_name} ({t.flat_id})
                  </option>
                ))}
              </select>

              {selectedTenancy && (
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 dark:text-white rounded">
                  <p><strong>Deposit Amount:</strong> ₹{deposit}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  disabled={!selectedTenancy}
                  onClick={next}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* ---------------- STEP 2 ---------------- */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Step 2 – Add Deductions</h3>

              {deductions.map((d, i) => (
                <div key={i} className="flex gap-3 mb-3">
                  <input
                    className="border p-2 flex-1 rounded dark:bg-gray-800 dark:text-white"
                    placeholder="Reason"
                    value={d.reason}
                    onChange={(e) => updateDeduction(i, "reason", e.target.value)}
                  />
                            <input
            className="border p-2 w-32 rounded dark:bg-gray-800 dark:text-white 
                      [-moz-appearance:textfield] 
                      [&::-webkit-outer-spin-button]:appearance-none 
                      [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="Amount"
            type="number"
            min="0"
            value={d.amount}
            onChange={(e) => updateDeduction(i, 'amount', e.target.value)}
          />

                </div>
              ))}

              <button
                onClick={addDeduction}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-white rounded mb-4"
              >
                + Add Deduction
              </button>

              <div className="mt-4 p-4 bg-green-100 dark:bg-green-800 rounded">
                <strong>Final Refund:</strong> ₹{finalRefund}
              </div>

              <div className="mt-6 flex justify-between">
                <button onClick={prev} className="px-6 py-2 bg-gray-300 rounded-lg">← Back</button>
                <button onClick={next} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Next →</button>
              </div>
            </div>
          )}

          {/* ---------------- STEP 3 ---------------- */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Step 3 – Review & Generate PDF</h3>

              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4">
                <p><strong>Tenant:</strong> {selectedTenancy?.tenant_name}</p>
                <p><strong>Flat:</strong> {selectedTenancy?.flat_id}</p>
                <p><strong>Deposit:</strong> ₹{deposit}</p>
                <p><strong>Refund:</strong> ₹{finalRefund}</p>
              </div>

              <button
                onClick={generatePDF}
                className="w-full py-3 bg-green-600 text-white text-lg rounded-lg hover:bg-green-700"
              >
                ✓ Finalize & Download PDF
              </button>

              <div className="mt-4 flex justify-start">
                <button onClick={prev} className="px-6 py-2 bg-gray-300 rounded-lg">← Back</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
