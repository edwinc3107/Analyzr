# fields.py
import re

def extract_core_fields(text):
    data = {}

    # Example: extract loan amount assuming pattern like "$123,456"
    loan_match = re.search(r"Loan Amount:?\s*\$?([\d,]+)", text, re.IGNORECASE)
    if loan_match:
        data["LoanAmount"] = loan_match.group(1).replace(",", "")

    # Add more regex patterns for other fields like Credit Score, Income, etc.
    
    return data
