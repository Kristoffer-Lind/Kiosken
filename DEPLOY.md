# Deploy till Railway

## Steg 1 – Skapa Railway-projekt
1. Gå till https://railway.app och logga in
2. New Project → Deploy from GitHub repo
3. Välj detta repo (pusha det till GitHub först, se nedan)

## Steg 2 – Pusha till GitHub
```bash
# I Kiosken-mappen:
git remote add origin https://github.com/DITT-ANVÄNDARNAMN/kiosken.git
git push -u origin master
```

## Steg 3 – Lägg till PostgreSQL på Railway
1. I Railway-projektet: + New → Database → Add PostgreSQL
2. Railway sätter automatiskt DATABASE_URL som env-variabel

## Steg 4 – Lägg till Build Command i Railway
Under ditt service → Settings → Build Command:
```
npm install --prefix server && npm install --prefix client && npm run build --prefix client
```
Start Command sätts automatiskt från railway.toml.

## Steg 5 – Miljövariabler på Railway
Lägg till under Variables:
```
NODE_ENV=production
PORT=3000  (Railway hanterar detta automatiskt)
```

## Steg 6 – Deploy
Railway bygger och deployar automatiskt vid varje push till GitHub.

## Lokal körning (utan Railway)
```bash
# Kräver PostgreSQL lokalt, kopiera .env.example till .env och fyll i
cp .env.example server/.env

# Starta backend:
npm run dev:server

# Starta frontend (i nytt terminal):
npm run dev:client
# Öppna http://localhost:3000
```

## Standard PIN
PIN vid start: **1234** — byt direkt i Inställningar!
