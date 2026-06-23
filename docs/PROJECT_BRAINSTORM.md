# Solar System Explorer & Mission Tracker: Project Brainstorm

Questo documento raccoglie le idee di progetto, l'analisi delle API NASA disponibili e le proposte architetturali per lo sviluppo dell'applicazione interattiva in 3D/AR, da pubblicare su **GitHub Pages**.

---

## 1. Analisi dei Dati Disponibili (NASA APIs)

Abbiamo identificato e testato diverse API di `api.nasa.gov` e JPL che possono essere integrate per dare vita alla nostra applicazione:

### A. JPL SSD Horizons API (Dati 3D e Orbite)
*   **Descrizione**: Fornisce coordinate cartesiane tridimensionali precise (\(X, Y, Z\)) e vettori di velocità (\(V_x, V_y, V_z\)) per qualsiasi pianeta, satellite naturale, asteroide, cometa o sonda spaziale (es. Voyager, Perseverance, James Webb) ad ogni istante temporale.
*   **Perché è fondamentale**: È la spina dorsale per la ricostruzione 3D in tempo reale o storica delle orbite del sistema solare e dei percorsi delle missioni spaziali.
*   **Parametri chiave**: Target (`COMMAND`), origine delle coordinate (es. `500@0` per il baricentro del Sole), intervallo temporale.

### B. Near Earth Object Web Service (NeoWs)
*   **Descrizione**: Traccia gli asteroidi vicini alla Terra (NEOs) con dati su dimensioni stimated, vicinanza, velocità e se sono potenzialmente pericolosi.
*   **Applicazione nel progetto**: Possiamo visualizzare in tempo reale una "cintura di asteroidi" dinamica e mostrare quali asteroidi stanno passando vicini alla Terra in questo momento in uno spazio 3D.

### C. Mars Rover Photos API
*   **Descrizione**: Foto scattate dai rover su Marte (Curiosity, Opportunity, Spirit, Perseverance).
*   **Applicazione nel progetto**: Sezione dedicata all'esplorazione della superficie di Marte, dove l'utente può selezionare un rover, un giorno marziano (Sol) e visualizzare le foto scattate, magari inserendole in una galleria immersiva o proiettate virtualmente sul pianeta.

### D. EPIC (Earth Polychromatic Imaging Camera)
*   **Descrizione**: Immagini quotidiane della Terra a colori reali riprese dal satellite DSCOVR a 1.5 milioni di km di distanza.
*   **Applicazione nel progetto**: Visualizzare un modello 3D della Terra con la sua vera immagine giornaliera proiettata come texture o come sfondo interattivo.

### E. APOD (Astronomy Picture of the Day)
*   **Descrizione**: La foto astronomica del giorno con spiegazione scientifica.
*   **Applicazione nel progetto**: Sezione "Dashboard" o "Welcome Screen" dell'app che introduce l'utente con l'immagine spettacolare del giorno.

---

## 2. Idee di Progetto per la Visualizzazione 3D/AR

L'obiettivo è creare un'esperienza immersiva che "dia vita" a questi dati. Ecco alcune idee di implementazione:

### Idea 1: L'Orrery 3D Interattivo (Sistema Solare in Tempo Reale)
*   Un modello 3D navigabile del Sistema Solare basato su coordinate fisiche reali (non semplici cerchi concentrici, ma ellissi orbitali reali inclinate).
*   L'utente può fare zoom sui singoli pianeti per vederne i dettagli (texture ad alta definizione, lune, anelli).
*   Integrazione degli asteroidi in tempo reale dall'API **NeoWs** per mostrare le minacce spaziali che passano vicino alla Terra.

### Idea 2: Ricostruzione delle Missioni Storiche e Attive
*   Possiamo caricare le traiettorie di missioni iconiche (es. **Cassini-Huygens**, **Voyager 1 & 2**, **Mars Express**, o la sonda **Parker Solar Probe**).
*   L'utente può selezionare una missione e avviare una "Timeline": vedrà la sonda muoversi nello spazio 3D lungo la sua orbita calcolata con l'API Horizons, con eventi chiave segnalati (es. flyby gravitazionali, inserimento orbitale, atterraggio).

### Idea 3: Modalità Realtà Aumentata (AR)
*   Sfruttando le capacità WebXR del browser (disponibili su mobile e visori), l'utente può posizionare il Sistema Solare o un modello 3D dettagliato di un rover (es. Perseverance) sul tavolo del proprio salotto.
*   Alternativamente, una modalità "Sky Map" AR che mostra dove si trovano le sonde o i pianeti puntando il telefono verso il cielo (utilizzando sensori del dispositivo e calcoli orbitali).

