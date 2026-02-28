import { auth, db, storage } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const addLandForm = document.getElementById('add-land-form');

// Auth Guard for Landlord Pages
let currentUser = null;
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        // Check if on dashboard to load initially
        if (window.location.pathname.includes('dashboard-landlord')) {
            loadMyLands();
            loadRequests();
            loadRecommendations();
        }
    } else {
        // Redirect to login if not authenticated
        if (window.location.pathname.includes('dashboard-landlord') || window.location.pathname.includes('add-land')) {
            window.location.href = 'login.html';
        }
    }
});

// Add Land Logic
if (addLandForm) {
    addLandForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            window.showToast("Registration required", 'error');
            return;
        }

        const btn = document.getElementById('submit-btn');
        window.showLoader(btn);

        const title = document.getElementById('title').value;
        const locationStr = document.getElementById('location').value;
        const size = parseFloat(document.getElementById('size').value);
        const price = parseFloat(document.getElementById('price').value);
        const description = document.getElementById('description').value;
        const soilType = document.getElementById('soil-type').value;
        const profitShare = document.getElementById('profit-share').checked;
        const imageFile = document.getElementById('image').files[0];

        try {
            let imageUrl = null;
            if (imageFile) {
                const imageRef = ref(storage, `lands/${Date.now()}_${imageFile.name}`);
                const snapshot = await uploadBytes(imageRef, imageFile);
                imageUrl = await getDownloadURL(snapshot.ref);
            } else {
                // Default placeholder image
                imageUrl = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
            }

            const docRef = await addDoc(collection(db, "lands"), {
                ownerId: currentUser.uid,
                title: title,
                location: locationStr,
                size: size,
                price: price,
                soilType: soilType,
                profitShare: profitShare,
                description: description,
                imageUrl: imageUrl,
                createdAt: serverTimestamp()
            });

            window.hideLoader(btn);

            // Pop the AI Success Modal instead of immediate redirect
            const modal = document.getElementById('ai-matches-modal');
            const content = document.getElementById('ai-matches-content');
            const tenantList = document.getElementById('dynamic-ai-tenants');

            if (modal && tenantList) {
                // Generate dynamic realistic matches based on their input
                const requiredSize = size;
                let t1Size = Math.max(1, requiredSize - (Math.floor(Math.random() * 2)));
                let t2Size = requiredSize + (Math.floor(Math.random() * 3) + 1);

                tenantList.innerHTML = `
                    <div class="flex items-center bg-green-50/50 border border-green-100 p-3 rounded-xl transition hover:shadow-md cursor-pointer hover:border-green-300">
                        <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mr-3 shadow-sm border border-blue-200">KT</div>
                        <div class="flex-1">
                            <div class="flex justify-between items-center">
                                <p class="text-sm font-bold text-gray-800">Kiran Teja</p>
                                <span class="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">98% Match</span>
                            </div>
                            <p class="text-[11px] text-gray-500 mt-1">Looking for ${t1Size}-${requiredSize + 1} Acres • Highly Rated Member</p>
                            <p class="text-[10px] text-gray-400 mt-0.5">⭐ 4.9 (12 Previous Leases) • Specializes in ${soilType} soil.</p>
                        </div>
                    </div>
                    <div class="flex items-center bg-gray-50 border border-gray-100 p-3 rounded-xl transition hover:shadow-md cursor-pointer hover:border-green-300">
                        <div class="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm mr-3 shadow-sm border border-green-200">RD</div>
                        <div class="flex-1">
                            <div class="flex justify-between items-center">
                                <p class="text-sm font-bold text-gray-800">Ravi Desai</p>
                                <span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">85% Match</span>
                            </div>
                            <p class="text-[11px] text-gray-500 mt-1">Looking for ${requiredSize}-${t2Size} Acres • Experienced</p>
                            <p class="text-[10px] text-gray-400 mt-0.5">⭐ 4.6 (4 Previous Leases) • Near ${locationStr}.</p>
                        </div>
                    </div>
                `;

                modal.classList.remove('hidden');
                setTimeout(() => {
                    modal.classList.remove('opacity-0');
                    content.classList.remove('scale-95');
                }, 10);
            } else {
                window.showToast("Land added successfully!");
                setTimeout(() => {
                    window.location.href = 'dashboard-landlord.html';
                }, 1000);
            }

        } catch (error) {
            window.hideLoader(btn);
            window.showToast("Error adding land: " + error.message, 'error');
        }
    });
}

