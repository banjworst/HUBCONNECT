document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================================
    // CHAPTER 1: GLOBAL STATE & DOM ELEMENTS
    // =========================================================
    
    // State Variables (Hold current user info in memory)
    let CURRENT_USER_NAME = null; 
    let CURRENT_USER_ID = null;

    // Navigation & Auth Elements
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const loggedInNav = document.getElementById('loggedInNav');
    const dashboard = document.getElementById('dashboard');
    const loggedOutMessage = document.getElementById('loggedOutMessage');
    const loginMessageButton = document.getElementById('loginMessageButton');

    // Modals & Forms
    const loginModal = document.getElementById('loginModal');
    const closeModalButton = document.getElementById('closeModalButton');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleToRegister = document.getElementById('toggleToRegister');
    const toggleToLogin = document.getElementById('toggleToLogin');

    // Profile Editing Elements (New!)
    const openEditProfileBtn = document.getElementById('openEditProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeEditProfileBtn = document.getElementById('closeEditProfileBtn');
    const editProfileForm = document.getElementById('editProfileForm');


    // =========================================================
    // CHAPTER 2: AUTHENTICATION LOGIC (The "Gatekeeper")
    // =========================================================

    // 1. Check if user is logged in (Runs on page load)
    async function checkLoginStatus() {
        try {
            const res = await fetch('/api/me'); // Checks cookie
            if (res.ok) {
                const data = await res.json();
                CURRENT_USER_NAME = data.user.full_name;
                CURRENT_USER_ID = data.user.user_id;
                showLoggedInUI(data.user.full_name, data.user.email);
            } else {
                showLoggedOutUI();
            }
        } catch (err) { 
            console.error("Auth Check Error:", err); 
            showLoggedOutUI(); 
        }
    }

    // 2. Update UI for Logged In User
    function showLoggedInUI(name, email) {
        // A. Update Header Info
        safeSetText('headerUserName', name);
        safeSetText('headerUserEmail', email);
        safeSetText('headerUserAvatar', name.charAt(0).toUpperCase());
        
        // B. Update Profile Page Info (If we are on profile.html)
        safeSetText('profileName', name);
        safeSetText('profileEmail', email);
        safeSetText('profileAvatar', name.charAt(0).toUpperCase());

        // C. Toggle Visibility
        if (loggedInNav) loggedInNav.classList.remove('hidden');
        if (loginButton) loginButton.classList.add('hidden');
        if (loggedOutMessage) loggedOutMessage.classList.add('hidden');
        if (dashboard) dashboard.classList.remove('hidden');
        if (loginModal) loginModal.classList.add('hidden');

        // D. Initialize Page Logic
        if (typeof loadMyClubs === 'function') loadMyClubs(); // Dashboard cards
        initCreateEventPage(); // Permission check for creating events
    }

    // 3. Update UI for Logged Out User
    function showLoggedOutUI() {
        CURRENT_USER_NAME = null;
        CURRENT_USER_ID = null;
        
        // Strict Gatekeeper: Bounce strangers back to index.html
        const path = window.location.pathname;
        if (!path.endsWith('index.html') && path !== '/') {
            window.location.href = 'index.html';
            return; 
        }

        if (loggedInNav) loggedInNav.classList.add('hidden');
        if (loginButton) loginButton.classList.remove('hidden');
        if (loggedOutMessage) loggedOutMessage.classList.remove('hidden');
        if (dashboard) dashboard.classList.add('hidden');
    }

    // Helper to safely set text content even if element is missing
    function safeSetText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }


    // =========================================================
    // CHAPTER 3: BASIC EVENT LISTENERS (Clicks & Submits)
    // =========================================================

    // Modal Toggles
    if (loginButton) loginButton.addEventListener('click', () => loginModal.classList.remove('hidden'));
    if (loginMessageButton) loginMessageButton.addEventListener('click', () => loginModal.classList.remove('hidden'));
    if (closeModalButton) closeModalButton.addEventListener('click', () => loginModal.classList.add('hidden'));

    if (toggleToRegister) toggleToRegister.addEventListener('click', (e) => {
        e.preventDefault(); loginForm.classList.add('hidden'); registerForm.classList.remove('hidden');
    });
    if (toggleToLogin) toggleToLogin.addEventListener('click', (e) => {
        e.preventDefault(); registerForm.classList.add('hidden'); loginForm.classList.remove('hidden');
    });

    // Logout
    if (logoutButton) logoutButton.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = 'index.html';
    });

    // Login Submit
    if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await fetch('/api/login', { 
            method: 'POST', 
            body: JSON.stringify({
                email: document.getElementById('login-email').value, 
                password: document.getElementById('login-password').value
            }) 
        });
        if (res.ok) window.location.reload();
        else alert("Login Failed: Invalid credentials");
    });

    // Register Submit
    if (registerForm) registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await fetch('/api/register', { 
            method: 'POST', 
            body: JSON.stringify({
                name: document.getElementById('register-name').value, 
                email: document.getElementById('register-email').value, 
                password: document.getElementById('register-password').value
            }) 
        });
        if (res.ok) window.location.reload();
        else alert("Registration Failed (Email might be taken)");
    });


    // =========================================================
    // CHAPTER 4: PROFILE MANAGEMENT (Edit Feature)
    // =========================================================

    // 1. Open Modal & Pre-fill Data
    if (openEditProfileBtn) {
        openEditProfileBtn.addEventListener('click', () => {
            // Grab text from the page to fill the form
            const currentName = document.getElementById('profileName').textContent;
            const currentEmail = document.getElementById('profileEmail').textContent;
            
            document.getElementById('edit-name').value = currentName;
            document.getElementById('edit-email').value = currentEmail;
            document.getElementById('edit-password').value = ""; // Always clear password
            
            editProfileModal.classList.remove('hidden');
        });
    }

    // 2. Close Modal
    if (closeEditProfileBtn) {
        closeEditProfileBtn.addEventListener('click', () => {
            editProfileModal.classList.add('hidden');
        });
    }

    // 3. Handle Update Submission
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newName = document.getElementById('edit-name').value;
            const newEmail = document.getElementById('edit-email').value;
            const newPassword = document.getElementById('edit-password').value;

            try {
                const res = await fetch('/api/me', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newName, email: newEmail, password: newPassword })
                });

                if (res.ok) {
                    const data = await res.json();
                    alert("✅ Profile Updated Successfully!");
                    editProfileModal.classList.add('hidden');
                    
                    // Update Global State & UI immediately
                    CURRENT_USER_NAME = data.user.full_name;
                    showLoggedInUI(data.user.full_name, data.user.email);
                } else {
                    const err = await res.json();
                    alert("Update Failed: " + (err.error || "Unknown error"));
                }
            } catch (error) {
                console.error(error);
                alert("Server Error");
            }
        });
    }


    // =========================================================
    // CHAPTER 5: EVENT CREATION (Officer Check)
    // =========================================================
    async function initCreateEventPage() {
        const select = document.getElementById('eventClub');
        const publishBtn = document.getElementById('publishBtn');
        
        // Only run if these elements exist (meaning we are on create_event.html)
        if (!select || !publishBtn) return; 

        // A. Handle Button Click
        publishBtn.onclick = async (e) => {
            e.preventDefault();
            const clubId = select.value;
            
            // Validation
            if (!clubId) return alert("Please select a Host Club.");
            if (select.disabled) return alert("You are not an Officer of any club.");

            const data = {
                club_id: clubId,
                event_title: document.getElementById("eventName").value,
                description: document.getElementById("eventDescription").value,
                event_date: document.getElementById("eventDate").value,
                event_time: document.getElementById("eventTime").value,
                location: document.getElementById("eventLocation").value,
                created_by: CURRENT_USER_ID // Send ID, not Name
            };

            if(!data.event_title || !data.event_date || !data.location) {
                return alert("Please fill in all fields.");
            }

            try {
                const res = await fetch('/api/events', { 
                    method:'POST', 
                    headers: {'Content-Type': 'application/json'}, 
                    body:JSON.stringify(data) 
                });
                if(res.ok) { alert("Event Created!"); window.location.href = "events.html"; }
                else { const err = await res.json(); alert("Error: " + err.error); }
            } catch(e) { console.error(e); }
        };

        // B. Populate Dropdown with Officer Clubs
        try {
            const [rosterRes, clubsRes] = await Promise.all([fetch('/api/rosters/all'), fetch('/api/clubs')]);
            const roster = await rosterRes.json();
            const allClubs = await clubsRes.json();

            // Filter: Clubs where I am an Officer
            const myOfficerClubs = roster.filter(r => r.member_name === CURRENT_USER_NAME && r.role === 'Officer');

            select.innerHTML = ''; 

            if (myOfficerClubs.length === 0) {
                select.innerHTML = '<option disabled selected>No Access (Officer Required)</option>';
                select.disabled = true;
                publishBtn.disabled = true;
                publishBtn.style.opacity = "0.5";
                publishBtn.innerText = "Officer Access Required";
                if(document.getElementById('noClubsMsg')) document.getElementById('noClubsMsg').style.display = 'block';
            } else {
                const defaultOpt = document.createElement('option');
                defaultOpt.text = "Select a club..."; defaultOpt.value = ""; defaultOpt.disabled = true; defaultOpt.selected = true;
                select.add(defaultOpt);
                
                myOfficerClubs.forEach(membership => {
                    const club = allClubs.find(c => c.club_id === membership.club_id);
                    if (club) {
                        const opt = document.createElement('option');
                        opt.value = club.club_id; opt.text = club.club_name;
                        select.add(opt);
                    }
                });
            }
        } catch (e) { console.error("Error loading clubs:", e); }
    }


    // =========================================================
    // CHAPTER 6: DISPLAY LOGIC (Clubs, Dashboard, Events)
    // =========================================================

    // 1. Load Events List with RSVPs
    async function loadEvents() {
        const container = document.querySelector('.event-list');
        if (!container) return;
        
        try {
            const eventsRes = await fetch('/api/events');
            const events = await eventsRes.json();
            container.innerHTML = '';
            
            for (const event of events) {
                // Fetch RSVP data for this event
                const rsvpReq = await fetch(`/api/rsvps/${event.event_id}`);
                const rsvps = await rsvpReq.json();
                
                // Check if current user is in the list
                const amIGoing = rsvps.some(r => r.user_id === CURRENT_USER_ID);
                const count = rsvps.length;

                const div = document.createElement('div');
                div.className = 'event-card';
                
                const btnStyle = amIGoing ? "background-color:#10b981; color:white; border:none;" : "";
                const btnText = amIGoing ? "✅ Going" : "RSVP";

                div.innerHTML = `
                    <h2 class="event-title">${event.event_title}</h2>
                    <p class="event-meta">Date: ${new Date(event.event_date).toLocaleDateString()} @ ${event.event_time}<br>Loc: ${event.location}</p>
                    <p class="event-description">${event.description}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px; border-top:1px solid #eee; padding-top:12px;">
                        <span style="font-size:13px; color:gray; font-weight:500;">${count} attending</span>
                        <div style="display:flex; gap:8px;">
                            <button class="btn btn-secondary btn-rsvp" style="${btnStyle}">${btnText}</button>
                            ${CURRENT_USER_NAME ? '<button class="btn btn-delete" style="padding:6px 10px;">🗑</button>' : ''}
                        </div>
                    </div>
                `;
                container.appendChild(div);

                // RSVP Handle
                div.querySelector('.btn-rsvp').addEventListener('click', async () => {
                    if (!CURRENT_USER_ID) return alert("Login to RSVP");
                    await fetch('/api/rsvps', { method: 'POST', body: JSON.stringify({ event_id: event.event_id }) });
                    loadEvents(); 
                });

                // Delete Handle (Simple Client Check, Server also checks)
                const delBtn = div.querySelector('.btn-delete');
                if (delBtn) delBtn.addEventListener('click', async () => {
                     if (confirm("Delete event?")) {
                        await fetch(`/api/events/${event.event_id}`, { method: 'DELETE' });
                        loadEvents();
                     }
                });
            }
        } catch(e) { console.error(e); }
    }

    // 2. Load "My Clubs" on Dashboard
    async function loadMyClubs() {
        const container = document.getElementById('myClubsContainer');
        if (!container || !CURRENT_USER_NAME) return;
        
        try {
            const [clubsRes, rosterRes] = await Promise.all([fetch('/api/clubs'), fetch('/api/rosters/all')]);
            const allClubs = await clubsRes.json();
            const roster = await rosterRes.json();
            
            const myMemberships = roster.filter(m => m.member_name === CURRENT_USER_NAME);
            
            container.innerHTML = '';
            
            if (myMemberships.length === 0) { 
                container.innerHTML = '<p style="color:gray;">You haven\'t joined any clubs yet.</p>'; 
                return; 
            }

            myMemberships.forEach(m => {
                const c = allClubs.find(club => club.club_id === m.club_id);
                if (!c) return;

                const div = document.createElement('div');
                div.className = 'club-card';
                
                // Status Logic
                let badge = '';
                let actionBtn = '';

                if (m.mem_status === 'pending') {
                    badge = `<span class="badge" style="background:#fff7ed; color:#c2410c;">Requested ⏳</span>`;
                    actionBtn = `<button class="btn btn-secondary" disabled style="font-size:12px; margin-left:auto; opacity:0.6; cursor:not-allowed;">Pending...</button>`;
                } else if (m.role === 'Officer') {
                    badge = `<span class="badge badge-officer">Officer</span>`;
                    actionBtn = `<a href="edit_club.html?id=${c.club_id}" class="btn btn-secondary" style="font-size:12px; margin-left:auto;">Manage</a>`;
                } else {
                    badge = `<span class="badge badge-member">Member</span>`;
                    actionBtn = `<a href="clubs.html" class="btn btn-secondary" style="font-size:12px; margin-left:auto;">View Page</a>`;
                }

                const shortDesc = c.description.length > 60 ? c.description.substring(0, 60) + "..." : c.description;

                div.innerHTML = `
                    <div class="club-header">
                         <div style="font-weight:bold; font-size:18px; width:40px; height:40px; background:#f0f9ff; color:#0284c7; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                            ${c.icon_letter || 'C'}
                         </div>
                         <div>
                            <div class="club-title-row">
                                <h3 class="club-name" style="font-size:16px; margin:0;">${c.club_name}</h3>
                                ${badge}
                            </div>
                            <p style="color:gray; font-size:12px; margin:0;">${c.category || 'General'}</p>
                         </div>
                    </div>
                    <p style="font-size:13px; color:#555; margin-top:12px; line-height:1.4;">${shortDesc}</p>
                    <div style="margin-top:16px; display:flex;">
                        ${actionBtn}
                    </div>
                `;
                container.appendChild(div);
            });
        } catch (e) { console.error(e); }
    }

    // 3. Load All Clubs (Explore Page)
    async function loadClubs() {
        const grid = document.getElementById('clubs-grid');
        if (!grid) return;
        try {
            const [clubsRes, rosterRes] = await Promise.all([fetch('/api/clubs'), fetch('/api/rosters/all')]);
            const clubs = await clubsRes.json();
            const roster = await rosterRes.json();
            grid.innerHTML = '';
            
            clubs.forEach(club => {
                const myEntry = roster.find(m => m.member_name === CURRENT_USER_NAME && m.club_id === club.club_id);
                const role = myEntry ? myEntry.role : null;
                const status = myEntry ? myEntry.mem_status : null;
                
                let btn = `<button class="join-btn btn btn-primary" style="width:100%">Request to Join</button>`;
                let badge = '';

                if (role === 'Officer') {
                    badge = `<span class="badge badge-officer">Officer</span>`;
                    btn = `<a href="edit_club.html?id=${club.club_id}" class="btn btn-secondary btn-manage">Manage</a>`;
                } else if (status === 'active') {
                    badge = `<span class="badge badge-member">Member</span>`;
                    btn = `<button class="btn btn-secondary" disabled style="width:100%;opacity:0.6">Joined</button>`;
                } else if (status === 'pending') {
                    btn = `<button class="btn-pending" disabled>Pending...</button>`;
                }

                const div = document.createElement('div');
                div.className = 'club-card';
                div.innerHTML = `
                    <div class="club-header">
                         <div style="font-weight:bold; font-size:20px; width:40px; height:40px; background:#f0f9ff; display:flex; align-items:center; justify-content:center;">${club.icon_letter||'C'}</div>
                         <div><div class="club-title-row"><h3>${club.club_name}</h3>${badge}</div><p style="color:gray; font-size:14px;">${club.category}</p></div>
                    </div>
                    <p>${club.description}</p>
                    <div style="margin-top:auto;">${btn}</div>
                `;
                grid.appendChild(div);
                
                const jBtn = div.querySelector('.join-btn');
                if (jBtn) jBtn.addEventListener('click', async () => {
                    if (!CURRENT_USER_NAME) return alert("Login First");
                    await fetch('/api/rosters', { method:'POST', body:JSON.stringify({club_id:club.club_id, member_name:CURRENT_USER_NAME}) });
                    alert("Request Sent"); loadClubs();
                });
            });
        } catch(e) { console.error(e); }
    }

    // 4. Create Club Handler
    const createClubBtn = document.getElementById('createClubBtn');
    if (createClubBtn) createClubBtn.addEventListener('click', async () => {
        const data = {
            club_name: document.getElementById('clubName').value,
            description: document.getElementById('clubDesc').value,
            category: document.getElementById('clubCategory').value,
            icon_letter: document.getElementById('clubIcon').value.toUpperCase(),
            created_by: CURRENT_USER_NAME
        };
        const res = await fetch('/api/clubs', { method:'POST', body:JSON.stringify(data) });
        if (res.ok) { alert("Created!"); window.location.href='clubs.html'; }
    });


    // =========================================================
    // CHAPTER 7: INITIALIZATION (Kickoff)
    // =========================================================
    checkLoginStatus();
    loadEvents();
    loadClubs();
});
