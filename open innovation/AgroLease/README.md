# AgroLease

A trusted digital platform connecting agricultural landowners with lease holders.

## Setup and Deployment Instructions

This project is built using HTML, CSS (Tailwind via CDN), JavaScript (Vanilla ES Modules), and Firebase.

### 1. Firebase Configuration Setup
To make this application work, you must connect it to your own Firebase project.

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project named "AgroLease".
2. Add a **Web App** to your project.
3. In the Firebase console, go to **Build > Authentication** and enable **Email/Password** sign-in method.
4. Go to **Build > Firestore Database** and create a database (start in Test Mode during development).
5. Go to **Build > Storage** and initialize it (start in Test Mode during development).
6. Copy your web app's Firebase configuration object values.
7. Open `js/firebase-config.js` in this folder and replace the placeholder values with your actual Firebase config keys:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### 2. Running Locally for MVP Demonstration
Since this uses ES Modules for Firebase logic, you should run it through a local web server (opening the file directly via `file://` will cause CORS/module import errors).

**Easiest way:**
- If using VS Code, install the **Live Server** extension. Right-click `index.html` and select "Open with Live Server".
- Or using Node.js: `npx serve .` in this folder.
- Or using Python: `python -m http.server 8000` in this folder and open `http://localhost:8000` in your browser.

### 3. Usage Flow
- **Landowner**: Sign up as a Landowner, add a piece of land from your dashboard, and view incoming requests.
- **Tenant**: Sign up as a Tenant, browse available lands, filter by location or price, and click "Request Lease" to notify the landowner.

## Deployment
For a hackathon MVP, the simplest way to deploy is using **Firebase Hosting**:
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize hosting: `firebase init hosting` (Choose your project, select `public` as the directory if you moved these files there, or just the root `.` folder).
4. Deploy: `firebase deploy --only hosting`
