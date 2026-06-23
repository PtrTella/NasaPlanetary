# NASA Solar System & Mission Explorer (AR/3D)

Questo è un progetto interattivo in 3D e realtà aumentata (AR) per esplorare i corpi celesti, le orbite del sistema solare e le traiettorie delle missioni spaziali utilizzando i dati reali provenienti dalle API della NASA e del JPL.

L'applicazione è progettata per essere sviluppata in **React** (con **Vite** e **React Three Fiber**) e pubblicata come sito web statico su **GitHub Pages**.

---

## Stato Iniziale e Test delle API

Abbiamo configurato ed eseguito con successo una suite di test in Python (gestita tramite `uv`) per verificare l'accesso e la struttura dei dati forniti dalle API della NASA.

### Risultati dei Test delle API

1.  **JPL SSD Horizons API (Orbite ed Ephemerides 3D)**:
    *   **Stato**: 🟢 **Funzionante** (senza chiave API).
    *   **Dati**: Coordinate cartesiane 3D (\(X, Y, Z\) in km) e vettori di velocità (\(V_x, V_y, V_z\) in km/s) per pianeti e sonde spaziali.
    *   *Esempio per Marte (23 Giugno 2026)*: `X = 1.834904028E+08 km, Y = 1.096518480E+08 km, Z = -2.175346479E+06 km` rispetto al Baricentro del Sistema Solare (Sole).

2.  **Near Earth Object Web Service (NeoWs - Asteroidi)**:
    *   **Stato**: 🟢 **Funzionante** (richiede `NASA_API_KEY`).
    *   **Dati**: Asteroidi vicini alla Terra con diametro stimato, velocità relativa, distanza di passaggio in km e se sono potenzialmente pericolosi.

3.  **EPIC (Earth Polychromatic Imaging Camera)**:
    *   **Stato**: 🟢 **Funzionante** (richiede `NASA_API_KEY`).
    *   **Dati**: Immagini giornaliere a colori reali della Terra scattate dal satellite DSCOVR. Oltre alle immagini, fornisce la posizione 3D tridimensionale di DSCOVR, della Luna e del Sole rispetto alla Terra ad ogni scatto.

4.  **APOD (Astronomy Picture of the Day)**:
    *   **Stato**: 🟢 **Funzionante** (richiede `NASA_API_KEY`).
    *   **Dati**: Foto astronomica giornaliera con metadati, titolo, descrizione e link multimediali (es. video MP4 della sonda Voyager 2 su Tritone).

5.  **Mars Rover Photos API**:
    *   **Stato**: ⚠️ **Servizio non disponibile / Deprecato** (restituisce 404). NASA ha parzialmente archiviato questo servizio ed è attualmente instabile o non raggiungibile da alcune regioni. Utilizzeremo API alternative o cache locali per la galleria fotografica dei rover.

---

## Struttura del Workspace Attuale

La cartella è organizzata come segue:
*   [README.md](file:///Users/tella/Workspace/NasaPlanetary/README.md) - Questa panoramica del progetto.
*   [docs/PROJECT_BRAINSTORM.md](file:///Users/tella/Workspace/NasaPlanetary/docs/PROJECT_BRAINSTORM.md) - Documento dettagliato con le idee di progetto, architettura consigliata e struttura delle cartelle.
*   [api_tests/test_nasa_apis.py](file:///Users/tella/Workspace/NasaPlanetary/api_tests/test_nasa_apis.py) - Script Python per testare le API.
*   [api_tests/responses/](file:///Users/tella/Workspace/NasaPlanetary/api_tests/responses/) - Cartella contenente le risposte JSON reali restituite dalle API per l'ispezione della struttura dati.
*   [.env](file:///Users/tella/Workspace/NasaPlanetary/.env) - File di configurazione locale per inserire la chiave API.

---

## Come Eseguire i Test Localmente

Per rieseguire lo script di test e aggiornare i dati:
```bash
uv run api_tests/test_nasa_apis.py
```
*(Assicurati di aver configurato la tua chiave API nel file `.env`)*.
