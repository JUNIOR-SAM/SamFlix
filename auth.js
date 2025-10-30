if (document.getElementById('signupForm')) {
  document.getElementById('signupForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    let users = JSON.parse(localStorage.getItem('users')) || [];
    const exists = users.find(u => u.email === email);
    if (exists) {
      alert('User already exists! Try logging in.');
      return;
    }

    users.push({ email, password });
    localStorage.setItem('users', JSON.stringify(users));
    alert('Signup successful! Please login.');
    window.location.href = 'login.html';
  });
}

if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    let users = JSON.parse(localStorage.getItem('users')) || [];
    const valid = users.find(u => u.email === email && u.password === password);
    if (valid) {
      localStorage.setItem('loggedInUser', email);
      alert('Login successful!');
      window.location.href = 'dashboard.html';
    } else {
      alert('Invalid login details.');
    }
  });
}

function logout() {
  localStorage.removeItem('loggedInUser');
  window.location.href = 'login.html';
}

if (document.body.dataset.protected === "true") {
  const user = localStorage.getItem('loggedInUser');
  if (!user) window.location.href = 'login.html';
}
