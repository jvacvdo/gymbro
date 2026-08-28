# Imagen del backend GymBro. Sirve igual en Railway, Render, Fly o Cloud Run:
# todos inyectan el puerto en $PORT, y no hay nada atado a un proveedor.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# $PORT lo define el proveedor; 8001 es el valor de reserva en local.
ENV PORT=8001
EXPOSE 8001

CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}"]
