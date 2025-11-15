import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Dialog } from "@headlessui/react";

export default function TenantExitWizard() {
  const [tenancies, setTenancies] = useState([]);
  const [selectedTenancy, setSelectedTenancy] = useState(null);
  const [deposit, setDeposit] = useState(0);
  const [deductions, setDeductions] = useState([{ reason: "", amount: "" }]);
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(true);

  const finalRefund =
    deposit -
    deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  // Fetch active tenants
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

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed inset-0 z-50">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Centered modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 transition">

          {/* Step progress header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold dark:text-white">Tenant Exit Wizard</h2>
            <button
              onClick={() => setIsOpen(false)}
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

          {/* ------------------- STEP 1 ------------------- */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 dark:text-white">
                Step 1 – Select Tenant
              </h3>

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
                <div className="mt-4 p-4 rounded bg-gray-100 dark:bg-gray-800 dark:text-white">
                  <p>
                    <strong>Deposit Amount: </strong> ₹{deposit}
                  </p>
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

          {/* ------------------- STEP 2 ------------------- */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 dark:text-white">
                Step 2 – Add Deductions
              </h3>

              {deductions.map((d, i) => (
                <div key={i} className="flex gap-3 mb-3">
                  <input
                    className="border p-2 flex-1 rounded dark:bg-gray-800 dark:text-white"
                    placeholder="Reason"
                    value={d.reason}
                    onChange={(e) =>
                      updateDeduction(i, "reason", e.target.value)
                    }
                  />
                  <input
                    className="border p-2 w-32 rounded dark:bg-gray-800 dark:text-white"
                    placeholder="Amount"
                    type="number"
                    min="0"
                    value={d.amount}
                    onChange={(e) =>
                      updateDeduction(i, "amount", e.target.value)
                    }
                  />
                </div>
              ))}

              <button
                onClick={addDeduction}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-white mb-4"
              >
                + Add Deduction
              </button>

              <div className="mt-4 p-4 bg-green-100 dark:bg-green-800 rounded">
                <strong>Final Refund:</strong> ₹{finalRefund}
              </div>

              <div className="mt-6 flex justify-between">
                <button onClick={prev} className="px-6 py-2 bg-gray-300 rounded-lg">
                  ← Back
                </button>
                <button onClick={next} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* ------------------- STEP 3 ------------------- */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 dark:text-white">
                Step 3 – Review & Generate PDF
              </h3>

              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4">
                <p><strong>Tenant:</strong> {selectedTenancy?.tenant_name}</p>
                <p><strong>Flat:</strong> {selectedTenancy?.flat_id}</p>
                <p><strong>Deposit:</strong> ₹{deposit}</p>
                <p><strong>Refund:</strong> ₹{finalRefund}</p>
              </div>

              <button
                onClick={() => alert("PDF Generated")}
                className="w-full py-3 bg-green-600 text-white text-lg rounded-lg hover:bg-green-700"
              >
                ✓ Finalize & Generate PDF
              </button>

              <div className="mt-4 flex justify-start">
                <button onClick={prev} className="px-6 py-2 bg-gray-300 rounded-lg">
                  ← Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
