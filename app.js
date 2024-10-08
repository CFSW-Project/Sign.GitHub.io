// Import Firebase libraries
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCllMWtTo0FvtyvBoEXAYZW68bSGReR954",
    authDomain: "appugugu-46214.firebaseapp.com",
    projectId: "appugugu-46214",
    storageBucket: "appugugu-46214.appspot.com",
    messagingSenderId: "501388947238",
    appId: "1:501388947238:web:93cce68b2eea3f98061be7",
    measurementId: "G-F033J9FD9K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Hashing password function
async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hashing email function
async function hashEmail(email, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(email + salt);
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

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple email regex
    return re.test(String(email).toLowerCase());
}

// Check if the email already exists in Firestore
async function emailExist(value) {
    const hashedEmail = await hashEmail(value.value, "randomSalt");

    // Check Firestore for existing hashed email
    const q = query(collection(db, "users"), where("email", "==", hashedEmail));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        value.setCustomValidity('Email exists. Try another.');
    } else {
        value.setCustomValidity("");
    }
}

// Show and hide elements
function showHide(show, hide) {
    const showEle = document.getElementById(show);
    const hideEle = document.getElementById(hide);
    showEle.style.display = "block";
    hideEle.style.display = "none";
}

// Attach the showHide function to the window object to make it globally accessible
window.showHide = showHide;

// Validate and store user data in Firestore
async function validateForm() {
    const password = document.getElementById("uPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Ensure passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    // Generate a salt
    const salt = "randomSalt"; // Use a unique salt for each user in a real application

    // Hash the password
    const hashedPassword = await hashPassword(password, salt);

    // Hash the email
    const email = sanitizeInput(document.getElementById("uEmail").value);
    
    // Validate email
    if (!validateEmail(email)) {
        alert('Invalid email format!');
        return;
    }

    const hashedEmail = await hashEmail(email, salt);

    const formData = {
        name: sanitizeInput(document.getElementById("uName").value),
        email: hashedEmail,
        password: hashedPassword,
        salt: salt // Store the salt if you need to verify the password later
    };

    try {
        // Create a user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password); // Updated syntax
        const userId = userCredential.user.uid; // Get the UID

        // Store user data
        await addDoc(collection(db, "users"), {
            userId: userId, // Optionally store userId if needed
            ...formData
        });

        document.getElementById("registerForm").reset();
        document.getElementById("thankYou").style.display = "block";
        document.getElementById("registerForm").style.display = "none";
    } catch (e) {
        console.error("Error during registration: ", e);
        alert("Error during registration: " + e.message); // Show the error message to the user
    }
}

// Handling form submission for registration
const form = document.getElementById("registerForm");
form.addEventListener("submit", async function (e) {
    e.preventDefault();
    await validateForm();
});

// Login user securely
async function loginUser() {
    const loginEmail = sanitizeInput(document.getElementById("uemailId").value);
    const loginPass = document.getElementById("ePassword").value;

    const hashedLoginEmail = await hashEmail(loginEmail, "randomSalt");
    const q = query(collection(db, "users"), where("email", "==", hashedLoginEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const user = querySnapshot.docs[0].data(); // Get user data

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
}

// Attach the loginUser function to the window object to make it globally accessible
window.loginUser = loginUser;

// Handling login form submission
const loginForm = document.getElementById("logIn");
loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    await loginUser();
});

// Attach emailExist function to window object
window.emailExist = emailExist;

// Attach verifyPassword function to window object
window.verifyPassword = function(input) {
    if (input.value !== document.getElementById("uPassword").value) {
        input.setCustomValidity("Password must match.");
    } else {
        input.setCustomValidity("");
    }
};