document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. GLOBAL VARIABLES & ELEMENTS
    // ==========================================
    
    // Auth UI Elements
    const loginButton = document.getElementById('loginButton');
    const loggedInNav = document.getElementById('loggedInNav');
    const logoutButton = document.getElementById('logoutButton');
    const profileLogoutButton = document.getElementById('profileLogoutButton');
    
    // Header Info
    const headerUserName = document.getElementById('headerUserName');
    const headerUserEmail = document.getElementById('headerUserEmail');
    const headerUserAvatar = document.getElementById('headerUserAvatar');

    // Dashboard Elements (Index.html)
    const dashboardTitle = document.getElementById('dashboardTitle');
    const loggedOutMessage = document.getElementById('loggedOutMessage');
    const dashboard = document.getElementById('dashboard');
    const loginMessageButton = document.getElementById('loginMessageButton');

    // Profile Elements
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');

    // Modals
    const loginModal = document.getElementById('loginModal');
    const closeModalButton = document.getElementById('closeModalButton');
    const modalTitle = document.getElementById('modalTitle');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleToRegister = document.getElementById('toggleToRegister');
    const toggleToLogin = document.getElementById('toggleToLogin');

    // Page Specific Elements
    const eventForm = document.getElementById('event-form'); 
    const eventListContainer = document.querySelector('.event-list'); 
    const clubsGrid = document.getElementById('clubs-grid'); 

    // ==========================================
    // 2. AUTHENTICATION UI LOGIC
    // ==========================================

    function showModal() {
        if (loginModal) loginModal.classList.remove('hidden');
        if (loginForm) loginForm.classList.remove('hidden');
        if (registerForm) registerForm.classList.add('hidden');
        if (modalTitle) modalTitle.textContent = 'Login to Hub Connect';
    }

    function hideModal() {
        if (loginModal) loginModal.classList.add('hidden');
    }

    function showLoggedInUI(name, email) {
        const avatarInitial = name.charAt(0).toUpperCase();
        if (headerUserName) headerUserName.textContent = name;
        if (headerUserEmail) headerUserEmail.textContent = email;
        if (headerUserAvatar) headerUserAvatar.textContent = avatarInitial;
        if (loggedInNav) loggedInNav.classList.remove('hidden');
        if (loginButton) loginButton.classList.add('hidden');
        if (dashboardTitle) dashboardTitle.textContent = `Welcome back, ${name}!`;
        if (loggedOutMessage) loggedOutMessage.classList.add('hidden');
        if (dashboard) dashboard.classList.remove('hidden');
        if (profileName) profileName.textContent = name;
        if (profileEmail) profileEmail.textContent = email;
        if (profileAvatar) profileAvatar.textContent = avatarInitial;
        hideModal();
    }

    function showLoggedOutUI() {
        if (loggedInNav) loggedInNav.classList.add('hidden');
        if (loginButton) loginButton.classList.remove('hidden');
        if (loggedOutMessage) loggedOutMessage.classList.remove('hidden');
        if (dashboard) dashboard.classList.add('hidden');
        localStorage.removeItem('hubUser');
        if (window.location.pathname.includes('profile.html') || window.location.pathname.includes('create_event.html')) {
             window.location.href = 'index.html';
        }
    }

    function checkLoginStatus() {
        const user = localStorage.getItem('hubUser');
        if (user) {
            const { name, email } = JSON.parse(user);
            showLoggedInUI(name, email);
        } else {
            showLoggedOutUI();
        }
    }

    // Event Listeners
    if (loginButton) loginButton.addEventListener('click', showModal);
    if (loginMessageButton) loginMessageButton.addEventListener('click', showModal);
    if (closeModalButton) closeModalButton.addEventListener('click', hideModal);
    
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) hideModal();
        });
    }

    if (toggleToRegister) {
        toggleToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            modalTitle.textContent = 'Create an Account';
        });
    }

    if (toggleToLogin) {
        toggleToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            modalTitle.textContent = 'Login to Hub Connect';
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const name = "John Doe"; 
            localStorage.setItem('hubUser', JSON.stringify({ name, email }));
            showLoggedInUI(name, email);
        });
    }

    if (logoutButton) logoutButton.addEventListener('click', showLoggedOutUI);
    if (profileLogoutButton) profileLogoutButton.addEventListener('click', showLoggedOutUI);

    // ==========================================
    // 3. EVENT CREATION LOGIC (UPDATED FOR BUTTON CLICK)
    // ==========================================
    
    // Find the button directly
    const publishBtn = document.getElementById('publishBtn'); 

    if (publishBtn) {
        publishBtn.addEventListener('click', async () => {
            // Gather data from the form inputs
            const data = {
                club_id: document.getElementById("eventClub").value,
                event_title: document.getElementById("eventName").value,
                description: document.getElementById("eventDescription").value,
                event_date: document.getElementById("eventDate").value,
                event_time: document.getElementById("eventTime").value,
                location: document.getElementById("eventLocation").value,
                created_by: 1 
            };

            try {
                console.log("🚀 Sending Data via Button Click...");
                
                // Using relative path to support teammates and satisfy Safari
                const res = await fetch("/api/events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    alert("Event created successfully!");
                    window.location.href = "events.html";
                } else {
                    const errorData = await res.json();
                    alert("Failed to create event: " + (errorData.error || res.statusText));
                }
            } catch (err) {
                console.error("Fetch error:", err);
                alert("Server error: " + err.message);
            }
        });
    }

    // ==========================================
    // 4. EVENT LOADING LOGIC (GET & DELETE)
    // ==========================================

    async function loadEvents() {
        if (!eventListContainer) return; 

        try {
            const res = await fetch('/api/events');
            if (!res.ok) throw new Error('Failed to fetch events');

            const events = await res.json();
            eventListContainer.innerHTML = ''; 

            events.forEach(event => {
                const card = document.createElement('div');
                card.className = 'event-card';
                card.setAttribute('data-id', event.event_id);

                const dateObj = new Date(event.event_date);
                const dateStr = dateObj.toLocaleDateString();

                const title = event.event_title || event.title || "Untitled Event";

                card.innerHTML = `
                    <h2>${title}</h2>
                    <p class="event-meta">
                        <strong>Date:</strong> ${dateStr} at ${event.event_time || 'TBD'} <br>
                        <strong>Location:</strong> ${event.location}
                    </p>
                    <p class="event-description">${event.description}</p>
                    <button class="delete-event-btn" style="margin-top:10px; background:#d9534f; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;">Delete</button>
                `;

                eventListContainer.appendChild(card);

                const deleteBtn = card.querySelector('.delete-event-btn');
                deleteBtn.addEventListener('click', async () => {
                    if (!confirm("Are you sure you want to delete this event?")) return;
                    
                    try {
                        const delRes = await fetch(`/api/events/${event.event_id}`, { 
                            method: 'DELETE' 
                        });
                        
                        if (delRes.ok) {
                            card.remove(); 
                        } else {
                            const errData = await delRes.json();
                            alert("Failed to delete: " + (errData.error || delRes.statusText));
                        }
                    } catch (err) {
                        console.error("Delete error:", err);
                        alert("Network Error: Could not delete.");
                    }
                });
            });

        } catch (err) {
            console.error('Failed to load events:', err);
            eventListContainer.innerHTML = '<p>Error loading events from database.</p>';
        }
    }

    // ==========================================
    // 5. CLUB LOADING LOGIC
    // ==========================================

    async function loadClubs() {
        if (!clubsGrid) return; 

        try {
            const res = await fetch('/api/clubs');
            if (!res.ok) throw new Error('Failed to fetch clubs');

            const clubs = await res.json();
            clubsGrid.innerHTML = '';

            if (clubs.length === 0) {
                clubsGrid.innerHTML = '<p>No clubs found in the database.</p>';
                return;
            }

            clubs.forEach(club => {
                const card = document.createElement('div');
                card.style.cssText = "border: 1px solid #eee; border-radius: 12px; padding: 24px; background: white; display: flex; flex-direction: column; gap: 16px;";
                
                let iconBg = '#f0fdfa'; let iconColor = '#14b8a6'; 
                if (club.category === 'Arts') { iconBg = '#eff6ff'; iconColor = '#2563eb'; }
                if (club.category === 'Humanities') { iconBg = '#fffbeb'; iconColor = '#d97706'; }
                if (club.category === 'Science') { iconBg = '#fff1f2'; iconColor = '#e11d48'; }

                const letter = club.icon_letter || (club.club_name ? club.club_name.charAt(0) : 'C');

                card.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div class="club-icon" style="width: 48px; height: 48px; border-radius: 8px; background-color: ${iconBg}; color: ${iconColor}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px;">
                            ${letter}
                        </div>
                        <div>
                            <h3 style="font-size: 18px; font-weight: 600;">${club.club_name}</h3>
                            <p style="font-size: 14px; color: gray;">${club.category || 'General'}</p>
                        </div>
                    </div>
                    <p style="font-size: 14px; color: #555; line-height: 1.5;">
                        ${club.description}
                    </p>
                    <button class="btn btn-secondary" onclick="alert('Join feature coming in Sprint 2!')" style="width: 100%; margin-top: auto;">
                        View Details
                    </button>
                `;
                clubsGrid.appendChild(card);
            });

        } catch (err) {
            console.error('Failed to load clubs:', err);
            clubsGrid.innerHTML = '<p style="color:red">Error loading clubs. Ensure server is running.</p>';
        }
    }

    // ==========================================
    // 6. INITIALIZATION
    // ==========================================
    checkLoginStatus();
    loadEvents();
    loadClubs();
});
