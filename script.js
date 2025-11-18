document.addEventListener('DOMContentLoaded', () => {
    // --- Get Elements ---
    const loginButton = document.getElementById('loginButton');
    const loggedInNav = document.getElementById('loggedInNav');
    
    // Auth-dependent elements (may not be on all pages)
    const loginMessageButton = document.getElementById('loginMessageButton');
    const dashboard = document.getElementById('dashboard');
    const loggedOutMessage = document.getElementById('loggedOutMessage');
    const logoutButton = document.getElementById('logoutButton');
    const profileLogoutButton = document.getElementById('profileLogoutButton');

    // Header user info (on all pages)
    const headerUserName = document.getElementById('headerUserName');
    const headerUserEmail = document.getElementById('headerUserEmail');
    const headerUserAvatar = document.getElementById('headerUserAvatar');

    // Page-specific elements
    const dashboardTitle = document.getElementById('dashboardTitle');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');

    // Modal elements
    const loginModal = document.getElementById('loginModal');
    const closeModalButton = document.getElementById('closeModalButton');
    const modalTitle = document.getElementById('modalTitle');

    // Form elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleToRegister = document.getElementById('toggleToRegister');
    const toggleToLogin = document.getElementById('toggleToLogin');

    // --- Modal Functions ---
    function showModal() {
        if (loginModal) loginModal.classList.remove('hidden');
        if (loginForm) loginForm.classList.remove('hidden');
        if (registerForm) registerForm.classList.add('hidden');
        if (modalTitle) modalTitle.textContent = 'Login to Hub Connect';
    }

    function hideModal() {
        if (loginModal) loginModal.classList.add('hidden');
    }

    // --- UI Update Function ---
    function showLoggedInUI(name, email) {
        const avatarInitial = name.charAt(0).toUpperCase();

        // Header
        if (headerUserName) headerUserName.textContent = name;
        if (headerUserEmail) headerUserEmail.textContent = email;
        if (headerUserAvatar) headerUserAvatar.textContent = avatarInitial;

        // Nav buttons
        if (loggedInNav) loggedInNav.classList.remove('hidden');
        if (loginButton) loginButton.classList.add('hidden');

        // Index.html
        if (dashboardTitle) dashboardTitle.textContent = `Welcome back, ${name}!`;
        if (loggedOutMessage) loggedOutMessage.classList.add('hidden');
        if (dashboard) dashboard.classList.remove('hidden');

        // Profile.html
        if (profileName) profileName.textContent = name;
        if (profileEmail) profileEmail.textContent = email;
        if (profileAvatar) profileAvatar.textContent = avatarInitial;

        hideModal();
    }

    function showLoggedOutUI() {
        // Header
        if (loggedInNav) loggedInNav.classList.add('hidden');
        if (loginButton) loginButton.classList.remove('hidden');

        // Index.html
        if (loggedOutMessage) loggedOutMessage.classList.remove('hidden');
        if (dashboard) dashboard.classList.add('hidden');

        // Clear storage
        localStorage.removeItem('hubUser');

        // Redirect if on profile page
        if (window.location.pathname.includes('profile.html')) {
            window.location.href = 'index.html';
        }
    }

    // --- Check Login Status on Page Load ---
    function checkLoginStatus() {
        const user = localStorage.getItem('hubUser');
        if (user) {
            const { name, email } = JSON.parse(user);
            showLoggedInUI(name, email);
        } else {
            showLoggedOutUI();
        }
    }

    // --- Event Listeners ---
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
            const email = document.getElementById('login-email').value || 'john@email.com';
            const name = "John Doe";
            localStorage.setItem('hubUser', JSON.stringify({ name, email }));
            showLoggedInUI(name, email);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value || "Jane Doe";
            const email = document.getElementById('register-email').value || 'jane@email.com';
            localStorage.setItem('hubUser', JSON.stringify({ name, email }));
            showLoggedInUI(name, email);
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', showLoggedOutUI);
    }
    if (profileLogoutButton) {
        profileLogoutButton.addEventListener('click', showLoggedOutUI);
    }

    // Run on load
    checkLoginStatus();
    loadEvents(); // call events loader here
});

// --- Load Events Function ---
async function loadEvents() {
    if (!document.querySelector('.event-list')) return;

    try {
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error('Network response was not ok');

        const events = await res.json();
        const eventList = document.querySelector('.event-list');
        eventList.innerHTML = '';

        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.setAttribute('data-id', event.id);

            card.innerHTML = `
                <h2>${event.event_title}</h2>
                <p class="event-date">${new Date(event.event_date).toLocaleDateString()}</p>
                <p class="event-location">${event.location}</p>
                <p class="event-description">${event.description}</p>
                <button class="delete-event-btn" style="
                    margin-top:10px;
                    background:#d9534f;
                    color:white;
                    border:none;
                    padding:8px 12px;
                    border-radius:6px;
                    cursor:pointer;
                ">Delete</button>
            `;

            eventList.appendChild(card);

            const deleteBtn = card.querySelector('.delete-event-btn');
            deleteBtn.addEventListener('click', async () => {
                const id = card.getAttribute('data-id');
                if (!confirm("Are you sure you want to delete this event?")) return;

                try {
                    const delRes = await fetch(`/api/events/${id}`, { method: 'DELETE' });
                    if (!delRes.ok) throw new Error('Failed to delete');
                    card.remove();
                } catch (err) {
                    alert("Failed to delete event.");
                    console.error(err);
                }
            });
        });
    } catch (err) {
        console.error('Failed to load events:', err);
    }
}
