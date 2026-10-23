# AgriSoko Pocket G12

Group 12 work.

AgriSoko Pocket is a five-screen Expo/React Native app for asking which G12 team member is relevant to a question, browsing the member directory, and viewing profiles. Its FastAPI backend uses a scikit-learn TF-IDF model with cosine similarity and a 0.45 match threshold. The six-member directory falls back to bundled local data if the API is unavailable.

## Team

The member records are Hamody, Alexander Dyujay Kpande, Christine NDATIMANA, Alain Sauverain ISHEMA, Solomon Kamara, and Haroundeiy. `ai-api/data/members.json` contains their supplied registration numbers, usernames, roles, skills, contributions, introductions, feedback, and evidence references. Haroundeiy's registration number is intentionally blank as requested. Confirm the supplied evidence references and reported outcome metrics before submission; they have not all been independently verified by this build.

## Run the API

```powershell
cd ai-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python build_index.py
python -m pytest tests -v
uvicorn main:app --reload
```

API base URL: `http://127.0.0.1:8000`. For a phone or emulator, set `EXPO_PUBLIC_API_URL` to an address reachable from that device (for example your computer's LAN IP); localhost on a phone refers to the phone itself.

## Run the mobile app

```powershell
cd mobile
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` before starting Expo to connect to a deployed/reachable API. Without it, the app uses the development URL `http://127.0.0.1:8000`; the directory uses its bundled fallback when requests fail.

## EAS builds

`mobile/eas.json` provides development, preview, and production profiles. Install/configure EAS CLI and associate the Expo project before running `eas build`.

## Git

GitHub repository: [mawatason3-hash/Group12Ai](https://github.com/mawatason3-hash/Group12Ai). Initial implementation commit: `0d2a3cf2c8569c89a9989ce4e93693370a265f3e`. The final history tip is printed by `git rev-parse HEAD`. Branches are starting points; add each member's work on their branch before opening a PR. Do not force-push over the existing repository history.

## Limitations

- No supplied HTML prototype was available in the workspace, so exact visual parity cannot be verified.
- Supplied metrics, feedback, issue/PR references, and commit references are carried over from the assignment prompt and should be verified against actual evidence.
- AI matching is keyword/statistical similarity, not a generative model; very short or unsupported questions may not match.
- The default CORS policy is permissive and should be restricted for a production deployment.
- Device tests and hosted API deployment are not performed by this scaffold. Expo EAS cloud builds also require project association and valid credentials.

See `evidence/` for AI-use, device-test, and contribution templates.
