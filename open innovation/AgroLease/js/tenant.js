import { auth, db } from "./firebase-config.js";
import { collection, addDoc, getDocs, getDoc, query, where, orderBy, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Global cache for tenant data
let currentUser = null;
let currentTenantData = null;

// Auth Guard for Tenant Pages
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                currentTenantData = userDoc.data();
            }
        } catch (e) {
            console.error(e);
        }

        if (window.location.pathname.includes('dashboard-tenant')) {
            loadMyRequests();
            loadInvitations();
        } else if (window.location.pathname.includes('browse-lands')) {
            loadBrowseLands();
        } else if (window.location.pathname.includes('land-details')) {
            loadLandDetails();
        }
    } else {
        // Redirect to login if not authenticated
        if (window.location.pathname.includes('dashboard-tenant') ||
            window.location.pathname.includes('land-details')) {
            window.location.href = 'login.html';
        }
        // Browse lands could be public potentially, but let's enforce auth for MVP
        if (window.location.pathname.includes('browse-lands')) {
            window.location.href = 'login.html';
        }
    }
});

// Load Sent Requests
async function loadMyRequests() {
    const container = document.getElementById('requests-container');
    const emptyUI = document.getElementById('requests-empty');
    if (!container) return;

    document.getElementById('requests-loading').classList.remove('hidden');
    container.innerHTML = '';

    try {
        const q = query(collection(db, "requests"), where("tenantId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);

        document.getElementById('requests-loading').classList.add('hidden');

        if (querySnapshot.empty) {
            if (emptyUI) emptyUI.classList.remove('hidden');
        } else {
            if (emptyUI) emptyUI.classList.add('hidden');
            querySnapshot.forEach((docSnap) => {
                const req = docSnap.data();

                const card = document.createElement('div');
                card.className = "bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition";

                let statusBadge = '';
                if (req.status === 'pending') {
                    statusBadge = `<span class="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 rounded-full font-medium">Pending Review</span>`;
                } else if (req.status === 'accepted') {
                    statusBadge = `<span class="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">Accepted</span>`;
                } else {
                    statusBadge = `<span class="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-medium">Declined</span>`;
                }

                card.innerHTML = `
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="font-bold text-lg text-gray-900 truncate pr-2">${req.landTitle}</h3>
                        ${statusBadge}
                    </div>
                    <div class="text-sm text-gray-500 mt-2 space-y-1">
                        <p>Requested on: ${req.createdAt ? new Date(req.createdAt.toDate()).toLocaleDateString() : 'Just now'}</p>
                    </div>
                    <button onclick="window.location.href='land-details.html?id=${req.landId}'" class="mt-4 w-full text-green-700 bg-green-50 hover:bg-green-100 py-2 rounded-lg font-medium text-sm transition">
                        View Land Details
                    </button>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        document.getElementById('requests-loading').classList.add('hidden');
        console.error("Error loading requests:", error);
    }
}

// Load All Lands (Browse)
async function loadBrowseLands() {
    const container = document.getElementById('browse-container');
    const emptyUI = document.getElementById('browse-empty');
    if (!container) return;

    document.getElementById('browse-loading').classList.remove('hidden');
    container.innerHTML = '';

    // Simplistic search filter on client side for MVP
    const searchInput = document.getElementById('filter-location');
    let filterVal = '';
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterVal = e.target.value.toLowerCase();
            filterAndRenderLands(filterVal);
        });
    }

    let allLands = [];

    try {
        const q = query(collection(db, "lands"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        document.getElementById('browse-loading').classList.add('hidden');

        querySnapshot.forEach((docSnap) => {
            allLands.push({ id: docSnap.id, ...docSnap.data() });
        });

        filterAndRenderLands(''); // initial render

    } catch (error) {
        document.getElementById('browse-loading').classList.add('hidden');
        console.error("Error loading browse lands:", error);
    }

    function filterAndRenderLands(searchTerm) {
        container.innerHTML = '';
        const filteredList = allLands.filter(land =>
            land.location.toLowerCase().includes(searchTerm) ||
            land.title.toLowerCase().includes(searchTerm)
        );

        if (filteredList.length === 0) {
            emptyUI.classList.remove('hidden');
        } else {
            emptyUI.classList.add('hidden');
            filteredList.forEach((land) => {
                const card = document.createElement('div');
                card.className = "bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer transform hover:-translate-y-1";
                card.onclick = () => window.location.href = `land-details.html?id=${land.id}`;
                card.innerHTML = `
                    <div class="h-48 w-full bg-gray-200">
                        <img src="${land.imageUrl}" alt="${land.title}" class="w-full h-full object-cover">
                    </div>
                    <div class="p-5">
                        <h3 class="font-bold text-lg text-gray-900 truncate">${land.title}</h3>
                        <p class="text-gray-500 text-sm mt-1 flex items-center">
                            <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            ${land.location}
                        </p>
                        <div class="mt-4 pt-4 border-t flex justify-between items-center text-sm">
                            <div class="font-medium text-gray-700">${land.size} Acres</div>
                                <div class="font-bold text-green-700 text-lg">₹${land.price}<span class="text-xs text-gray-500 font-normal">/yr</span></div>
                            </div>
                            <div class="mt-3 flex flex-wrap gap-1">
                                ${land.soilType ? `<span class="bg-yellow-50 text-yellow-700 text-xs px-2 py-0.5 rounded border border-yellow-100">${land.soilType}</span>` : ''}
                                ${land.profitShare ? `<span class="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded border border-blue-100 font-medium">🤝 Profit Split</span>` : ''}
                            </div>
                        </div>
                    `;
                container.appendChild(card);
            });
        }
    }
}

// Load Land Details & Request Lease Logic
async function loadLandDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const landId = urlParams.get('id');

    if (!landId) {
        window.location.href = 'browse-lands.html';
        return;
    }

    try {
        const landDoc = await getDoc(doc(db, "lands", landId));

        document.getElementById('details-loading').classList.add('hidden');

        if (landDoc.exists()) {
            const land = landDoc.data();
            document.getElementById('details-container').classList.remove('hidden');

            document.getElementById('detail-image').src = land.imageUrl;
            document.getElementById('detail-price').innerText = land.price;
            document.getElementById('detail-title').innerText = land.title;
            document.getElementById('detail-location').innerText = land.location;
            document.getElementById('detail-size').innerText = land.size;
            document.getElementById('detail-description').innerText = land.description || 'No description provided.';

            if (land.soilType && land.soilType !== 'Other') {
                const soilBadge = document.getElementById('badge-soil');
                soilBadge.innerText = '🌱 ' + land.soilType;
                soilBadge.classList.remove('hidden');
            }
            if (land.profitShare === true) {
                document.getElementById('badge-profit').classList.remove('hidden');
            }

            // Get Owner Name
            const ownerDoc = await getDoc(doc(db, "users", land.ownerId));
            if (ownerDoc.exists()) {
                document.getElementById('owner-name').innerText = ownerDoc.data().name;
            }

            // Setup Request Button
            const reqBtn = document.getElementById('request-lease-btn');

            // Check if user is the owner
            if (land.ownerId === currentUser.uid) {
                reqBtn.innerText = "This is your land";
                reqBtn.disabled = true;
                reqBtn.classList.replace('bg-green-600', 'bg-gray-400');
                reqBtn.classList.replace('hover:bg-green-700', 'hover:bg-gray-400');
                return;
            }

            // Check if already requested
            const q = query(collection(db, "requests"),
                where("landId", "==", landId),
                where("tenantId", "==", currentUser.uid)
            );
            const existingReqs = await getDocs(q);

            if (!existingReqs.empty) {
                reqBtn.innerText = "Request Already Sent";
                reqBtn.disabled = true;
                reqBtn.classList.replace('bg-green-600', 'bg-gray-400');
                reqBtn.classList.replace('hover:bg-green-700', 'hover:bg-gray-400');
                return;
            }

            // Handle new request
            reqBtn.addEventListener('click', async () => {
                if (!currentTenantData) return;

                window.showLoader(reqBtn);
                try {
                    await addDoc(collection(db, "requests"), {
                        landId: landId,
                        landTitle: land.title,
                        landlordId: land.ownerId,
                        tenantId: currentUser.uid,
                        tenantName: currentTenantData.name || 'Tenant',
                        tenantEmail: currentTenantData.email || currentUser.email,
                        tenantRating: currentTenantData.rating || "New",
                        tenantExperience: currentTenantData.experience || "< 1 year",
                        status: 'pending',
                        createdAt: serverTimestamp()
                    });

                    window.hideLoader(reqBtn);
                    window.showToast("Lease request sent successfully!");

                    reqBtn.innerText = "Request Sent";
                    reqBtn.disabled = true;
                    reqBtn.classList.replace('bg-green-600', 'bg-gray-400');
                    reqBtn.classList.replace('hover:bg-green-700', 'hover:bg-gray-400');

                } catch (error) {
                    window.hideLoader(reqBtn);
                    window.showToast("Error sending request", "error");
                    console.error(error);
                }
            });

        } else {
            window.showToast("Land not found", "error");
            setTimeout(() => window.history.back(), 1500);
        }
    } catch (error) {
        console.error("Error loading land details:", error);
    }
}

// Load Invitations
async function loadInvitations() {
    const container = document.getElementById('invitations-container');
    const emptyUI = document.getElementById('invitations-empty');
    if (!container) return;

    document.getElementById('invitations-loading').classList.remove('hidden');
    container.innerHTML = '';

    try {
        const q = query(collection(db, "invitations"), where("tenantId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);

        document.getElementById('invitations-loading').classList.add('hidden');

        if (querySnapshot.empty) {
            if (emptyUI) emptyUI.classList.remove('hidden');
        } else {
            if (emptyUI) emptyUI.classList.add('hidden');
            querySnapshot.forEach((docSnap) => {
                const inv = docSnap.data();
                const invId = docSnap.id;

                const card = document.createElement('div');
                card.className = "bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition border-green-100";

                let statusBadge = '';
                let actionButtons = '';

                // Mock landlord rating for demo
                const landlordMockRating = "⭐ 4.9";
                const landlordMockExp = "Verified Landowner";

                if (inv.status === 'pending') {
                    statusBadge = `<span class="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 rounded-full font-medium">Pending Action</span>`;
                    actionButtons = `
                        <div class="mt-4 flex space-x-3">
                            <button onclick="updateInvitationStatus('${invId}', 'accepted')" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm text-center">Accept Invite</button>
                            <button onclick="updateInvitationStatus('${invId}', 'rejected')" class="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-medium py-2 px-4 rounded-lg transition text-sm text-center">Decline</button>
                        </div>
                    `;
                } else if (inv.status === 'accepted') {
                    statusBadge = `<span class="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">Accepted</span>`;
                    actionButtons = `<div class="mt-4 text-sm text-green-700 font-medium bg-green-50 p-2 rounded text-center">You accepted this invite. Please contact ${inv.landlordName}.</div>`;
                } else {
                    statusBadge = `<span class="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-medium">Declined</span>`;
                }

                card.innerHTML = `
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center space-x-3">
                           <div class="h-10 w-10 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold">
                               ${inv.landlordName.charAt(0)}
                           </div>
                           <div>
                               <h3 class="font-bold text-gray-900">${inv.landlordName}</h3>
                               <div class="flex items-center text-xs mt-0.5 text-gray-500">
                                   <span class="text-yellow-500 font-bold mr-1.5">${landlordMockRating}</span>
                                   <span>| ${landlordMockExp}</span>
                               </div>
                           </div>
                        </div>
                        ${statusBadge}
                    </div>
                    <div class="text-sm text-gray-500 mt-3 p-3 bg-gray-50 rounded border border-gray-100">
                        <strong>Message:</strong> "I have reviewed your farming profile and would love to lease you my land. Let's work together!"
                    </div>
                    ${actionButtons}
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        document.getElementById('invitations-loading').classList.add('hidden');
        console.error("Error loading invitations:", error);
    }
}

// Global function to update invitation status
window.updateInvitationStatus = async function (invId, newStatus) {
    if (!confirm(`Are you sure you want to ${newStatus === 'accepted' ? 'accept' : 'decline'} this invitation?`)) return;

    try {
        const invRef = doc(db, "invitations", invId);
        await updateDoc(invRef, {
            status: newStatus
        });
        window.showToast(`Invitation ${newStatus} successfully!`, 'success');
        loadInvitations(); // Reload list
    } catch (error) {
        window.showToast("Error updating invitation", 'error');
        console.error(error);
    }
}