// Load My Lands
async function loadMyLands() {
    const container = document.getElementById('lands-container');
    const emptyUI = document.getElementById('lands-empty');
    if (!container) return;

    document.getElementById('lands-loading').classList.remove('hidden');
    container.innerHTML = '';

    try {
        const q = query(collection(db, "lands"), where("ownerId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);

        document.getElementById('lands-loading').classList.add('hidden');

        if (querySnapshot.empty) {
            emptyUI.classList.remove('hidden');
        } else {
            emptyUI.classList.add('hidden');
            querySnapshot.forEach((docSnap) => {
                const land = docSnap.data();
                const card = document.createElement('div');
                card.className = "bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition";
                card.innerHTML = `
                    <div class="h-48 w-full bg-gray-200">
                        <img src="${land.imageUrl}" alt="${land.title}" class="w-full h-full object-cover">
                    </div>
                    <div class="p-5">
                        <div class="flex justify-between items-start">
                            <h3 class="font-bold text-lg text-gray-900 truncate pr-2">${land.title}</h3>
                            <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">Active</span>
                        </div>
                        <p class="text-gray-500 text-sm mt-1 flex items-center">
                            <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            ${land.location}
                        </p>
                        <div class="mt-4 pt-4 border-t flex justify-between items-center">
                            <div>
                                <p class="text-gray-500 text-xs">Size & Price</p>
                                <p class="font-bold text-gray-900">${land.size} Acres <span class="text-green-600 mx-1">•</span> ₹${land.price}/yr</p>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        document.getElementById('lands-loading').classList.add('hidden');
        console.error("Error loading lands:", error);
    }
}

// Load Requests
async function loadRequests() {
    const container = document.getElementById('requests-container');
    const emptyUI = document.getElementById('requests-empty');
    if (!container) return;

    document.getElementById('requests-loading').classList.remove('hidden');
    container.innerHTML = '';

    try {
        const q = query(collection(db, "requests"), where("landlordId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);

        document.getElementById('requests-loading').classList.add('hidden');

        if (querySnapshot.empty) {
            emptyUI.classList.remove('hidden');
        } else {
            emptyUI.classList.add('hidden');
            querySnapshot.forEach((docSnap) => {
                const req = docSnap.data();
                const reqId = docSnap.id;

                const card = document.createElement('div');
                card.className = "bg-white border rounded-xl p-5 shadow-sm";

                let statusBadge = '';
                let actionButtons = '';

                if (req.status === 'pending') {
                    statusBadge = `<span class="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 rounded-full font-medium border border-yellow-200">Pending</span>`;
                    actionButtons = `
                        <div class="mt-4 flex space-x-3">
                            <button onclick="updateRequestStatus('${reqId}', 'accepted')" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm text-center">Accept Request</button>
                            <button onclick="updateRequestStatus('${reqId}', 'rejected')" class="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-medium py-2 px-4 rounded-lg transition text-sm text-center">Decline</button>
                        </div>
                    `;
                } else if (req.status === 'accepted') {
                    statusBadge = `<span class="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium border border-green-200">Accepted</span>`;
                    actionButtons = `
                        <div class="mt-4 flex flex-col space-y-2">
                            <p class="text-sm text-green-700 font-medium bg-green-50 p-2 rounded text-center">You accepted this request. Please contact the farmer.</p>
                            <button onclick="window.showToast('Generating official lease agreement... PDF will download shortly', 'success')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm text-center flex items-center justify-center">
                                <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                Generate Digital Agreement
                            </button>
                        </div>
                    `;
                } else {
                    statusBadge = `<span class="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-medium border border-red-200">Declined</span>`;
                }

                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-bold text-gray-900">Request for: <span class="text-green-700">${req.landTitle}</span></h3>
                            <p class="text-sm text-gray-500 mt-1">From: <strong class="text-gray-700">${req.tenantName}</strong> (${req.tenantEmail})</p>
                            ${req.tenantRating ? `<div class="mt-2 flex items-center bg-gray-50 border border-gray-100 w-max px-2.5 py-1 rounded-md text-xs text-gray-600"><span class="text-yellow-500 flex items-center font-bold mr-1.5"><svg class="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>${req.tenantRating}</span> <span class="text-gray-300 mx-1">|</span> <span class="font-medium ml-1">${req.tenantExperience} Experience</span></div>` : ''}
                        </div>
                        ${statusBadge}
                    </div>
                    ${actionButtons}
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        document.getElementById('requests-loading').classList.add('hidden');
        console.error("Error loading requests:", error);
    }
}

// Global function to update status
window.updateRequestStatus = async function (reqId, newStatus) {
    if (!confirm(`Are you sure you want to ${newStatus} this request?`)) return;

    try {
        const reqRef = doc(db, "requests", reqId);
        await updateDoc(reqRef, {
            status: newStatus
        });
        window.showToast(`Request ${newStatus} successfully!`);
        loadRequests(); // Reload list
    } catch (error) {
        window.showToast("Error updating request", 'error');
        console.error(error);
    }
}

// Add invite global function
window.sendInvitation = async function (tenantId, tenantName) {
    if (!confirm(`Send invitation to ${tenantName}?`)) return;

    try {
        await addDoc(collection(db, "invitations"), {
            landlordId: currentUser.uid,
            landlordName: currentUser.displayName || currentUser.email || 'Landowner', // mock later
            tenantId: tenantId,
            tenantName: tenantName,
            status: 'pending',
            createdAt: serverTimestamp()
        });
        window.showToast(`Invitation sent to ${tenantName}!`, 'success');
    } catch (e) {
        window.showToast("Error sending invitation", 'error');
        console.error(e);
    }
}

// Load AI Recommendations (Mock Logic based on location/ soil)
async function loadRecommendations() {
    const container = document.getElementById('recommendations-container');
    if (!container) return;

    try {
        // Mock Dummy Profiles for a great demo experience
        const dummyTenants = [
            { id: "dummy1", name: "Venkat Rao", rating: "4.9", experience: "15 Years", match: "98%", reason: "Excellent match based on high trust rating and extensive 15-year background in cotton farming.", initials: "VR" },
            { id: "dummy2", name: "Srinivas Reddy", rating: "4.8", experience: "8 Years", match: "94%", reason: "Strong fit. Specializes in soil types currently found on your listed properties.", initials: "SR" },
            { id: "dummy3", name: "Ravi Desai", rating: "4.6", experience: "12 Years", match: "89%", reason: "Solid local farmer looking for properties exactly within your typical acreage range.", initials: "RD" },
            { id: "dummy4", name: "Kiran Teja", rating: "4.9", experience: "5 Years", match: "85%", reason: "Highly rated newer farmer implementing modern irrigation techniques suitable for your land.", initials: "KT" }
        ];

        // Let spinner show for a second for "AI effect"
        setTimeout(() => {
            container.innerHTML = ''; // clear spinner

            dummyTenants.forEach((tenant) => {
                const card = document.createElement('div');
                card.className = "bg-white border rounded-xl p-5 shadow-sm transform hover:-translate-y-1 transition duration-200 border-amber-100";

                card.innerHTML = `
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center space-x-4">
                            <div class="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                                ${tenant.initials}
                            </div>
                            <div>
                                <h3 class="font-bold text-gray-900">${tenant.name}</h3>
                                <div class="flex items-center text-xs mt-1">
                                    <span class="text-yellow-500 font-bold flex items-center mr-2">⭐ ${tenant.rating}</span>
                                    <span class="text-gray-500 bg-gray-100 px-2 py-0.5 rounded">${tenant.experience} Exp.</span>
                                </div>
                            </div>
                        </div>
                        <span class="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-200">${tenant.match} Match</span>
                    </div>
                    
                    <p class="text-xs text-gray-600 mb-4 bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-100/50 leading-relaxed relative">
                        <svg class="absolute top-2 left-2 h-3 w-3 text-amber-400 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M13 14.725c0-5.141 3.892-10.519 10-11.725l.984 2.126c-2.215.835-4.163 3.742-4.38 5.746 2.491.392 4.396 2.547 4.396 5.149 0 3.182-2.584 4.979-5.199 4.979-3.015 0-5.801-2.305-5.801-6.275zm-13 0c0-5.141 3.892-10.519 10-11.725l.984 2.126c-2.215.835-4.163 3.742-4.38 5.746 2.491.392 4.396 2.547 4.396 5.149 0 3.182-2.584 4.979-5.199 4.979-3.015 0-5.801-2.305-5.801-6.275z"/></svg>
                        <span class="ml-4 block text-gray-700"><strong>AI Insight:</strong> ${tenant.reason}</span>
                    </p>
                    <button onclick="window.sendInvitation('${tenant.id}', '${tenant.name}')" class="w-full bg-white border-2 border-green-600 text-green-700 font-bold py-2 rounded-lg hover:bg-green-50 transition transform active:scale-95">
                        Invite to Lease Land
                    </button>
                `;
                container.appendChild(card);
            });
        }, 1500); // 1.5 second delay for the "scanning effect"

    } catch (e) {
        console.error("Error loading recommendations:", e);
    }
}
