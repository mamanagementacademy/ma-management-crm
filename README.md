# MA Management CRM Cloud Supabase

Questa è la versione cloud sincronizzata.

## Cosa fa
- Login con email e password
- Database online Supabase
- Dati sincronizzati tra PC, iPhone e altri dispositivi
- Dashboard
- Calciatori
- Trattative
- Club e contatti
- Contratti
- Scadenze
- Documenti/link
- Finanze
- Aggiunta/modifica/eliminazione dati

## Passaggi

### 1. Crea progetto Supabase
Vai su Supabase e crea un progetto.

### 2. Crea database
Apri SQL Editor su Supabase.
Copia e incolla tutto il file:

supabase/schema.sql

Esegui il codice.

### 3. Prendi le chiavi Supabase
Vai su Project Settings -> API.
Copia:
- Project URL
- anon public key

### 4. Crea il file .env
Nella cartella del progetto crea un file chiamato:

.env

oppure

.env.local

Inserisci:

VITE_SUPABASE_URL=il_tuo_project_url
VITE_SUPABASE_ANON_KEY=la_tua_anon_key

### 5. Avvia su PC
Nel terminale:

npm install
npm run dev

Apri:
http://localhost:5173

### 6. Pubblica online
Carica il progetto su GitHub e collegalo a Vercel o Netlify.
Aggiungi le stesse variabili ambiente:
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

Così funzionerà da PC, iPhone e altri dispositivi.
