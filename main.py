from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import easyocr
import numpy as np
from PIL import Image
import io

app = FastAPI(
    title="Simple OCR API", 
    description="MLOps 파이프라인을 위한 간단한 이미지 텍스트 추출(OCR) API 서버입니다.",
    version="1.0.0"
)

# EasyOCR 객체 생성 (GPU 사용을 시도하며, 없으면 CPU로 떨어집니다)
reader = easyocr.Reader(['ko', 'en'])

# 정적 파일 마운트 (CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return FileResponse("static/index.html")

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
        
        # 투명 배경(PNG 등)을 처리: 투명 부분이 배경색으로 인식되도록 흰색으로 합성
        if hasattr(image, 'mode') and image.mode == 'RGBA':
            bg = Image.new("RGB", image.size, (255, 255, 255))
            bg.paste(image, mask=image.split()[3])
            image = bg
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # EasyOCR은 PIL 이미지를 직접 처리할 수 없으므로 numpy 배열로 변환
        image_np = np.array(image)
        
        # easyocr를 사용하여 이미지에서 텍스트 추출
        # detail=0 옵션은 bounding box 없이 텍스트만 리스트로 반환합니다.
        # paragraph=True 옵션을 주면 서로 가까운 텍스트를 하나로 묶어줍니다.
        result = reader.readtext(image_np, detail=0, paragraph=True)
        text = "\n".join(result)
        
        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "extracted_text": text.strip()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 처리 중 오류 발생: {str(e)}")
