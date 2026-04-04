from fastapi import FastAPI, File, UploadFile, HTTPException
import pytesseract
from PIL import Image
import io

# Tesseract-OCR 경로 설정 (Windows 환경일 경우 필요할 수 있습니다)
# 만약 Tesseract를 설치한 경로가 다르다면 아래 주석을 해제하고 경로를 맞춰주세요.
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

app = FastAPI(
    title="Simple OCR API", 
    description="MLOps 파이프라인을 위한 간단한 이미지 텍스트 추출(OCR) API 서버입니다.",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "OCR API 서버에 오신 것을 환영합니다. API 문서 확인은 /docs 에 접속하세요."}

@app.post("/ocr/")
async def perform_ocr(file: UploadFile = File(...)):
    """
    이미지 파일을 업로드하면 해당 이미지에서 텍스트를 추출하여 반환합니다.
    """
    # 업로드된 파일이 이미지인지 확인
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")

    try:
        # 파일 내용을 읽어옵니다.
        contents = await file.read()
        
        # PIL(Pillow)를 사용하여 이미지를 바이트에서 객체로 변환
        image = Image.open(io.BytesIO(contents))
        
        # pytesseract를 사용하여 이미지에서 텍스트 추출 (한국어, 영어 지원)
        # 만약 영문만 필요하다면 lang='eng' 로 변경하세요.
        text = pytesseract.image_to_string(image, lang='kor+eng')
        
        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "extracted_text": text.strip()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 처리 중 오류 발생: {str(e)}")
