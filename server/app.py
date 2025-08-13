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
    data = fields.extract_core_fields(text)
    
    return {"text": text, "fields": data}
