import os
import tempfile
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import extractor
import fields

app = FastAPI()

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze/pdf")
async def analyze_pdf(file: UploadFile = File(...)):
    try:
        raw_bytes = await file.read()
        
        # Use tempfile for cross-platform compatibility
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            tmp_path = tmp_file.name
            tmp_file.write(raw_bytes)
        
        try:
            text = extractor.extract_text_from_pdf(tmp_path)
            
            # Check if text contains multiple borrowers
            if "Borrower:" in text and text.count("Borrower:") > 1:
                extracted_data = fields.extract_multiple_borrowers(text)
            else:
                extracted_data = fields.extract_core_fields(text)

            if isinstance(extracted_data, dict):
                borrowers = [extracted_data]  # wrap single borrower
            elif isinstance(extracted_data, list):
                borrowers = extracted_data
            else:
                raise ValueError("Unexpected format from extract_core_fields")

            required_keys = [
                "Name", "LoanAmount", "AssetValue", "TotalCost",
                "NetOperatingIncome", "AnnualDebtService", "CreditScore", "Income"
            ]

            normalized_borrowers = []
            for b in borrowers:
                normalized = {key: b.get(key, 0) for key in required_keys}
                normalized_borrowers.append(normalized)

            return normalized_borrowers
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
