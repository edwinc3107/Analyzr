# Analyzr

The project focuses on making data handling intuitive by allowing users to upload, parse, and explore CSV files and PDF loan documents in a clean interface. It aims to bridge the gap between raw data and actionable insights, giving users a lightweight, accessible alternative to heavy analytics platforms. (Specifically for banking analysts, commercial real-estate agents)

## Features
- Upload and parse CSV files directly in the browser  
- Upload PDF loan documents for automated data extraction
- Extract financial fields (Loan Amount, Credit Score, Asset Value, etc.) from PDFs using NLP
- Calculate financial ratios (LTV, LTC, DSCR, Debt Yield)
- Automated risk scoring (Low/Medium/High) based on multiple criteria
- Real-time data handling powered by React + Vite  
- ESLint integration for clean, maintainable code  
- Cross-platform compatibility (Windows, Mac, Linux)

## Tech Stack
- **React + Vite** → frontend with hot module replacement (HMR)  
- **Papaparse** → CSV parsing
- **FastAPI** → Python backend API
- **pdfplumber** → PDF text extraction
- **spaCy** → Named Entity Recognition for borrower names
- **Axios** → API integration support  
- **ESLint** → linting and code quality
- **Tailwind CSS** → modern styling

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Python 3.9 or higher
- npm or yarn

### Frontend Setup
```bash
cd Analyzr
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`

### Backend Setup
```bash
cd Analyzr/server

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install spaCy English model (required for NER)
python -m spacy download en_core_web_sm

# Run the server
uvicorn app:app --reload --port 8000
```
The backend will run on `http://127.0.0.1:8000`

## Usage
1. Start both frontend and backend servers
2. Open the frontend in your browser
3. Upload either a CSV file or PDF loan document
4. View the analyzed results with risk scores and financial ratios

## Notes
- CSV files are parsed directly in the browser
- PDF files are sent to the backend for processing
- The app supports multiple borrowers in a single PDF (separated by "Borrower:" markers)  
