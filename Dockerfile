# 1. 사용할 베이스 이미지 지정 (슬림 버전으로 이미지 크기 최적화)
FROM python:3.11-slim

# 2. 파이썬 환경 변수 설정 (바이트코드 생성 방지, 로그 출력 버퍼링 방지)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Tesseract-OCR 및 한글 언어팩 등 시스템 의존성 설치
# apt 캐시를 비워 이미지 크기를 최소화 (rm -rf /var/lib/apt/lists/*)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-kor \
    tesseract-ocr-eng \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 4. 작업 디렉터리 설정
WORKDIR /app

# 5. 요구사항 파일 복사 및 설치 (도커 레이어 캐싱 최적화를 위해 메인 소스코드보다 먼저 복사)
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# 6. 소스 코드 복사
COPY . /app/

# 7. 컨테이너가 사용할 포트 명시
EXPOSE 8000

# 8. 컨테이너 실행 시 기본 명령어
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
