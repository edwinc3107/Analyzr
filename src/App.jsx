import { useState } from 'react'
import './App.css'
import Papa from 'papaparse'
import axios from 'axios'

function App() {
  const [file, setFile] = useState(null)
  const [csv, setCsv] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState(null)

  function handleFileChange(e) {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return
    
    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (uploadedFile.size > maxSize) {
      setError(`File size exceeds 10MB limit. Please upload a smaller file.`)
      setFile(null)
      setFileName(null)
      return
    }
    
    // File type validation
    const validTypes = ['application/pdf', 'text/csv', 'application/vnd.ms-excel']
    const validExtensions = ['.pdf', '.csv']
    const fileExtension = uploadedFile.name.toLowerCase().slice(uploadedFile.name.lastIndexOf('.'))
    
    if (!validTypes.includes(uploadedFile.type) && !validExtensions.includes(fileExtension)) {
      setError('Invalid file type. Please upload a PDF or CSV file.')
      setFile(null)
      setFileName(null)
      return
    }
    
    setFile(uploadedFile)
    setFileName(uploadedFile.name)
    setError(null)
    setCsv([]) // Clear previous results
    console.log("File selected:", uploadedFile.name)
  }

  // ---------- Financial Ratio Functions ----------
  function ltv(loan, asset_value) {
    if (!asset_value || asset_value === 0) return 0
    return (loan / asset_value) * 100
  }

  function ltc(loan, total_cost) {
    if (!total_cost || total_cost === 0) return 0
    return (loan / total_cost) * 100
  }

  function dscr(net_operating_income, annual_debt_service) {
    if (!annual_debt_service || annual_debt_service === 0) return 0
    return net_operating_income / annual_debt_service
  }

  function debt_yield(net_operating_income, loan_amount) {
    if (!loan_amount || loan_amount === 0) return 0
    return (net_operating_income / loan_amount) * 100
  }

  // ---------- Utility ----------
  function isPdf(file) {
    return file && file.type === "application/pdf"
  }

  // ---------- Export Functions ----------
  function exportToCSV() {
    if (csv.length === 0) return

    const headers = ['Name', 'LoanAmount', 'AssetValue', 'TotalCost', 'NetOperatingIncome', 
                     'AnnualDebtService', 'CreditScore', 'Income', 'Risk', 'LTV', 'LTC', 
                     'DSCR', 'DebtYield', 'Reasons']
    
    const rows = csv.map(borrower => {
      const result = calculate(borrower)
      return [
        result.name || 'Unknown',
        borrower.LoanAmount || 0,
        borrower.AssetValue || 0,
        borrower.TotalCost || 0,
        borrower.NetOperatingIncome || 0,
        borrower.AnnualDebtService || 0,
        borrower.CreditScore || 0,
        borrower.Income || 0,
        result.risk,
        isNaN(result.ratios.LTV) ? 'N/A' : result.ratios.LTV.toFixed(2) + '%',
        isNaN(result.ratios.LTC) ? 'N/A' : result.ratios.LTC.toFixed(2) + '%',
        isNaN(result.ratios.DSCR) ? 'N/A' : result.ratios.DSCR.toFixed(2),
        isNaN(result.ratios.DebtYield) ? 'N/A' : result.ratios.DebtYield.toFixed(2) + '%',
        result.reasons.join('; ')
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `loan-analysis-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      // CSV parsing
      const reader = new FileReader()
      reader.onload = function(event) {
        Papa.parse(event.target.result, {
          header: true,
          skipEmptyLines: true,
          complete: function(res) {
            // Validate CSV has required columns
            const requiredColumns = ['Name', 'LoanAmount', 'AssetValue', 'TotalCost', 
                                   'NetOperatingIncome', 'AnnualDebtService', 'CreditScore', 'Income']
            const csvHeaders = res.meta.fields || []
            const missingColumns = requiredColumns.filter(col => 
              !csvHeaders.some(h => h.toLowerCase() === col.toLowerCase())
            )
            
            if (missingColumns.length > 0) {
              setError(`CSV is missing required columns: ${missingColumns.join(', ')}. ` +
                       `Found columns: ${csvHeaders.join(', ')}`)
              setLoading(false)
              return
            }
            
            if (res.data.length === 0) {
              setError("CSV file appears to be empty or has no valid rows.")
              setLoading(false)
              return
            }
            
            setCsv(res.data)
            setLoading(false)
          },
          error: function(err) {
            setError("Failed to parse CSV file. Please check the file format.")
            console.error(err)
            setLoading(false)
          }
        })
      }
      reader.onerror = function() {
        setError("Failed to read file.")
        setLoading(false)
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
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <div className='container mx-auto px-4 py-8 max-w-7xl'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-lg p-8 mb-6'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-4xl font-bold text-gray-800 mb-2'>
                Loan Risk Analyzer
              </h1>
              <p className='text-gray-600'>
                Upload PDF loan documents or CSV files to analyze borrower risk and financial ratios
              </p>
            </div>
            <div className='w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold'>
              AR
            </div>
          </div>

          {/* File Upload Section */}
          <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:border-indigo-400 transition-colors'>
            <div className='flex flex-col md:flex-row items-center gap-4'>
              <label className='cursor-pointer flex-1'>
                <input
                  className='hidden'
                  type="file"
                  accept='.pdf,.csv'
                  onChange={handleFileChange}
                  disabled={loading}
                />
                <div className='flex items-center justify-center w-full px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'>
                  <svg className='w-6 h-6 text-gray-600 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                  </svg>
                  <span className='text-gray-700 font-medium'>
                    {fileName || 'Choose file (PDF or CSV)'}
                  </span>
                </div>
              </label>
              <button
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                onClick={handleClick}
                disabled={loading || !file}
              >
                {loading ? (
                  <span className='flex items-center'>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : 'Analyze'}
              </button>
            </div>
            {fileName && (
              <div className='mt-3 text-sm text-gray-600 flex items-center'>
                <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
                {fileName}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>

      {/* Results Section */}
      {csv.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Analysis Results</h2>
              <p className="text-gray-600">{csv.length} borrower{csv.length !== 1 ? 's' : ''} analyzed</p>
            </div>
            <button
              onClick={exportToCSV}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Borrower</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Risk Level</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">LTV</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">LTC</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">DSCR</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Debt Yield</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Risk Factors</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {csv.map((borrower, idx) => {
                  const result = calculate(borrower)
                  const riskBadgeColors = {
                    'High': 'bg-red-100 text-red-800 border-red-200',
                    'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                    'Low': 'bg-green-100 text-green-800 border-green-200'
                  }
                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                            <span className="text-indigo-600 font-semibold">
                              {result.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="font-medium text-gray-900">{result.name || 'Unknown'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${riskBadgeColors[result.risk] || riskBadgeColors['Low']}`}>
                          {result.risk}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 font-mono">
                        {isNaN(result.ratios.LTV) ? <span className="text-gray-400">N/A</span> : result.ratios.LTV.toFixed(2) + "%"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 font-mono">
                        {isNaN(result.ratios.LTC) ? <span className="text-gray-400">N/A</span> : result.ratios.LTC.toFixed(2) + "%"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 font-mono">
                        {isNaN(result.ratios.DSCR) ? <span className="text-gray-400">N/A</span> : result.ratios.DSCR.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 font-mono">
                        {isNaN(result.ratios.DebtYield) ? <span className="text-gray-400">N/A</span> : result.ratios.DebtYield.toFixed(2) + "%"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {result.reasons.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {result.reasons.map((reason, rIdx) => (
                              <span key={rIdx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                {reason}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-green-600 font-medium">No risk factors</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default App
