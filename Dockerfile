# 1. 사용할 베이스 이미지 지정 (슬림 버전으로 이미지 크기 최적화)
FROM python:3.11-slim

# 2. 파이썬 환경 변수 설정 (바이트코드 생성 방지, 로그 출력 버퍼링 방지)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. EasyOCR 구동을 위한 OpenCV/시스템 의존성 설치 (libGL.so.1 오류 방지)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
# 4. 작업 디렉터리 설정
WORKDIR /app

# 5. 용량 최적화: 쿠다(CUDA)가 불필요한 환경을 위해 기본 PyTorch 대신 CPU 전용 버전을 먼저 설치 (1.5GB 이상 용량 절약)
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# 6. 요구사항 파일 복사 및 설치 (도커 레이어 캐싱 최적화를 위해 메인 소스코드보다 먼저 복사)
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# 7. 소스 코드 복사
COPY . /app/

# 8. 컨테이너가 사용할 포트 명시
EXPOSE 8000

# 9. 컨테이너 실행 시 기본 명령어
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
