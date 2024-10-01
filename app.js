/// Hashing the password using SHA-256 before storing it
async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt); // Combine password with salt
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/// Hashing the email using SHA-256 before storing it
async function hashEmail(email, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(email + salt); // Combine email with salt
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple input sanitization to prevent XSS
function sanitizeInput(input) {
    const element = document.createElement('div');
    element.innerText = input;
    return element.innerHTML;
}

// Check if the password matches
function verifyPassword(input) {
    if (input.value !== document.getElementById("uPassword").value) {
        input.setCustomValidity("Password must match.");
    } else {
        input.setCustomValidity("");
    }
}

// Check if the email already exists
async function emailExist(value) {
    const existemail = JSON.parse(localStorage.getItem("details"));
    if (existemail) {
        const emailid = await Promise.all(existemail.map(async user => await hashEmail(user.email, "randomSalt"))); // Hash existing emails
        const hashedValue = await hashEmail(value.value, "randomSalt"); // Hash the new email
        if (emailid.includes(hashedValue)) {
            value.setCustomValidity('Email exists. Try another.');
        } else {
            value.setCustomValidity("");
        }
    }
}

// Show and hide elements
function showHide(show, hide) {
    const showEle = document.getElementById(show);
    const hideEle = document.getElementById(hide);
    showEle.style.display = "block";
    hideEle.style.display = "none";
}

// Validate and store user data
async function validateForm() {
    let data = localStorage.getItem('details') ? JSON.parse(localStorage.getItem('details')) : [];
    const password = document.getElementById("uPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Ensure passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    // Generate a salt (for demo purposes, use a fixed salt or a more complex generation in real apps)
    const salt = "randomSalt"; // You can generate this randomly for each user in a real application

    // Hash the password
    const hashedPassword = await hashPassword(password, salt);

    // Hash the email
    const email = sanitizeInput(document.getElementById("uEmail").value);
    const hashedEmail = await hashEmail(email, salt);

    let formData = {
        "name": sanitizeInput(document.getElementById("uName").value),
        "email": hashedEmail,
        "password": hashedPassword,
        "salt": salt // Store the salt if you need to verify the password later
    };

    data.push(formData);
    localStorage.setItem("details", JSON.stringify(data));
}

// Handling form submission
const form = document.getElementById("registerForm");
form.addEventListener("submit", async function (e) {
    e.preventDefault();
    await validateForm();
    form.reset();
    document.getElementById("thankYou").style.display = "block";
    form.style.display = "none";
});

// Login user securely
async function loginUser() {
    const loginEmail = sanitizeInput(document.getElementById("uemailId").value);
    const loginPass = document.getElementById("ePassword").value;

    const users = JSON.parse(localStorage.getItem("details"));
    if (users) {
        // Hash the login email with the same salt
        const hashedLoginEmail = await hashEmail(loginEmail, "randomSalt");
        const user = users.find(user => user.email === hashedLoginEmail);
        if (user) {
            // Hash the login password with the same salt
            const hashedLoginPass = await hashPassword(loginPass, user.salt);
            if (hashedLoginPass === user.password) {
                console.log("You have successfully logged in");
                localStorage.setItem('loggedInUser', sanitizeInput(user.name)); // Store the username safely
                window.location.href = 'home.html'; // Redirect to home page
            } else {
                console.log("Invalid credentials");
            }
        } else {
            console.log("No users registered.");
        }
    } else {
        console.log("No users registered.");
    }
}

// Handling login form submission
const loginForm = document.getElementById("logIn");
loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    await loginUser();
});