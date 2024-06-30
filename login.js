document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const age = document.getElementById('age').value;
    const password = document.getElementById('password').value;

    // Store user details in localStorage (for demo purposes)
    localStorage.setItem('userDetails', JSON.stringify({ name, email, age, password }));

    // Redirect to the whiteboard page
    window.location.href = 'main.html';
});