---

## 3. Scelta Tecnologica e Architettura

Dato che l'obiettivo è pubblicare su **GitHub Pages**, l'applicazione deve essere compilata come sito statico (HTML/CSS/JS client-side). Non possiamo avere un database o un server attivo per le richieste dinamiche al volo (tutto deve avvenire nel browser dell'utente).

### Stack Consigliato (React + Vite + Three.js)

1.  **Frontend Framework**: **React (con Vite)**
    *   *Perché*: Vite è ultra-veloce, React è ideale per strutturare l'interfaccia utente (UI), i filtri e lo stato dell'app in modo pulito e modulare (DRY).
2.  **3D Engine**: **React Three Fiber (R3F)** + **@react-three/drei**
    *   *Perché*: È il wrapper React ufficiale per **Three.js**. Permette di dichiarare elementi 3D come componenti React, rendendo il codice estremamente pulito e riutilizzabile.
3.  **AR/WebXR**: **@react-three/xr**
    *   *Perché*: Facilita l'integrazione di sessioni VR/AR direttamente all'interno della scena React Three Fiber.
4.  **Gestione Stato**: **Zustand** o Context API
    *   *Perché*: Zustand è leggerissimo e perfetto per condividere lo stato della simulazione (tempo corrente, pianeta selezionato, velocità di riproduzione) tra l'interfaccia 2D e il motore 3D.
5.  **Styling**: **Vanilla CSS / CSS Modules** (per controllo totale e performance senza overhead di build complessi).
6.  **Deploy**: **GitHub Actions** per la compilazione automatica e la pubblicazione su GitHub Pages ad ogni push.

---

## 4. Struttura del Progetto (Proposta)

Per garantire un codice pulito, organizzato e conforme al principio DRY:

```text
nasaplanetary/
│
├── .github/workflows/          # Automazione per GitHub Pages deploy
│   └── deploy.yml
│
├── public/                     # Asset statici (modelli 3D, immagini, icone)
│   └── models/                 # Modelli .gltf/.glb di rover, pianeti e sonde
│
├── src/
│   ├── assets/                 # Texture e stili globali
│   │   └── index.css
│   │
│   ├── components/             # Componenti UI generici e riutilizzabili
│   │   ├── Button/
│   │   ├── Card/
│   │   └── Modal/
│   │
│   ├── features/               # Funzionalità principali ben isolate
│   │   ├── solar-system/       # La scena 3D del sistema solare
│   │   │   ├── SolarSystemScene.jsx
│   │   │   ├── Planet.jsx
│   │   │   ├── OrbitLine.jsx
│   │   │   └── AsteroidBelt.jsx
│   │   │
│   │   ├── mission-tracker/    # La visualizzazione delle missioni
│   │   │   ├── MissionTimeline.jsx
│   │   │   └── SpacecraftModel.jsx
│   │   │
│   │   └── rover-explorer/     # L'esploratore di foto di Marte
│   │       ├── PhotoGallery.jsx
│   │       └── RoverStats.jsx
│   │
│   ├── hooks/                  # Custom Hook per logica condivisa (DRY)
│   │   ├── useNasaApi.js       # Fetching generico con gestione cache/chiavi
│   │   └── useSpaceCoordinates.js # Calcolo orbite da coordinate Horizons
│   │
│   ├── services/               # Chiamate API dirette alla NASA
│   │   ├── nasaClient.js       # Client HTTP configurato
│   │   ├── horizonsService.js
│   │   └── neowsService.js
│   │
│   ├── store/                  # Stato globale (Zustand)
│   │   └── useSpaceStore.js    # Selezione pianeta, velocità simulazione, data corrente
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── api_tests/                  # Script di test per verificare i dati (Python/UV)
│
├── .env                        # Variabili d'ambiente locali (incluso in .gitignore)
├── .env.template               # Template per altri sviluppatori
└── package.json
```

---

## Prossimi Passi

1.  **Analizzare i risultati** dei test eseguiti con `uv run` sulle API NASA per confermare i formati dati.
2.  **Scegliere la prima feature** da implementare (es. la scena 3D di base con le orbite planetarie reali da Horizons).
3.  **Inizializzare il progetto React + Vite** e configurare l'ambiente di sviluppo.
