import { useState } from 'react'
import './App.css'
import Papa from 'papaparse'

function App() {
  const [file, setFile] = useState(null)
  const [csv, setCsv] = useState([])

  function handleFileChange(e) {
    const uploadedFile = e.target.files[0]
    setFile(uploadedFile)
    console.log("File selected:", uploadedFile)
  }

  function handleClick(e) {
    e.preventDefault()
    if (file) {
      console.log("Uploaded file:", file)
      const reader = new FileReader()

      reader.onload = function (event) {
        const text = event.target.result

        Papa.parse(text,{
          header: true,
          skipEmptyLines: true,
          complete: function(res){
            setCsv(res.data)
            console.log("CSV parsed data:", res.data)
          }
        })
      }
      reader.readAsText(file)

    } else {
      console.log("No file uploaded yet.")
    }
  }

  function calculate(borrower){

    const credit = parseFloat(borrower.CreditScore)
    const income = parseFloat(borrower.Income)
    const loan = parseFloat(borrower.LoanAmount)

    let risk = "Low"
    let reasons = []

    if(credit < 600){
      risk = "High"
      reasons.push("Poor credit score")
    }

    if(loan / income > 0.4){
      risk = "High"
      reasons.push("High loan-to-income ratio")
    }

    return { name: borrower.Name, risk, reasons }
  }

  return (
    <div className='bg-gradient-to-r from-teal-400 to-yellow-200 w-full h-full pt-40 p-100'>
      <title>
        Loan-Analyzer
      </title>
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
          >
            Submit
          </button>
        </div>
      </div>
      {csv.length > 0 && (
  <div className="mt-6">
    <h2 className="font-semibold mb-2">Parsed CSV Data:</h2>
    <pre className="bg-gray-100 p-4 rounded max-h-96 overflow-auto">
      {JSON.stringify(csv, null, 2)}
    </pre>
  </div>
)}

<div>
  {csv.length > 0 && 
  (
    <div className="mt-6">
      <h2 className="font-semibold mb-2">Evaluated:</h2>
      {csv.map(borrower => (
        <pre className="bg-gray-100 p-4 rounded max-h-96 overflow-auto">
          {JSON.stringify(calculate(borrower), null, 2)}
        </pre>
      ))}
    </div>
  )}
</div>


    </div>
  )
}

export default App
