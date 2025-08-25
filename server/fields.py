import re
import spacy

nlp = spacy.load('en_core_web_sm')

def normalize_number(val_str):
    if not val_str: return 0
    clean = re.sub(r"[^\d.]", "", val_str)  # remove non-digits except dot
    try:
        return float(clean)
    except ValueError:
        return 0
    
def normalize_interest_rate(rate_str):
    if not rate_str: return 0
    clean = re.sub(r"[^\d.]", "", rate_str)
    num = float(clean)
    if num < 1:
        return num
    elif num <= 100:
        return num / 100
    else:
        return None  # invalid


def extract_multiple_borrowers(text):
    segments = text.split("Borrower:")
    borrowers = []
    for seg in segments:
        clean_seg = seg.strip()
        if clean_seg:  # skip empty segments
            b = extract_core_fields(clean_seg)  # pass cleaned text
            borrowers.append(b)
    return borrowers

def extract_core_fields(text):
    data = {}

    # Regex fields
    loan_match = re.search(r"Loan Amount:?\s*\$?([\d,]+)", text, re.IGNORECASE)
    data["LoanAmount"] = normalize_number(loan_match.group(1)) if loan_match else 0

    credit_match = re.search(r"CreditScore:?\s*([\d]+)", text, re.IGNORECASE)
    data["CreditScore"] = normalize_number(credit_match.group(1)) if credit_match else 0 

    income_match = re.search(r"Income:?\s*([\d,]+)", text, re.IGNORECASE)
    data["Income"] = normalize_number(income_match.group(1)) if income_match else 0 

    asset_match = re.search(r"AssetValue:?\s*([\d,]+)", text, re.IGNORECASE)
    data["AssetValue"] = normalize_number(asset_match.group(1)) if asset_match else 0 

    cost_match = re.search(r"TotalCost:?\s*([\d,]+)", text, re.IGNORECASE)
    data["TotalCost"] = normalize_number(cost_match.group(1)) if cost_match else 0 

    operating_match = re.search(r"NetOperatingIncome:?\s*\$?([\d,]+)", text, re.IGNORECASE)
    data["NetOperatingIncome"] = normalize_number(operating_match.group(1)) if operating_match else 0 

    debt_match = re.search(r"AnnualDebtService:?\s*\$?([\d,]+)", text, re.IGNORECASE)
    data["AnnualDebtService"] = normalize_number(debt_match.group(1)) if debt_match else 0

    # Interest Rate
    interest_match = re.search(r"Interest\s*Rate:?\s*([\d.,]+)|([\d.]+)\s*%+", text, re.IGNORECASE)
    if interest_match:
        rate_str = interest_match.group(1) or interest_match.group(2)
        data["InterestRate"] = normalize_interest_rate(rate_str)
    else:
        data["InterestRate"] = 0


    # NER for Name
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            data["Name"] = ent.text.strip()
            break
    else:
        data["Name"] = "Unknown"

    return data
