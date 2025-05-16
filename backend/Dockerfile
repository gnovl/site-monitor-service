FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application
COPY . .

ENV FLASK_APP=run.py
ENV FLASK_ENV=production
ENV SECRET_KEY=default_key_change_in_production

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:app"]