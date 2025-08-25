from fastapi import FastAPI, File, UploadFile
from . import extractor
from . import fields

app = FastAPI()

@app.post("/analyze/pdf")
async def analyze_pdf(file: UploadFile = File(...)):
    raw_bytes = await file.read()
    tmp = "/tmp/in.pdf"
    with open(tmp, "wb") as f:
        f.write(raw_bytes)

    text = extractor.extract_text_from_pdf(tmp)

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
