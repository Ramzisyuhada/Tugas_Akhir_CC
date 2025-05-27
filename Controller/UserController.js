const pool = require('../db'); // import koneksi database

async function loginUser(email, password) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return { success: false, status: 401, message: 'Email tidak ditemukan' };
    }

    const user = result.rows[0];

    // Password plain text check (harusnya pake hashing seperti bcrypt)
    if (password !== user.password) {
      return { success: false, status: 401, message: 'Password salah' };
    }

    return { success: true, status: 200, message: 'Login berhasil', role: user.role };
  } catch (err) {
    console.error('Login error:', err.message);
    return { success: false, status: 500, message: 'Server Error' };
  }
}

// Controller untuk route login, menerima req dan res dari Express
async function login(req, res) {
  const { email, password } = req.body;

  const result = await loginUser(email, password);

  res.status(result.status).json(result);
}
async function registerUser(email, password, role) {
    try {
      // Cek apakah email sudah terdaftar
      const checkEmail = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  
      if (checkEmail.rows.length > 0) {
        return { success: false, status: 409, message: 'Email sudah terdaftar' };
      }
  
      // Simpan user ke database (disarankan: enkripsi password dengan bcrypt)
      await pool.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3)',
        [email, password, role]
      );
  
      return { success: true, status: 201, message: 'Registrasi berhasil' };
    } catch (err) {
      console.error('Register error:', err.message);
      return { success: false, status: 500, message: 'Server Error' };
    }
  }
  
  // Controller untuk route register
  async function register(req, res) {
    const { email, password, role } = req.body;
  
    const result = await registerUser(email, password, role);
  
    res.status(result.status).json(result);
  }
  
module.exports = { login ,register};
