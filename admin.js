// admin.js - Supabase-connected Admin Dashboard

// Supabase Configuration
const supabaseUrl = 'https://ldsahubkvddutpondmfi.supabase.co';
const supabaseKey = 'sb_publishable_hz71n7xGAshsubcrCEo4hg_EoxN_TCe';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentAdminId = null;
let currentAdminName = null;
let animalsData = [];
let usersDirectory = [];

// Translations
const translations = {
    en: {
        admin_dashboard: "Admin Dashboard",
        admin_desc: "System & Data Management",
        home: "Home",
        animals_data: "Animals Data",
        system_users: "System Users",
        all_animals: "All Animals Database",
        add_animal: "Add Animal",
        registered_users: "Registered Users Directory",
        create_user: "Create User Account",
        created_by: "<i class='fas fa-user-edit'></i> Created By"
    },
    es: {
        admin_dashboard: "Panel de Administración",
        admin_desc: "Gestión de Datos y Sistema",
        home: "Inicio",
        animals_data: "Datos de Animales",
        system_users: "Usuarios del Sistema",
        all_animals: "Base de Datos de Animales",
        add_animal: "Agregar Animal",
        registered_users: "Directorio de Usuarios",
        create_user: "Crear Cuenta de Usuario",
        created_by: "<i class='fas fa-user-edit'></i> Creado Por"
    }
};

let currentLang = localStorage.getItem("livestock_lang") || "en";

function setLanguage(lang) {
    if (!translations[lang]) lang = "en"; // Safety fallback
    currentLang = lang;
    localStorage.setItem("livestock_lang", lang);
    
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    document.querySelectorAll(".btn-lang").forEach(btn => {
        if (btn.getAttribute("data-lang") === lang) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Check Auth State
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (!session || session.user.email.toLowerCase() !== 'joroaus1@gmail.com') {
            alert("SECURITY: You must be signed in with Admin credentials to access this portal.");
            if (session) {
                // Instantly sign out unauthorized user
                supabaseClient.auth.signOut().then(() => {
                    window.location.href = "admin-login.html";
                });
            } else {
                window.location.href = "admin-login.html";
            }
        } else {
            currentAdminId = session.user.id;
            currentAdminName = session.user.user_metadata?.full_name || session.user.email;
            document.getElementById('admin-user-info').innerText = 'Logged in as Admin: ' + currentAdminName;
            fetchSupabaseAnimals();
            fetchSupabaseUsers(); // Updated to pull from 'profiles'
        }
    });

    // Language buttons
    document.querySelectorAll(".btn-lang").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const lang = e.target.getAttribute("data-lang");
            setLanguage(lang);
        });
    });

    // Initial Language Load
    setLanguage(currentLang);
});

// Tab Switching logic
window.switchTab = function(tabName) {
    document.getElementById("tab-animals").classList.remove("active");
    document.getElementById("tab-users").classList.remove("active");
    document.getElementById("tab-" + tabName).classList.add("active");

    document.getElementById("content-animals").classList.add("hidden");
    document.getElementById("content-users").classList.add("hidden");
    document.getElementById("content-" + tabName).classList.remove("hidden");
};

// Animals Data Engine (Supabase)
async function fetchSupabaseAnimals() {
    document.getElementById("admin-animal-list").innerHTML = "<tr><td colspan='8' style='text-align:center;'>Loading from Supabase...</td></tr>";
    
    const { data, error } = await supabaseClient
        .from('animals')
        .select('*');
        
    if (error) {
        console.error("Supabase error fetching animals:", error);
        document.getElementById("admin-animal-list").innerHTML = "<tr><td colspan='8' style='text-align:center; color: red;'>Database Connection Error</td></tr>";
        animalsData = [];
        return;
    }
    
    // Natural numeric sort on tag_id (extracts numbers to sort 2 before 10)
    let sortedData = data || [];
    sortedData.sort((a, b) => {
        const idA = String(a.tag_id || '');
        const idB = String(b.tag_id || '');
        // Try to extract pure numbers for sorting
        const numA = parseInt(idA.replace(/\D/g, ''));
        const numB = parseInt(idB.replace(/\D/g, ''));
        
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
            return numA - numB;
        }
        return idA.localeCompare(idB);
    });
    
    animalsData = sortedData;
    renderAnimals();
}

