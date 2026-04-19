FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential ffmpeg libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

COPY tellequant_worker ./tellequant_worker

ENV PORT=8787
EXPOSE 8787

CMD ["tellequant-worker"]
