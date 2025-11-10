import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { supabase } from "../../supabase/client";


export default function TenantExitWizard() {
  const [tenancies, setTenancies] = useState([]);
  const [selectedTenancy, setSelectedTenancy] = useState(null);
  const [unpaidRent, setUnpaidRent] = useState(0);
  const [dues, setDues] = useState(0);
  const [maintenance, setMaintenance] = useState([]);
  const [deposit, setDeposit] = useState(0);
  const [deductions, setDeductions] = useState([]);
  const [finalRefund, setFinalRefund] = useState(null);

  
  useEffect(() => {
  const fetchTenancies = async () => {
    console.log("🔍 Fetching tenancies...");
    const { data, error } = await supabase
      .from("tenancies")
      .select("id, tenant_name, flat_id,deposit_amount, is_active");

    if (error) {
      console.error("❌ Supabase fetch error:", error);
    } else {
      console.log("✅ Supabase data:", data);
      setTenancies(data);
    }
  };

  fetchTenancies();
}, []);


  const handleSelect = (id) => {
    const t = tenancies.find((x) => x.id == id);
    setSelectedTenancy(t);
  
    
  };

  const addDeduction = () => setDeductions([...deductions, { reason: "", amount: 0 }]);

  const updateDeduction = (i, field, value) => {
    const newDeductions = [...deductions];
    newDeductions[i][field] = value;
    setDeductions(newDeductions);
  };

  const calculateRefund = () => {
    const totalDeduction = deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const refund = deposit - (unpaidRent + dues + totalDeduction);
    setFinalRefund(refund);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Tenant Exit Settlement Summary", 14, 20);
    doc.text(`Tenant: ${selectedTenancy.tenant_name}`, 14, 30);
    doc.text(`Flat: ${selectedTenancy.flat_id}`, 14, 38);
    doc.text(`Deposit: ₹${deposit}`, 14, 46);
    doc.text(`Unpaid Rent: ₹${unpaidRent}`, 14, 54);
    doc.text(`Dues: ₹${dues}`, 14, 62);
    doc.text(`Final Refund: ₹${finalRefund}`, 14, 70);

    doc.autoTable({
      startY: 80,
      head: [["Reason", "Amount"]],
      body: deductions.map((d) => [d.reason, `₹${d.amount}`]),
    });

    doc.save(`Exit_Settlement_${selectedTenancy.tenant_name}.pdf`);
  };

  const finalizeSettlement = () => {
    alert("Settlement finalized successfully!");
    generatePDF();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-semibold mb-6">Tenant Exit Wizard</h2>

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
          {/* Summary Section */}
          <div className="bg-gray-100 p-4 rounded mb-6">
            <p><strong>Unpaid Rent:</strong> ₹{unpaidRent}</p>
            <p><strong>Association Dues:</strong> ₹{dues}</p>
            <p><strong>Deposit:</strong> ₹{deposit}</p>
            <p><strong>Pending Tickets:</strong> {maintenance.length}</p>
          </div>

          {/* Deductions */}
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
                type="number"
                value={d.amount}
                onChange={(e) => updateDeduction(i, "amount", e.target.value)}
              />
            </div>
          ))}
          <button
            onClick={addDeduction}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 mb-4"
          >
            + Add Deduction
          </button>

          {/* Preview Refund */}
          <div className="my-4">
            <button
              onClick={calculateRefund}
              className="bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600"
            >
              Preview Refund
            </button>
          </div>

          {finalRefund !== null && (
            <div className="bg-green-100 p-4 rounded mb-6">
              <h3 className="text-lg font-semibold">
                Final Refund Amount: ₹{finalRefund}
              </h3>
            </div>
          )}

          {/* Finalize */}
          {finalRefund !== null && (
            <button
              onClick={finalizeSettlement}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Finalize Settlement & Generate PDF
            </button>
          )}
        </>
      )}
    </div>
  );
}