function renderAnimals() {
    const list = document.getElementById("admin-animal-list");
    const emptyState = document.getElementById("admin-empty-animals");
    const tableContainer = document.getElementById("admin-animal-table");
    
    list.innerHTML = "";
    
    if (animalsData.length === 0) {
        emptyState.classList.remove("hidden");
        tableContainer.style.display = "none";
    } else {
        emptyState.classList.add("hidden");
        tableContainer.style.display = "table";
        
        animalsData.forEach((animal, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${animal.tag_id}</strong></td>
                <td>${animal.name}</td>
                <td><span class="badge">${animal.race || '-'}</span></td>
                <td>${animal.gender || '-'}</td>
                <td>${animal.mother || '-'}</td>
                <td>${animal.father || '-'}</td>
                <td><span style="font-size: 11px; color: var(--primary-color);">${animal.created_by_name || 'System'}</span></td>
                <td>
                    <button class="del-btn" style="color: white; background: #2196f3; margin-right: 5px;" onclick="downloadAdminPDF(${index})" title="Download PDF"><i class="fas fa-file-pdf"></i></button>
                    <button class="del-btn" onclick="deleteAnimal('${animal.id}')" title="Delete Remote Animal"><i class="fas fa-trash"></i></button>
                </td>
            `;
            list.appendChild(tr);
        });
    }
}

// Users Directory Engine (Supabase Profiles)
async function fetchSupabaseUsers() {
    document.getElementById("admin-user-list").innerHTML = "<tr><td colspan='5' style='text-align:center;'>Loading users from Supabase...</td></tr>";
    
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error("Supabase error fetching profiles:", error);
        document.getElementById("admin-user-list").innerHTML = "<tr><td colspan='5' style='text-align:center; color: red;'>Could not load users.</td></tr>";
        usersDirectory = [];
        return;
    }
    
    usersDirectory = data || [];
    renderUsers();
}

function renderUsers() {
    const list = document.getElementById("admin-user-list");
    const emptyState = document.getElementById("admin-empty-users");
    const tableContainer = document.getElementById("admin-user-table");
    
    list.innerHTML = "";
    if (usersDirectory.length === 0) {
        emptyState.classList.remove("hidden");
        tableContainer.style.display = "none";
    } else {
        emptyState.classList.add("hidden");
        tableContainer.style.display = "table";
        
        usersDirectory.forEach((user, index) => {
            const tr = document.createElement("tr");
            const shortId = user.id ? user.id.slice(0,8) + "..." : "USR";
            tr.innerHTML = `
                <td><strong title="${user.id}">${shortId}</strong></td>
                <td>${user.name || 'N/A'}</td>
                <td><span class="badge">${user.role || 'User'}</span></td>
                <td>${user.email || 'N/A'}</td>
                <td>
                    <button class="del-btn" onclick="deleteUser('${user.id}')" title="Remove Profile Record"><i class="fas fa-trash"></i></button>
                </td>
            `;
            list.appendChild(tr);
        });
    }
}

// Delete functions
window.deleteAnimal = async function(dbId) {
    if(confirm("Are you sure you want to PERMANENTLY delete this animal from the active Supabase Database?")) {
        const { error } = await supabaseClient.from('animals').delete().eq('id', dbId);
        if (error) {
            alert("Database Error: " + error.message);
        } else {
            fetchSupabaseAnimals();
        }
    }
}
window.deleteUser = async function(dbId) {
    if(confirm("Are you sure you want to remove this user from the CRM directory representation? (Note: This does not delete their Supabase Auth password)")) {
        const { error } = await supabaseClient.from('profiles').delete().eq('id', dbId);
        if (error) {
            alert("Database Error: " + error.message);
        } else {
            fetchSupabaseUsers();
        }
    }
}

// Add Animal Logic (Supabase)
window.openAdminAddAnimal = function() {
    const modalTitle = document.getElementById("admin-modal-title");
    const modalBody = document.getElementById("admin-modal-body");
    
    modalTitle.innerText = currentLang === 'es' ? "Agregar Nuevo Animal" : "Add New Animal Data";
    modalBody.innerHTML = `
        <form id="admin-add-animal-form">
            <div class="input-group"><label>Tag ID</label><input type="text" id="a-id" required></div>
            <div class="input-group"><label>Name</label><input type="text" id="a-name" required></div>
            <div class="input-group"><label>Race / Breed</label><input type="text" id="a-race" required></div>
            <div class="input-group"><label>Gender</label>
                <select id="a-gender" required>
                    <option value="cow">Cow / Female</option>
                    <option value="bull">Bull / Male</option>
                </select>
            </div>
            <div class="input-group half"><label>Mother</label><input type="text" id="a-mother"></div>
            <div class="input-group half"><label>Father</label><input type="text" id="a-father"></div>
            <div class="input-group"><label>Description</label><textarea id="a-desc"></textarea></div>
            <p id="add-error-msg" style="color:red; font-size:12px; display:none; margin-bottom:10px;"></p>
            <button type="submit" class="btn-primary" id="btn-save-animal">Upload to DB</button>
        </form>
    `;
    
    document.getElementById("admin-add-animal-form").addEventListener("submit", async function(e) {
        e.preventDefault();
        document.getElementById("btn-save-animal").disabled = true;
        
        const newRecord = {
            user_id: currentAdminId,
            created_by_name: currentAdminName + " (Admin)",
            tag_id: document.getElementById("a-id").value,
            name: document.getElementById("a-name").value,
            race: document.getElementById("a-race").value,
            gender: document.getElementById("a-gender").value,
            mother: document.getElementById("a-mother").value || "Unknown",
            father: document.getElementById("a-father").value || "Unknown",
            description: document.getElementById("a-desc").value || ""
        };
        
        const { error } = await supabaseClient.from('animals').insert([newRecord]);
        
        if (error) {
            document.getElementById('add-error-msg').innerText = error.message;
            document.getElementById('add-error-msg').style.display = 'block';
            document.getElementById("btn-save-animal").disabled = false;
        } else {
            fetchSupabaseAnimals();
            closeAdminModal();
        }
    });
    
    document.getElementById("admin-modal").classList.remove("hidden");
}

// Add User Logic (Supabase Auth SignUp)
window.openAdminAddUser = function() {
    const modalTitle = document.getElementById("admin-modal-title");
    const modalBody = document.getElementById("admin-modal-body");
    
    modalTitle.innerText = currentLang === 'es' ? "Registrar Usuario" : "Register System User";
    modalBody.innerHTML = `
        <div style="background: rgba(255, 152, 0, 0.1); border-left: 4px solid #ff9800; padding: 10px; margin-bottom: 20px; font-size: 13px; color: #e65100;">
            <strong>Notice:</strong> Using the frontend API to register a new user will automatically log them in, thereby resetting your current active Admin session. You will need to log back in.
        </div>
        <form id="admin-add-user-form">
            <div class="input-group"><label>Full Name</label><input type="text" id="u-name" required></div>
            <div class="input-group"><label>System Role</label>
                <select id="u-role" required>
                    <option value="Administrator">Administrator</option>
                    <option value="Farm Hand">Farm Hand</option>
                    <option value="Veterinarian">Veterinarian</option>
                </select>
            </div>
            <div class="input-group"><label>Email Address</label><input type="email" id="u-email" required></div>
            <div class="input-group"><label>Initial Password</label><input type="password" id="u-pass" required placeholder="Minimum 6 characters"></div>
            <p id="user-error-msg" style="color:red; font-size:12px; display:none; margin-bottom:10px;"></p>
            <button type="submit" class="btn-primary" id="btn-save-user">Create Secure Account</button>
        </form>
    `;
    
    document.getElementById("admin-add-user-form").addEventListener("submit", async function(e) {
        e.preventDefault();
        
        const name = document.getElementById("u-name").value;
        const role = document.getElementById("u-role").value;
        const email = document.getElementById("u-email").value;
        const password = document.getElementById("u-pass").value;
        
        document.getElementById("btn-save-user").disabled = true;
        document.getElementById("admin-modal-loading").classList.remove("hidden");
        
        // Submit to Supabase - The backend trigger handles syncing to `profiles`
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { full_name: name } // Meta data triggers save 'name' correctly
            }
        });
        
        document.getElementById("admin-modal-loading").classList.add("hidden");
        
        if (error) {
            document.getElementById('user-error-msg').innerText = "Supabase Auth Error: " + error.message;
            document.getElementById('user-error-msg').style.display = 'block';
            document.getElementById("btn-save-user").disabled = false;
        } else {
            alert("Success! The user was registered. Their info is syncing to the profiles table now. Please log back in as the Admin.");
            window.location.href = "index.html";
        }
    });
    
    document.getElementById("admin-modal").classList.remove("hidden");
}

window.closeAdminModal = function() {
    document.getElementById("admin-modal").classList.add("hidden");
    document.getElementById("admin-modal-body").innerHTML = "";
    document.getElementById("admin-modal-loading").classList.add("hidden");
}

// Admin PDF Downloader
window.downloadAdminPDF = function(index) {
    const animal = animalsData[index];
    if(!animal) return;
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFillColor(133, 19, 44); 
        doc.rect(0, 0, 210, 45, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text("LIVESTOCK EXPORT RECORD", 20, 25);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Admin System Export', 20, 35);

        doc.setTextColor(51, 51, 51);
        let y = 60;

        doc.setFontSize(10); doc.setTextColor(183, 25, 57); doc.text("Database System ID", 20, y);
        doc.setTextColor(51, 51, 51); doc.setFontSize(12); doc.text(animal.id || 'N/A', 80, y); y += 10;
        
        doc.setFontSize(10); doc.setTextColor(183, 25, 57); doc.text("Tag ID", 20, y);
        doc.setTextColor(51, 51, 51); doc.setFontSize(14); doc.text(animal.tag_id || 'N/A', 80, y); y += 12;

        doc.setFontSize(10); doc.setTextColor(183, 25, 57); doc.text("Name", 20, y);
        doc.setTextColor(51, 51, 51); doc.setFontSize(14); doc.text(animal.name || '-', 80, y); y += 12;

        doc.setFontSize(10); doc.setTextColor(183, 25, 57); doc.text("Gender", 20, y);
        doc.setTextColor(51, 51, 51); doc.setFontSize(14); doc.text(animal.gender || '-', 80, y); y += 12;

        doc.setFontSize(10); doc.setTextColor(183, 25, 57); doc.text("Race / Breed", 20, y);
        doc.setTextColor(51, 51, 51); doc.setFontSize(14); doc.text(animal.race || '-', 80, y); y += 18;

        doc.setDrawColor(200, 200, 200); doc.line(20, y, 190, y); y += 10;
        doc.setFontSize(12); doc.setTextColor(183, 25, 57); doc.setFont('helvetica', 'bold'); doc.text("DESCRIPTION", 20, y); y += 8;
        doc.setFont('helvetica', 'normal'); doc.setTextColor(51, 51, 51); doc.setFontSize(11);
        const descLines = doc.splitTextToSize(animal.description || '-', 170);
        doc.text(descLines, 20, y); y += descLines.length * 6 + 12;

        doc.setDrawColor(200, 200, 200); doc.line(20, y, 190, y); y += 10;
        doc.setFontSize(12); doc.setTextColor(183, 25, 57); doc.setFont('helvetica', 'bold'); doc.text("GENEALOGY", 20, y); y += 10;
        doc.setFont('helvetica', 'normal'); doc.setTextColor(51, 51, 51); doc.setFontSize(11);
        doc.text('Mother: ' + (animal.mother || '-'), 20, y); y += 8;
        doc.text('Father: ' + (animal.father || '-'), 20, y);

        doc.setFontSize(8); doc.setTextColor(153, 153, 153);
        doc.text(`Generated by Admin: ${currentAdminName} on ` + new Date().toLocaleString(), 20, 285);

        doc.save(`Admin_Record_${animal.tag_id || 'export'}.pdf`);
    } catch(err) {
        alert("Could not generate PDF: " + err.message);
    }
}
