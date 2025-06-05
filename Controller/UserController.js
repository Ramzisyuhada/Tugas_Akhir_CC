const db = require('../db'); // import koneksi database


function AddUser(req, res) {
  var nama = req.body.nama;
  var nim = req.body.nim;
  var email = req.body.email;
  var jurusan = "Teknik Informatika"; // tetap sama
  var nomortelepon = req.body.no_telp;
  var alamat = req.body.alamat;
  var password = req.body.password1;
  var password2 = req.body.password2;

  let errors = {};


  if (!nama || nama.trim() === '') errors.nama = { msg: 'Nama wajib diisi' };
  if (!nim || nim.trim() === '') errors.nim = { msg: 'NIM wajib diisi' };
  if (!email || email.trim() === '') errors.email = { msg: 'Email wajib diisi' };
  else if (!email.includes('@')) errors.email = { msg: 'Format email tidak valid' };
  if (!jurusan || jurusan.trim() === '') errors.jurusan = { msg: 'Jurusan wajib diisi' };
  if (!nomortelepon || nomortelepon.trim() === '') errors.no_telp = { msg: 'Nomor telepon wajib diisi' };
  if (!alamat || alamat.trim() === '') errors.alamat = { msg: 'Alamat wajib diisi' };
  if (!password) errors.password1 = { msg: 'Password wajib diisi' };
  if (!password2) errors.password2 = { msg: 'Ulangi password wajib diisi' };
  if (password && password2 && password !== password2) errors.password2 = { msg: 'Password tidak cocok' };

  if (Object.keys(errors).length > 0) {
    return res.render('Auth/register', {
      formData: req.body,
      errors: errors
    });
  }

  const cekQuery = `SELECT * FROM mahasiswa WHERE nama = ? OR nomortelepon = ? OR email = ?`;
  const cekValues = [nama, nomortelepon, email];

  db.con.query(cekQuery, cekValues, function(err, results) {
    if (err) {
      console.error(err);
      return res.status(500).send('Terjadi kesalahan server saat pengecekan data.');
    }

    // Jika ada hasil, berarti salah satu sudah terdaftar
    if (results.length > 0) {
      results.forEach(user => {
        if (user.nama === nama) {
          errors.nama = { msg: 'Nama sudah terdaftar' };
        }
        if (user.nomortelepon === nomortelepon) {
          errors.no_telp = { msg: 'Nomor telepon sudah terdaftar' };
        }
        if (user.email === email) {
          errors.email = { msg: 'Email sudah terdaftar' };
        }
      });

      return res.render('Auth/register', {
        formData: req.body,
        errors: errors
      });
    }

    // Jika semua validasi lolos, insert data baru
    var sql = "INSERT INTO mahasiswa (nama, nim, email, jurusan, nomortelepon, alamat, password) VALUES (?, ?, ?, ?, ?, ?, ?)";
    var values = [nama, nim, email, jurusan, nomortelepon, alamat, password];

    db.con.query(sql, values, function(err, result) {
      if (err) {
        console.error(err);
        return res.status(500).send('Gagal menyimpan data');
      }
      req.flash('message', 'Registrasi berhasil! Silakan login.');

      res.redirect('/');
    });
  });
}

function Login(req, res, callback) {
  const Password = req.body.password;
  const Nim = req.body.nim;

  // Validasi input
  if (!Nim || Nim.trim() === '') {
    req.flash('message', 'Nim Tidak Boleh Kosong.');
    return res.redirect('/');
  }
  if (!Password || Password.trim() === '') {
    req.flash('message', 'Password Tidak Boleh Kosong.');
    return res.redirect('/');
  }

  var sql = `SELECT * FROM mahasiswa WHERE nim = ? AND password = ?`;
  db.con.query(sql, [Nim, Password], function(err, result) {
    if (err) {
      console.error(err);
      return res.status(500).send('Terjadi kesalahan server saat pengecekan data.');
    }

    if (result.length === 0) {
      req.flash('message', 'NIM atau password salah.');
      return res.redirect('/');
    }

    const user = result[0];
    const role = user.role;

    // Simpan session setelah validasi berhasil
    req.session.user = {
      nim: user.nim,
      role: role,
    };

    console.log("role:", role, typeof role);

    req.flash('message', 'Berhasil Login');

    if (role === 'praktikan') {
      res.redirect('/mahasiswa');
    } else {
      res.redirect('/kelola');
    }

    if (callback) {
      callback(null, user);
    }
  });
}

  
module.exports = { AddUser , Login };
