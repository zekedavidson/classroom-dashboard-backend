fetch('http://localhost:8000/api/auth/sign-up/email', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:5173'
  },
  body: JSON.stringify({ email: 'testnode3@test.com', password: 'password123', name: 'Test Node', role: 'student' })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
}).catch(e => console.error(e));
