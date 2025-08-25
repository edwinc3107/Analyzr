import { useState } from 'react'
import './App.css'
import Papa from 'papaparse'
import axios from 'axios'

function App() {
  const [file, setFile] = useState(null)
  const [csv, setCsv] = useState([])

  function handleFileChange(e) {
    const uploadedFile = e.target.files[0]
    setFile(uploadedFile)
    console.log("File selected:", uploadedFile)
  }

  // ---------- Financial Ratio Functions ----------
  function ltv(loan, asset_value) {
    return (loan / asset_value) * 100
  }

  function ltc(loan, total_cost) {
    return (loan / total_cost) * 100
  }

  function dscr(net_operating_income, annual_debt_service) {
    return net_operating_income / annual_debt_service
  }

  function debt_yield(net_operating_income, loan_amount) {
    return (net_operating_income / loan_amount) * 100
  }

  // ---------- Utility ----------
  function isPdf(file) {
    return file && file.type === "application/pdf"
  }

  // ---------- Main Submit ----------
 async function handleClick(e) {
  e.preventDefault()
  if (!file) return console.log("No file uploaded yet.")

  setLoading(true)
  setError(null)

  try {
    if (isPdf(file)) {
      const formData = new FormData()
      formData.append("file", file)
      const res = await axios.post("http://127.0.0.1:8000/analyze/pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      setCsv(Array.isArray(res.data) ? res.data : [res.data.fields])
    } else {
      const reader = new FileReader()
      reader.onload = function(event) {
        Papa.parse(event.target.result, {
          header: true,
          skipEmptyLines: true,
          complete: function(res) { setCsv(res.data) }
        })
      }
      reader.readAsText(file)
    }
  } catch (err) {
    setError("Upload or parsing failed. Check console for details.")
    console.error(err)
  } finally {
    setLoading(false)
  }
}

  // ---------- Risk Calculation ----------
  function calculate(borrower) {
    const loan = parseFloat(borrower.LoanAmount || 0)
    const assetValue = parseFloat(borrower.AssetValue || 0)
    const totalCost = parseFloat(borrower.TotalCost || 0)
    const noi = parseFloat(borrower.NetOperatingIncome || 0)
    const annualDebtService = parseFloat(borrower.AnnualDebtService || 0)
    const credit = parseFloat(borrower.CreditScore || 0)
    const income = parseFloat(borrower.Income || 1) // prevent divide by zero


    const ratios = {
      LTV: ltv(loan, assetValue),
      LTC: ltc(loan, totalCost),
      DSCR: dscr(noi, annualDebtService),
      DebtYield: debt_yield(noi, loan)
    }

    let risk = "Low"
    let reasons = []
    let riskCount = 0

    if (credit < 600) { reasons.push("Poor credit score"); riskCount++ }
    if (loan / income > 0.4) { reasons.push("High loan-to-income ratio"); riskCount++ }
    if (ratios.LTV > 80) { reasons.push("LTV above 80%"); riskCount++ }
    if (ratios.LTC > 85) { reasons.push("LTC above 85%"); riskCount++ }
    if (ratios.DSCR < 1.2) { reasons.push("DSCR below 1.2"); riskCount++ }
    if (ratios.DebtYield < 10) { reasons.push("Debt Yield below 10%"); riskCount++ }

    if (riskCount >= 3) risk = "High"
    else if (riskCount >= 1) risk = "Medium"

    return { name: borrower.Name, risk, reasons, ratios }
  }

  return (
    <div className='bg-gradient-to-r from-teal-400 to-yellow-200 w-full h-full pt-40 p-100'>
      <div className='p-10 bg-white flex flex-col justify-center'>
        <div className='p-4'>
          <h1 className='text-3xl font-bold'>
            Loan-Risk Analyzer
            <p className='text-sm text-gray-400'>
              Upload a borrower’s loan document to analyze risk
            </p>
          </h1>
        </div>
        <div className='p-4'>
          <input
            className='border border-gray-300 p-3'
            type="file"
            accept='.pdf,.csv'
            onChange={handleFileChange}
          />
          <button
            className="bg-gray-700 text-white p-3 ml-4 rounded"
            onClick={handleClick}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Submit"}
          </button>
        </div>
      </div>

      {csv.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Evaluated Borrowers:</h2>
          <table className="min-w-full border border-gray-300 bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Risk</th>
                <th className="p-2 border">LTV</th>
                <th className="p-2 border">LTC</th>
                <th className="p-2 border">DSCR</th>
                <th className="p-2 border">Debt Yield</th>
                <th className="p-2 border">Reasons</th>
              </tr>
            </thead>
            <tbody>
              {csv.map((borrower, idx) => {
                const result = calculate(borrower)
                return (
                  <tr key={idx}>
                    <td className="p-2 border">{result.name}</td>
                    <td className={`p-2 border font-bold ${result.risk === 'High' ? 'text-red-600' : result.risk === 'Medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                      {result.risk}
                    </td>
                    <td className="p-2 border">{result.ratios.LTV.toFixed(2)}%</td>
                    <td className="p-2 border">{result.ratios.LTC.toFixed(2)}%</td>
                    <td className="p-2 border">{result.ratios.DSCR.toFixed(2)}</td>
                    <td className="p-2 border">{result.ratios.DebtYield.toFixed(2)}%</td>
                    <td className="p-2 border">{result.reasons.join(", ")}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default App
