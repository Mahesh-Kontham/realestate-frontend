"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.vfs;

export default function TenantExitWizard() {
  const [tenancies, setTenancies] = useState([]);
  const [selectedTenancy, setSelectedTenancy] = useState(null);
  const [deposit, setDeposit] = useState(0);
  const [deductions, setDeductions] = useState([]); // array of { reason, amount }
  const [finalRefund, setFinalRefund] = useState(null);

  // ✅ Fetch all active tenancies
  useEffect(() => {
    const fetchTenancies = async () => {
      const { data, error } = await supabase
        .from("tenancies")
        .select("id, tenant_name, flat_id, deposit_amount, is_active")
        .eq("is_active", true);

      if (!error && data) setTenancies(data);
    };
    fetchTenancies();
  }, []);

  // ✅ Select tenancy and reset deduction info
  const handleSelect = (id) => {
    const t = tenancies.find((x) => x.id == id);
    setSelectedTenancy(t || null);
    setDeposit(t?.deposit_amount || 0);
    setDeductions([]);
    setFinalRefund(t?.deposit_amount || 0);
  };

  // ✅ Add new deduction row
  const addDeduction = () => {
    setDeductions([...deductions, { reason: "", amount: "" }]);
  };

  // ✅ Update a deduction row and auto-calculate refund
  const updateDeduction = (index, field, value) => {
    const updated = [...deductions];
    updated[index][field] = field === "amount" ? Number(value) || 0 : value;
    setDeductions(updated);

    const totalDeductions = updated.reduce(
      (sum, d) => sum + (Number(d.amount) || 0),
      0
    );
    setFinalRefund(deposit - totalDeductions);
  };

  // ✅ Generate PDF Summary
  const generatePDF = () => {
    if (!selectedTenancy) return alert("Select a tenancy first!");
    const tenantName = selectedTenancy.tenant_name;
    const flatId = selectedTenancy.flat_id;

    const totalDeductions = deductions.reduce(
      (sum, d) => sum + (Number(d.amount) || 0),
      0
    );

    const deductionRows =
      deductions.length > 0
        ? deductions.map((d) => [d.reason || "-", `₹${d.amount || 0}`])
        : [["No deductions", "₹0"]];

    const docDefinition = {
      content: [
        { text: "🏠 Tenant Exit Summary", style: "header" },
        { text: `Date: ${new Date().toLocaleDateString("en-IN")}`, margin: [0, 5, 0, 15] },

        { text: `Tenant Name: ${tenantName}`, style: "subheader" },
        { text: `Flat ID: ${flatId}`, style: "subheader" },
        { text: `Deposit Amount: ₹${deposit}`, style: "subheader", margin: [0, 0, 0, 15] },

        { text: "Deductions", style: "sectionHeader" },
        {
          table: {
            headerRows: 1,
            widths: ["*", 100],
            body: [["Reason", "Amount"], ...deductionRows],
          },
          layout: "lightHorizontalLines",
          margin: [0, 5, 0, 15],
        },

        { text: `Total Deductions: ₹${totalDeductions}`, style: "subheader" },
        {
          text: `Final Refund: ₹${finalRefund}`,
          style: "important",
          margin: [0, 10, 0, 20],
        },

        { text: "Thank you for staying with us!", margin: [0, 20, 0, 10] },
        { text: "Authorized Signature: ___________________", margin: [0, 10, 0, 0] },
      ],
      styles: {
        header: { fontSize: 20, bold: true, alignment: "center", margin: [0, 0, 0, 15] },
        subheader: { fontSize: 12, margin: [0, 2, 0, 2] },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
        important: { fontSize: 14, bold: true, color: "green" },
      },
    };

    pdfMake.createPdf(docDefinition).download(`${tenantName}_ExitSummary.pdf`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-semibold mb-6 text-center">Tenant Exit Wizard</h2>

      {/* Step 1: Select Tenancy */}
      <div className="mb-6">
        <label className="font-semibold mr-2">Select Tenancy:</label>
        <select
          className="border rounded p-2"
          onChange={(e) => handleSelect(e.target.value)}
        >
          <option value="">-- Select --</option>
          {tenancies.map((t) => (
            <option key={t.id} value={t.id}>
              {t.tenant_name} ({t.flat_id})
            </option>
          ))}
        </select>
      </div>

      {selectedTenancy && (
        <>
          <div className="bg-gray-100 p-4 rounded mb-6">
            <p><strong>Deposit Amount:</strong> ₹{deposit}</p>
          </div>

          {/* Deduction Section */}
          <h3 className="text-lg font-semibold mb-2">Add Deductions</h3>
          {deductions.map((d, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                placeholder="Reason"
                className="border p-2 flex-1 rounded"
                value={d.reason}
                onChange={(e) => updateDeduction(i, "reason", e.target.value)}
              />
              <input
                placeholder="Amount"
                className="border p-2 w-32 rounded"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={d.amount}
                onChange={(e) => updateDeduction(i, "amount", e.target.value)}
                style={{
                  appearance: "textfield",
                  MozAppearance: "textfield",
                  WebkitAppearance: "none",
                }}
              />
            </div>
          ))}

          <button
            onClick={addDeduction}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 mb-4"
          >
            + Add Deduction
          </button>

          {/* Final Refund Display */}
          <div className="bg-green-100 p-4 rounded mb-6">
            <h3 className="text-lg font-semibold">
              Final Refund Amount: ₹{finalRefund ?? deposit}
            </h3>
          </div>

          {/* Generate PDF Button */}
          <button
            onClick={generatePDF}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Finalize Settlement & Generate PDF
          </button>
        </>
      )}
    </div>
  );
}
