document.addEventListener('DOMContentLoaded', () => {
    // --- Get Elements ---
    const loginButton = document.getElementById('loginButton');
    const loggedInNav = document.getElementById('loggedInNav');
    
    // Auth-dependent elements (may not be on all pages)
    const loginMessageButton = document.getElementById('loginMessageButton');
    const dashboard = document.getElementById('dashboard');
    const loggedOutMessage = document.getElementById('loggedOutMessage');
    const logoutButton = document.getElementById('logoutButton');
    const profileLogoutButton = document.getElementById('profileLogoutButton'); // Logout button on profile page

    // Header user info (on all pages)
    const headerUserName = document.getElementById('headerUserName');
    const headerUserEmail = document.getElementById('headerUserEmail');
    const headerUserAvatar = document.getElementById('headerUserAvatar');
    
    // Page-specific elements
    const dashboardTitle = document.getElementById('dashboardTitle'); // Only on index.html
    const profileName = document.getElementById('profileName'); // Only on profile.html
    const profileEmail = document.getElementById('profileEmail'); // Only on profile.html
    const profileAvatar = document.getElementById('profileAvatar'); // Only on profile.html
    
    // Modal elements (on all pages)
    const loginModal = document.getElementById('loginModal');
    const closeModalButton = document.getElementById('closeModalButton');
    const modalTitle = document.getElementById('modalTitle');
    
    // Form elements (on all pages)
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

        // Update header (globally)
        if (headerUserName) headerUserName.textContent = name;
        if (headerUserEmail) headerUserEmail.textContent = email;
        if (headerUserAvatar) headerUserAvatar.textContent = avatarInitial;
        
        // Show/hide nav buttons (globally)
        if (loggedInNav) loggedInNav.classList.remove('hidden');
        if (loginButton) loginButton.classList.add('hidden');

        // Update index.html specific elements
        if (dashboardTitle) dashboardTitle.textContent = `Welcome back, ${name}!`;
        if (loggedOutMessage) loggedOutMessage.classList.add('hidden');
        if (dashboard) dashboard.classList.remove('hidden');

        // UPDATED: Update profile.html specific elements
        if (profileName) profileName.textContent = name;
        if (profileEmail) profileEmail.textContent = email;
        if (profileAvatar) profileAvatar.textContent = avatarInitial;
        
        hideModal();
    }

    function showLoggedOutUI() {
        // Update header (globally)
        if (loggedInNav) loggedInNav.classList.add('hidden');
        if (loginButton) loginButton.classList.remove('hidden');

        // Update index.html specific elements
        if (loggedOutMessage) loggedOutMessage.classList.remove('hidden');
        if (dashboard) dashboard.classList.add('hidden');

        // Clear user info from storage
        localStorage.removeItem('hubUser');

        // If on profile page, redirect to home
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
    
    // Modal Open/Close
    if (loginButton) loginButton.addEventListener('click', showModal);
    if (loginMessageButton) loginMessageButton.addEventListener('click', showModal);
    if (closeModalButton) closeModalButton.addEventListener('click', hideModal);
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) hideModal();
        });
    }

    // Form Toggling
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

    // Handle login simulation
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value || 'john@email.com';
            const name = "John Doe"; // Simulate getting name
            
            localStorage.setItem('hubUser', JSON.stringify({ name, email }));
            showLoggedInUI(name, email);
        });
    }

     // Handle registration simulation
     if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value || "Jane Doe";
            const email = document.getElementById('register-email').value || 'jane@email.com';

            localStorage.setItem('hubUser', JSON.stringify({ name, email }));
            showLoggedInUI(name, email);
        });
    }

    // Handle Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            showLoggedOutUI();
        });
    }
    if (profileLogoutButton) {
        profileLogoutButton.addEventListener('click', () => {
            showLoggedOutUI();
        });
    }

    // --- RUN ON PAGE LOAD ---
    checkLoginStatus();
});



// --- Create EVENTS function ---
async function loadEvents() {
    // Only run if we are on the events.html page, it shouldnt run anywhere else.
    if (!document.querySelector('.event-list')) return;

    try {
        const res = await fetch('/api/events'); 
        if (!res.ok) throw new Error('Network response was not ok');

        const events = await res.json();

        const eventList = document.querySelector('.event-list');
        eventList.innerHTML = ''; // Clear the existing static events

        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <h2>${event.event_title}</h2>
                <p class="event-date">${new Date(event.event_date).toLocaleDateString()}</p>
                <p class="event-location">${event.location}</p>
                <p class="event-description">${event.description}</p>
            `;
            eventList.appendChild(card);
        });
    } catch (err) {
        console.error('Failed to load events:', err);
    }
}

// Call it after DOM is ready
document.addEventListener('DOMContentLoaded', loadEvents);
