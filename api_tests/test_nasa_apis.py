import os
import json
import urllib.request
import urllib.parse
import ssl
from datetime import datetime, timedelta

def load_env():
    env_vars = {}
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    return env_vars

def fetch_json(url, params=None):
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    print(f"Fetching: {url}")
    try:
        # Ignore SSL verification errors (common on macOS local Python installations)
        context = ssl._create_unverified_context()
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, context=context) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return {"error": str(e)}

def save_json(data, filename):
    out_dir = os.path.join(os.path.dirname(__file__), 'responses')
    os.makedirs(out_dir, exist_ok=True)
    filepath = os.path.join(out_dir, filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Saved: {filepath}")

def main():
    env = load_env()
    api_key = env.get('NASA_API_KEY', 'DEMO_KEY')
    print(f"Using NASA API Key: {api_key[:4]}...{api_key[-4:] if len(api_key) > 8 else ''}")

    # 1. Test Astronomy Picture of the Day (APOD)
    print("\n--- Testing APOD ---")
    apod_url = "https://api.nasa.gov/planetary/apod"
    apod_data = fetch_json(apod_url, {"api_key": api_key})
    save_json(apod_data, "apod.json")
    if "title" in apod_data:
        print(f"APOD Title: {apod_data.get('title')}")
        print(f"APOD Media Type: {apod_data.get('media_type')}")
        print(f"APOD URL: {apod_data.get('url')}")

    # 2. Test Near Earth Objects (NeoWs)
    print("\n--- Testing NeoWs (Asteroids) ---")
    neows_url = "https://api.nasa.gov/neo/rest/v1/feed"
    today_str = datetime.now().strftime("%Y-%m-%d")
    yesterday_str = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    neows_data = fetch_json(neows_url, {
        "start_date": yesterday_str,
        "end_date": today_str,
        "api_key": api_key
    })
    save_json(neows_data, "neows.json")
    element_count = neows_data.get("element_count", 0)
    print(f"NeoWs element count: {element_count} asteroids found near Earth.")

    # 3. Test Mars Rover Photos (Curiosity / Perseverance - latest_photos)
    print("\n--- Testing Mars Rover Photos (Perseverance Latest) ---")
    # Trying latest_photos for perseverance since the curiosity photos search is throwing 404s
    rover_url = "https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/latest_photos"
    rover_data = fetch_json(rover_url, {
        "api_key": api_key
    })
    save_json(rover_data, "mars_photos.json")
    photos = rover_data.get("latest_photos", [])
    print(f"Mars Rover Photos found: {len(photos)}")
    if photos:
        print(f"First Photo URL: {photos[0].get('img_src')}")
        print(f"Rover Name: {photos[0].get('rover', {}).get('name')}")
        print(f"Earth Date: {photos[0].get('earth_date')}")

    # 4. Test EPIC (Earth Polychromatic Imaging Camera)
    print("\n--- Testing EPIC ---")
    epic_url = "https://api.nasa.gov/EPIC/api/natural"
    epic_data = fetch_json(epic_url, {"api_key": api_key})
    save_json(epic_data, "epic.json")
    print(f"EPIC images count: {len(epic_data) if isinstance(epic_data, list) else 0}")
    if isinstance(epic_data, list) and len(epic_data) > 0:
        print(f"First EPIC Image Identifier: {epic_data[0].get('image')}")
        print(f"Date: {epic_data[0].get('date')}")

    # 5. Test JPL Horizons API (Corrected Endpoint: https://ssd.jpl.nasa.gov/api/horizons.api)
    print("\n--- Testing JPL SSD Horizons API (Orbits) ---")
    horizons_url = "https://ssd.jpl.nasa.gov/api/horizons.api"
    # Format dates for Horizons
    start_date_hz = (datetime.now() - timedelta(days=2)).strftime("'%Y-%m-%d'")
    stop_date_hz = datetime.now().strftime("'%Y-%m-%d'")
    horizons_params = {
        "format": "json",
        "COMMAND": "'499'",          # Mars target
        "CENTER": "'500@0'",         # Solar system barycenter origin
        "MAKE_EPHEM": "'YES'",
        "EPHEM_TYPE": "'VECTORS'",   # Return X, Y, Z Cartesian position/velocity
        "START_TIME": start_date_hz,
        "STOP_TIME": stop_date_hz,
        "STEP_SIZE": "'1d'"
    }
    horizons_data = fetch_json(horizons_url, horizons_params)
    save_json(horizons_data, "horizons_mars.json")
    if "result" in horizons_data:
        result_lines = horizons_data["result"].split('\n')
        print(f"Horizons result lines returned: {len(result_lines)}")
        print("Data Snippet (First 15 lines of results):")
        found_data = False
        count = 0
        for line in result_lines:
            if "$$SOE" in line:  # Start of Ephemeris
                found_data = True
                print("  $$SOE (Start of Ephemeris Data)")
                continue
            if "$$EOE" in line:  # End of Ephemeris
                print("  $$EOE (End of Ephemeris Data)")
                break
            if found_data and count < 10:
                print(f"  {line.strip()}")
                count += 1

if __name__ == "__main__":
    main()
