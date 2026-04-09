// admin-login.js - Supabase connection strictly for validating admin credentials

const supabaseUrl = 'https://ldsahubkvddutpondmfi.supabase.co';
const supabaseKey = 'sb_publishable_hz71n7xGAshsubcrCEo4hg_EoxN_TCe';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", () => {
    
    // Automatically redirect if they are already logged in as the correct admin
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user.email === 'joroaus1@gmail.com') {
            window.location.href = "admin.html";
        }
    });

    const form = document.getElementById("admin-auth-form");
    const errorBox = document.getElementById("admin-auth-error");
    const loginBtn = document.getElementById("btn-admin-login");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorBox.style.display = "none";
        
        const email = document.getElementById("admin-email").value.trim();
        const password = document.getElementById("admin-password").value;

        // Security check - Reject outright before hitting Supabase if not the correct email
        if (email.toLowerCase() !== 'joroaus1@gmail.com') {
            errorBox.innerText = "Access Denied: Email is not authorized for Admin Portal.";
            errorBox.style.display = "block";
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AUTHORIZING...';

        const { data, error } = await supabaseClient.auth.signInWithPassword({ 
            email, 
            password 
        });

        if (error) {
            errorBox.innerText = error.message;
            errorBox.style.display = "block";
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'AUTHORIZE';
        } else {
            // Success
            window.location.href = "admin.html";
        }
    });
});
