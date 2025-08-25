import re

# Step 1: Pretend this came from a messy loan document
doc_text = """
Borrower: John A. Doe
Loan Amount - 250,000 USD
Annual Percentage Rate (APR) = 5.5 %
"""

import re

import re

def normalize_interest_rate(rate: str):
    # Step 1: check if % sign is present
    has_percent = "%" in rate.lower()

    # Step 2: extract just numbers and decimal
    num_str = re.sub(r"[^\d.]", "", rate)
    if not num_str:
        return "Invalid, please check."

    rate_value = float(num_str)

    # Step 3: apply conversion
    if has_percent:
        # e.g. "5%" -> 0.05
        if rate_value <= 100:
            return rate_value / 100
        else:
            return "Invalid, please check."
    else:
        # e.g. "0.05" -> 0.05, "7.25" -> 0.0725 (since it's meant as percent?)
        if rate_value < 1:  
            return rate_value
        elif 1 <= rate_value <= 100:
            return rate_value / 100
        else:
            return "Invalid, please check."

print(normalize_interest_rate("5%"))                     # 0.05
print(normalize_interest_rate("0.05"))                   # 0.05
print(normalize_interest_rate("Interest rate: 7.25 percent")) # 0.0725
print(normalize_interest_rate("200%"))                   # Invalid


# Step 2: Define regex patterns
patterns = {
    "interest_rate": r"(interest rate|APR|annual percentage rate)[^\d]*(\d+(\.\d+)?) ?%?",
    "loan_amount": r"(loan amount|principal)[^\d]*(\d{2,}[,]?\d*)",
    "borrower_name": r"(borrower|applicant)[:\- ]+([A-Za-z .]+)"
}

# Step 3: Extract matches
results = {}
for label, pattern in patterns.items():
    match = re.search(pattern, doc_text, re.IGNORECASE)
    if match:
        # Take last captured group (the actual value)
        results[label] = match.groups()[-1].strip()

print(results)
