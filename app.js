document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    } else {
        localStorage.setItem('token', token);
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    const form = document.getElementById("prospectForm");
    const statusColumns = document.querySelectorAll(".status-column .prospect-list");

    // Load prospects from the server
    loadProspects();

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        saveProspect();
    });

    async function saveProspect() {
        const propertyLink = document.getElementById("propertyLink").value.trim();
        const contactName = document.getElementById("contactName").value.trim();
        const contactPhone = document.getElementById("contactPhone").value.trim();
        const contactEmail = document.getElementById("contactEmail").value.trim();
        const negotiationState = document.getElementById("negotiationState").value;
        const visited = document.getElementById("visited").checked;
        const nextSteps = document.getElementById("nextSteps").value.trim();

        if (!propertyLink || !contactName || !contactPhone || !contactEmail) {
            alert("Please fill in all required fields.");
            return;
        }

        const prospect = {
            propertyLink,
            contactName,
            contactPhone,
            contactEmail,
            negotiationState,
            visited,
            nextSteps
        };

        try {
            const response = await fetch('/api/prospects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(prospect)
            });
            if (response.ok) {
                form.reset();
                renderProspects();
            } else {
                alert("Failed to save prospect.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    async function renderProspects() {
        statusColumns.forEach(column => column.innerHTML = "");

        try {
            const response = await fetch('/api/prospects', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const prospects = await response.json();

            prospects.forEach(prospect => {
                const prospectElement = createProspectElement(prospect);
                document.querySelector(`.status-column[data-status="${prospect.negotiationState}"] .prospect-list`).appendChild(prospectElement);
            });

            setupDragAndDrop();
        } catch (error) {
            console.error("Error:", error);
        }
    }

    function createProspectElement(prospect) {
        const div = document.createElement("div");
        div.classList.add("prospect-item");
        div.draggable = true;
        div.dataset.id = prospect._id;

        div.innerHTML = `
            <div class="prospect-header">
                <strong>${prospect.contactName}</strong>
                <span class="status-pill ${prospect.negotiationState}">${prospect.negotiationState.replace(/^\w/, (c) => c.toUpperCase())}</span>
            </div>
            <p><a href="${prospect.propertyLink}" target="_blank">Property Link</a></p>
            <p>📞 ${prospect.contactPhone} | ✉️ ${prospect.contactEmail}</p>
            <p>Visited: ${prospect.visited ? "✅" : "❌"}</p>
            <p>Next Steps: ${prospect.nextSteps || "N/A"}</p>
            <div class="prospect-actions">
                <button onclick="deleteProspect('${prospect._id}')">❌ Delete</button>
            </div>
        `;

        return div;
    }

    async function deleteProspect(id) {
        try {
            const response = await fetch(`/api/prospects/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                renderProspects();
            } else {
                alert("Failed to delete prospect.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    function setupDragAndDrop() {
        const items = document.querySelectorAll(".prospect-item");
        const lists = document.querySelectorAll(".prospect-list");

        items.forEach(item => {
            item.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("id", item.dataset.id);
            });
        });

        lists.forEach(list => {
            list.addEventListener("dragover", (e) => e.preventDefault());

            list.addEventListener("drop", async (e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("id");
                const newState = list.closest(".status-column").dataset.status;

                try {
                    const response = await fetch(`/api/prospects/${id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ negotiationState: newState })
                    });
                    if (response.ok) {
                        renderProspects();
                    } else {
                        alert("Failed to update prospect.");
                    }
                } catch (error) {
                    console.error("Error:", error);
                }
            });
        });
    }

    async function loadProspects() {
        renderProspects();
    }

    // Form validation for contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();

            if (name === '' || email === '' || message === '') {
                alert('Please fill out all fields.');
                return;
            }

            alert('Message sent successfully!');
            contactForm.reset();
        });
    }

    // Form validation for registration form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value.trim();

            if (!username || !email || !password || !confirmPassword) {
                alert('All fields are required.');
                return;
            }

            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                return;
            }

            const user = { firstName: username, email, password };

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(user)
                });
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('token', data.token);
                    alert('Registration successful!');
                    window.location.href = 'dashboard.html';
                } else {
                    const error = await response.json();
                    alert(error.error);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }
});
