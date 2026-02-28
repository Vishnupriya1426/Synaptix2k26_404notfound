// js/app.js

// Shared Utility Functions
window.showToast = function (message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.getElementById('toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'toast';

    // Styling based on type
    const bgColors = {
        'success': 'bg-green-600',
        'error': 'bg-red-600',
        'info': 'bg-blue-600'
    };

    toast.className = `fixed bottom-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-y-10 opacity-0 ${bgColors[type]}`;
    toast.innerText = message;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    }, 10);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

window.showLoader = function (buttonElement) {
    const originalText = buttonElement.innerHTML;
    buttonElement.setAttribute('data-original-text', originalText);
    buttonElement.disabled = true;
    buttonElement.innerHTML = `<div class="loader mx-auto h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>`;
};

window.hideLoader = function (buttonElement) {
    const originalText = buttonElement.getAttribute('data-original-text');
    if (originalText) {
        buttonElement.innerHTML = originalText;
    }
    buttonElement.disabled = false;
};

// Check auth state to show/hide navbar links
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                window.location.href = 'index.html';
            } catch (error) {
                console.error("Logout error: ", error);
            }
        });
    }

    onAuthStateChanged(auth, async (user) => {
        const guestLinks = document.querySelectorAll('.guest-link');
        const authLinks = document.querySelectorAll('.auth-link');
        const userGreeting = document.getElementById('user-greeting');
        const dashboardLink = document.getElementById('dashboard-link');

        if (user) {
            guestLinks.forEach(el => el.classList.add('hidden'));
            authLinks.forEach(el => el.classList.remove('hidden'));

            // Get user role for dashboard routing
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (userGreeting) userGreeting.innerText = `Hi, ${userData.name}`;
                    if (dashboardLink) {
                        dashboardLink.href = userData.role === 'landlord'
                            ? 'dashboard-landlord.html'
                            : 'dashboard-tenant.html';
                    }
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            guestLinks.forEach(el => el.classList.remove('hidden'));
            authLinks.forEach(el => el.classList.add('hidden'));
        }
    });

    // --- Universal Google Translate Injection ---
    // This ensures language selections persist and apply across the entire application domain
    const translateElementId = 'google_translate_element';

    // Inject the Google Translate JS
    if (!window.google || !window.google.translate) {
        window.googleTranslateElementInit = function () {
            new google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'en,hi,te,ta,kn',
                autoDisplay: false,
            }, translateElementId);

            // Cleanup the default 'Select Language' text of google translate to make it cleaner
            setTimeout(() => {
                const selectEl = document.querySelector('select.goog-te-combo');
                if (selectEl && selectEl.options.length > 0 && selectEl.options[0].text.includes('Language')) {
                    selectEl.options[0].text = '🌐 Language';
                }
            }, 1000);
        };

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.body.appendChild(script);
    }

    // Inject the actual frontend element into the top right navbar seamlessly
    if (!document.getElementById(translateElementId)) {
        const translateDiv = document.createElement('div');
        translateDiv.id = translateElementId;
        translateDiv.className = 'mr-4';

        // Try to find the top right nav container commonly used in dashboards and index
        let navRightContainer = document.querySelector('nav .flex.items-center.space-x-4') ||
            document.querySelector('nav .flex.space-x-4');

        if (navRightContainer) {
            navRightContainer.prepend(translateDiv);
        } else {
            // Fallback for login/signup pages or other pages without explicit right nav containers
            const nav = document.querySelector('nav > div');
            if (nav) {
                nav.style.justifyContent = 'space-between';
                nav.appendChild(translateDiv);
            } else {
                // Absolute fallback top right corner
                translateDiv.className = "fixed top-4 right-4 z-[9999] bg-white p-1 rounded-lg shadow-sm border";
                document.body.appendChild(translateDiv);
            }
        }
    }

    // Always inject the universal CSS for the widget
    if (!document.getElementById('google-translate-style')) {
        const style = document.createElement('style');
        style.id = 'google-translate-style';
        style.innerHTML = `
            /* Fix default google translate styling */
            body { top: 0px !important; position: static !important; }
            .goog-te-banner-frame, iframe.skiptranslate, iframe.VIpgJd-ZVi9od-ORHb-OEVmcd { display: none !important; }
            #goog-gt-tt { display: none !important; visibility: hidden !important; }
            
            /* Hide "Powered by Google" text and logo */
            .goog-te-gadget { font-size: 0px !important; color: transparent !important; }
            .goog-te-gadget span, .goog-te-gadget a { display: none !important; }
            
            .goog-te-combo {
                appearance: none;
                -webkit-appearance: none;
                -moz-appearance: none;
                padding: 0.5rem 2rem 0.5rem 1rem;
                border-radius: 0.375rem;
                background-color: #f3f4f6; /* Tailwind bg-gray-100 */
                border: 1px solid #d1d5db; /* Tailwind border-gray-300 */
                font-family: 'Inter', sans-serif;
                font-size: 0.875rem;
                font-weight: 500;
                color: #16a34a; /* Tailwind text-green-600 */
                cursor: pointer;
                outline: none;
                transition: all 0.2s;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2316a34a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 0.75rem center;
                background-size: 1rem 1rem;
            }
            .goog-te-combo:hover {
                background-color: #e5e7eb; /* Tailwind bg-gray-200 */
                border-color: #16a34a; /* Match green */
            }
            .goog-te-combo:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2); }
            
            .goog-tooltip, .goog-tooltip:hover { display: none !important; }
            .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; cursor: inherit !important; }
        `;
        document.head.appendChild(style);
    }
    // Auto-translation persistence handler
    // Local HTML files sometimes struggle with cross-page google cookies, this forces it.
    function preserveLanguage() {
        const langCookie = document.cookie.split('; ').find(row => row.startsWith('googtrans='));

        if (langCookie) {
            const lang = langCookie.split('=')[1];
            // Ensure cookie sits on the base domain path
            document.cookie = `googtrans=${lang}; path=/;`;
            if (window.location.hostname) {
                document.cookie = `googtrans=${lang}; domain=${window.location.hostname}; path=/;`;
            }

            // Force the select dropdown to match the cookie if it hasn't automatically updated
            const selectEl = document.querySelector('select.goog-te-combo');
            const targetLanguageCode = lang.split('/')[2]; // extracts 'te' from '/en/te'

            if (selectEl && targetLanguageCode && selectEl.value !== targetLanguageCode) {
                selectEl.value = targetLanguageCode;
                selectEl.dispatchEvent(new Event('change'));
            }
        }
    }

    // Check periodically if user changed language and save the cookie path
    setInterval(preserveLanguage, 500);

});
