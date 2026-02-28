import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const errorMsg = document.getElementById('error-message');

function showError(msg) {
    if (errorMsg) {
        errorMsg.innerText = msg;
        errorMsg.classList.remove('hidden');
    }
    window.showToast(msg, 'error');
}

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submit-btn');
        window.showLoader(btn);

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.querySelector('input[name="role"]:checked').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store extra user metadata in Firestore
            const userData = {
                uid: user.uid,
                name: name,
                email: email,
                role: role,
                createdAt: serverTimestamp()
            };

            // Only add experience for tenants
            if (role === 'tenant') {
                const expVal = document.getElementById('experience').value;
                userData.experience = expVal ? `${expVal} years` : "< 1 year";
                userData.rating = "New"; // Default rating for new users
            }

            await setDoc(doc(db, "users", user.uid), userData);

            window.showToast("Account created successfully!");

            // Redirect based on role
            setTimeout(() => {
                window.location.href = role === 'landlord' ? 'dashboard-landlord.html' : 'dashboard-tenant.html';
            }, 1000);

        } catch (error) {
            window.hideLoader(btn);
            showError("Error: " + error.message);
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submit-btn');
        window.showLoader(btn);

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Get user role for redirection
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                window.showToast("Logged in successfully!");
                setTimeout(() => {
                    window.location.href = userData.role === 'landlord' ? 'dashboard-landlord.html' : 'dashboard-tenant.html';
                }, 1000);
            } else {
                throw new Error("User data not found.");
            }
        } catch (error) {
            window.hideLoader(btn);
            showError("Invalid email or password.");
        }
    });
}
