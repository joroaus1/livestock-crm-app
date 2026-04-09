document.addEventListener("DOMContentLoaded", () => {
    // Supabase Configuration
    const supabaseUrl = 'https://ldsahubkvddutpondmfi.supabase.co';
    const supabaseKey = 'sb_publishable_hz71n7xGAshsubcrCEo4hg_EoxN_TCe';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // DOM Elements
    const authModal = document.getElementById("auth-modal");
    const authForm = document.getElementById("auth-form");
    const authEmail = document.getElementById("auth-email");
    const authPassword = document.getElementById("auth-password");
    const authError = document.getElementById("auth-error");
    const btnSignup = document.getElementById("btn-signup");
    const btnLogout = document.getElementById("btn-logout");
    const btnLangs = document.querySelectorAll(".btn-lang");
    
    // Existing DOM Elements
    const addModal = document.getElementById("add-modal");
    const profileModal = document.getElementById("profile-modal");
    const btnAdd = document.getElementById("btn-add");
    const closeAddModal = document.getElementById("close-add-modal");
    const closeProfileModal = document.getElementById("close-profile-modal");
    const addForm = document.getElementById("add-form");
    const animalList = document.getElementById("animal-list");
    const emptyState = document.getElementById("empty-state");
    const tableContainer = document.querySelector("#animal-table");
    const btnDownload = document.getElementById("btn-download");

    // Input elements for styling checks
    const inputs = document.querySelectorAll('.input-group input, .input-group textarea, .input-group select');

    // State
    let animals = [];
    let currentViewAnimal = null;
    let currentUserId = null;
    let currentUserName = '';
    let isSignUpMode = false;

    // Load animals from Supabase
    async function loadAnimals() {
        const { data, error } = await supabase
            .from('animals')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error loading animals:', error.message);
            animals = [];
        } else {
            animals = data.map(a => ({
                id: a.tag_id,
                dbId: a.id,
                name: a.name,
                race: a.race || '',
                gender: a.gender || '',
                desc: a.description || '',
                mother: a.mother || 'Unknown',
                father: a.father || 'Unknown',
                image_url: a.image_url || null,
                pdf_url: a.pdf_url || null,
                created_by_name: a.created_by_name || 'Unknown'
            }));
        }
        renderTable();
    }

    // i18n Translations
    const translations = {
        en: {
            hello: "Hello<br>Livestock!",
            manage_animals: "Manage your animals",
            your_herd: "Your Herd",
            id_code: "ID Code",
            name: "Name",
            empty_herd: "Your herd is empty. Add your first animal.",
            register_animal: "Register Animal",
            race_breed: "Race / Breed",
            gender: "Gender",
            select_gender: "Select gender",
            cow_female: "Cow (Female)",
            bull_male: "Bull (Male)",
            description: "Description",
            notes_placeholder: "Notes about this animal...",
            mother_id: "Mother (ID/Name)",
            father_id: "Father (ID/Name)",
            eg_id: "e.g. COW-001",
            eg_name: "e.g. Daisy",
            eg_race: "e.g. Angus",
            eg_mother: "e.g. Bessie",
            eg_father: "e.g. Ferdinand",
            save_animal: "SAVE ANIMAL",
            genealogy_tree: "Genealogy Tree",
            mother: "Mother",
            father: "Father",
            download_record: "DOWNLOAD RECORD",
            sign_in_prompt: "Sign in to manage your herd",
            email_label: "Email",
            password_label: "Password",
            sign_in_btn: "SIGN IN",
            sign_up_btn: "SIGN UP",
            or: "OR",
            sign_in_google: "SIGN IN WITH GOOGLE",
            created_by: "Created By",
            full_name_label: "Full Name",
            eg_fullname: "e.g. John Smith",
            hello_user: "Hello<br>{name}!"
        },
        es: {
            hello: "¡Hola<br>Ganado!",
            manage_animals: "Gestiona tus animales",
            your_herd: "Tu Rebaño",
            id_code: "Código ID",
            name: "Nombre",
            empty_herd: "Tu rebaño está vacío. Añade tu primer animal.",
            register_animal: "Registrar Animal",
            race_breed: "Raza",
            gender: "Género",
            select_gender: "Seleccionar género",
            cow_female: "Vaca (Hembra)",
            bull_male: "Toro (Macho)",
            description: "Descripción",
            notes_placeholder: "Notas sobre este animal...",
            mother_id: "Madre (ID/Nombre)",
            father_id: "Padre (ID/Nombre)",
            eg_id: "ej. VACA-001",
            eg_name: "ej. Margarita",
            eg_race: "ej. Angus",
            eg_mother: "ej. Rosita",
            eg_father: "ej. Fernando",
            save_animal: "GUARDAR ANIMAL",
            genealogy_tree: "Árbol Genealógico",
            mother: "Madre",
            father: "Padre",
            download_record: "DESCARGAR REGISTRO",
            sign_in_prompt: "Inicia sesión para gestionar tu rebaño",
            email_label: "Correo electrónico",
            password_label: "Contraseña",
            sign_in_btn: "INICIAR SESIÓN",
            sign_up_btn: "REGISTRARSE",
            or: "O",
            sign_in_google: "INICIAR SESIÓN CON GOOGLE",
            created_by: "Creado Por",
            full_name_label: "Nombre Completo",
            eg_fullname: "ej. Juan Pérez",
            hello_user: "¡Hola<br>{name}!"
        }
    };

    let currentLang = localStorage.getItem("livestockLang") || 'en';

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem("livestockLang", lang);
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                el.innerHTML = translations[lang][key];
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (translations[lang][key]) {
                el.placeholder = translations[lang][key];
            }
        });
        
        if (currentViewAnimal) {
            const g = currentViewAnimal.gender.toLowerCase();
            let displayGender = g === 'cow' ? translations[lang].cow_female : translations[lang].bull_male;
            document.getElementById("view-gender").innerText = displayGender;
        }
    }

    btnLangs.forEach(btn => {
        btn.addEventListener("click", () => {
            setLanguage(currentLang === 'en' ? 'es' : 'en');
        });
    });

    // Initialize language on startup
    setLanguage(currentLang);

    // Auth State Listener
    supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
            // User is signed in
            currentUserId = session.user.id;
            currentUserName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
            authModal.classList.add("hidden");
            btnLogout.style.display = "block";
            // Update header greeting with user name
            const greetingEl = document.getElementById('header-greeting');
            const greetingTemplate = translations[currentLang].hello_user;
            greetingEl.innerHTML = greetingTemplate.replace('{name}', currentUserName);
            loadAnimals();
        } else {
            // User is signed out
            currentUserId = null;
            currentUserName = '';
            animals = [];
            renderTable();
            // Reset greeting
            document.getElementById('header-greeting').innerHTML = translations[currentLang].hello;
            authModal.classList.remove("hidden");
            btnLogout.style.display = "none";
        }
    });

    // Auth Event Listeners
    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        authError.style.display = "none";
        const email = authEmail.value;
        const password = authPassword.value;
        
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            authError.innerText = error.message;
            authError.style.display = "block";
        }
    });

    btnSignup.addEventListener("click", async () => {
        // Toggle sign-up mode to show/hide name field
        const nameGroup = document.getElementById('name-group');
        if (!isSignUpMode) {
            isSignUpMode = true;
            nameGroup.style.display = 'flex';
            return; // First click shows the name field, second click submits
        }
        if (!authForm.checkValidity()) {
            authForm.reportValidity();
            return;
        }
        authError.style.display = "none";
        const email = authEmail.value;
        const password = authPassword.value;
        const fullName = document.getElementById('auth-name').value || email.split('@')[0];

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        });
        if (error) {
            authError.innerText = error.message;
            authError.style.display = "block";
        } else {
            alert("Sign up successful! You can now sign in.");
            isSignUpMode = false;
            nameGroup.style.display = 'none';
        }
    });

    // Google sign in removed

    btnLogout.addEventListener("click", async () => {
        await supabase.auth.signOut();
    });

    // Input interactivity - check marks
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const iconId = 'icon-' + this.id.split('-')[1];
            const icon = document.getElementById(iconId);
            if (icon) {
                if (this.value.trim().length > 0) {
                    icon.classList.remove('hidden');
                } else {
                    icon.classList.add('hidden');
                }
            }
        });
    });

    // Render animals table
    function renderTable() {
        animalList.innerHTML = "";
        
        if (animals.length === 0) {
            emptyState.classList.remove("hidden");
            tableContainer.style.display = "none";
        } else {
            emptyState.classList.add("hidden");
            tableContainer.style.display = "table";
            
            animals.forEach(animal => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${animal.id}</strong></td>
                    <td>${animal.name}</td>
                    <td style="font-size: 12px; color: var(--text-muted);">${animal.created_by_name}</td>
                    <td>
                        <button class="view-btn" data-id="${animal.id}">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </td>
                `;
                
                // Add click event listener to the row
                tr.addEventListener("click", () => openProfile(animal.id));
                animalList.appendChild(tr);
            });
        }
    }

    // Helper: show a brief loading state on the save button
    function setFormLoading(loading) {
        const saveBtn = addForm.querySelector('button[type="submit"]');
        if (loading) {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.6';
        } else {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
        }
    }

    // Modals Logic
    btnAdd.addEventListener("click", () => {
        addModal.classList.remove("hidden");
        // Reset icons
        document.querySelectorAll('.input-icon').forEach(icon => icon.classList.add('hidden'));
    });

    closeAddModal.addEventListener("click", () => {
        addModal.classList.add("hidden");
        addForm.reset();
    });

    closeProfileModal.addEventListener("click", () => {
        profileModal.classList.add("hidden");
    });

    // Close on overlay click
    window.addEventListener("click", (e) => {
        if (e.target === addModal) {
            addModal.classList.add("hidden");
            addForm.reset();
        }
        if (e.target === profileModal) {
            profileModal.classList.add("hidden");
        }
    });

    // Add Form Submit
    addForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        setFormLoading(true);

        const newRecord = {
            user_id: currentUserId,
            tag_id: document.getElementById("input-id").value,
            name: document.getElementById("input-name").value,
            race: document.getElementById("input-race").value,
            gender: document.getElementById("input-gender").value,
            description: document.getElementById("input-desc").value || "No description provided.",
            mother: document.getElementById("input-mother").value || "Unknown",
            father: document.getElementById("input-father").value || "Unknown",
            created_by_name: currentUserName
        };

        const { error } = await supabase.from('animals').insert([newRecord]);
        setFormLoading(false);

        if (error) {
            console.error('Error saving animal:', error.message);
            alert('Error saving animal: ' + error.message);
            return;
        }

        await loadAnimals();
        addModal.classList.add("hidden");
        addForm.reset();
    });

    // View Profile Function
    window.openProfile = function(id) {
        const animal = animals.find(a => a.id === id);
        if (!animal) return;

        currentViewAnimal = animal;

        document.getElementById("view-name").innerText = animal.name;
        document.getElementById("view-id").innerText = `ID: ${animal.id}`;
        
        const g = animal.gender.toLowerCase();
        let displayGender = g === 'cow' ? translations[currentLang].cow_female : translations[currentLang].bull_male;
        document.getElementById("view-gender").innerText = displayGender;
        
        document.getElementById("view-race").innerText = animal.race;
        document.getElementById("view-desc").innerText = animal.desc;
        document.getElementById("view-mother").innerText = animal.mother;
        document.getElementById("view-father").innerText = animal.father;

        profileModal.classList.remove("hidden");
    };

    // Download Functionality — Generate PDF, upload to Supabase Storage, save URL
    btnDownload.addEventListener("click", async () => {
        if (!currentViewAnimal) return;

        const animal = currentViewAnimal;
        const trans = translations[currentLang];
        const g = animal.gender.toLowerCase();
        let displayGender = g === 'cow' ? trans.cow_female : trans.bull_male;
        const recordTitle = currentLang === 'es' ? 'REGISTRO DE GANADO' : 'LIVESTOCK RECORD';

        // Show loading state on button
        const downloadBtn = document.getElementById('btn-download');
        const originalHTML = downloadBtn.innerHTML;
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>' + (currentLang === 'es' ? 'GENERANDO...' : 'GENERATING...') + '</span>';

        try {
            // Generate PDF using jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Header
            doc.setFillColor(133, 19, 44); // --gradient-top color
            doc.rect(0, 0, 210, 45, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text(recordTitle, 20, 25);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text('Livestock CRM', 20, 35);

            // Body
            doc.setTextColor(51, 51, 51);
            let y = 60;

            // Animal Info section
            doc.setFontSize(10);
            doc.setTextColor(183, 25, 57); // --primary-color
            doc.text(trans.id_code, 20, y);
            doc.setTextColor(51, 51, 51);
            doc.setFontSize(14);
            doc.text(animal.id, 80, y);
            y += 12;

            doc.setFontSize(10);
            doc.setTextColor(183, 25, 57);
            doc.text(trans.name, 20, y);
            doc.setTextColor(51, 51, 51);
            doc.setFontSize(14);
            doc.text(animal.name, 80, y);
            y += 12;

            doc.setFontSize(10);
            doc.setTextColor(183, 25, 57);
            doc.text(trans.gender, 20, y);
            doc.setTextColor(51, 51, 51);
            doc.setFontSize(14);
            doc.text(displayGender, 80, y);
            y += 12;

            doc.setFontSize(10);
            doc.setTextColor(183, 25, 57);
            doc.text(trans.race_breed, 20, y);
            doc.setTextColor(51, 51, 51);
            doc.setFontSize(14);
            doc.text(animal.race || '-', 80, y);
            y += 18;

            // Description
            doc.setDrawColor(200, 200, 200);
            doc.line(20, y, 190, y);
            y += 10;
            doc.setFontSize(12);
            doc.setTextColor(183, 25, 57);
            doc.setFont('helvetica', 'bold');
            doc.text(trans.description.toUpperCase(), 20, y);
            y += 8;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 51, 51);
            doc.setFontSize(11);
            const descLines = doc.splitTextToSize(animal.desc || '-', 170);
            doc.text(descLines, 20, y);
            y += descLines.length * 6 + 12;

            // Genealogy
            doc.setDrawColor(200, 200, 200);
            doc.line(20, y, 190, y);
            y += 10;
            doc.setFontSize(12);
            doc.setTextColor(183, 25, 57);
            doc.setFont('helvetica', 'bold');
            doc.text(trans.genealogy_tree.toUpperCase(), 20, y);
            y += 10;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 51, 51);
            doc.setFontSize(11);
            doc.text(trans.mother + ': ' + (animal.mother || '-'), 20, y);
            y += 8;
            doc.text(trans.father + ': ' + (animal.father || '-'), 20, y);

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(153, 153, 153);
            doc.text('Generated by Livestock CRM — ' + new Date().toLocaleDateString(), 20, 285);

            // Convert to blob
            const pdfBlob = doc.output('blob');
            const fileName = `${currentUserId}/${animal.dbId}/record_${animal.id}.pdf`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('livestock_files')
                .upload(fileName, pdfBlob, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (uploadError) {
                console.error('Storage upload error:', uploadError.message);
                // Still download locally even if upload fails
                doc.save(`Livestock_Record_${animal.id}.pdf`);
            } else {
                // Get the download URL
                const { data: urlData } = supabase.storage
                    .from('livestock_files')
                    .getPublicUrl(fileName);

                // Save the pdf_url to the animals table
                if (animal.dbId) {
                    await supabase
                        .from('animals')
                        .update({ pdf_url: urlData.publicUrl })
                        .eq('id', animal.dbId);
                    
                    // Update local state
                    animal.pdf_url = urlData.publicUrl;
                }

                // Trigger download
                doc.save(`Livestock_Record_${animal.id}.pdf`);
            }
        } catch (err) {
            console.error('PDF generation error:', err);
            alert('Error generating PDF: ' + err.message);
        } finally {
            // Restore button
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalHTML;
        }
    });

    // Initial render is triggered by onAuthStateChange calling loadAnimals()
});
