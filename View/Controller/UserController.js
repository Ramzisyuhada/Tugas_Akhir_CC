const fetch = require('node-fetch');


async function Login(req, res, nim, password) {
  try {
    const response = await fetch('http://localhost:3000/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nim, password })
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {};
      }
      req.flash('message', errorData.message || 'Login gagal');
      return res.redirect('/');
    }

    const data = await response.json();
    console.log('Response data from /auth:', data);

    req.session.user = {
      nim: data.user.nim,
      role: data.user.role,
      id: data.user.id
    };

    console.log('req.session.user:', req.session.user);
    if(data.user.role === "praktikan"){
        return res.redirect('/mahasiswa/Kelas');

    }else if(data.user.role === "aslab"){
          return res.redirect('/kelola');

    }
    return res.redirect('/kelola');

  } catch (err) {
    console.error('Login error:', err);
    req.flash('message', 'Login gagal karena error server');
    return res.redirect('/');
  }
}




module.exports = { Login };
