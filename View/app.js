const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const mysql = require('mysql2');
const path = require('path');
const fetch = require('node-fetch');

const { Login } = require('./Controller/UserController');
const { GetKelasAslab,GetKelas ,AddKelas} = require('./Controller/KelasController');
const { AddTugas,SetNilai } = require('./Controller/TugasController');

const multer = require('multer'); // ✅ Import dulu

const storage = multer.memoryStorage(); // Atau bisa pakai diskStorage
const upload = multer({ storage });     // Baru gunakan multer
const app = express();

// Setup middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session & Flash
app.use(session({
  secret: 'secretkey', 
  resave: false,
  saveUninitialized: false, // disarankan false untuk keamanan
}));
app.use(flash());

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname));

app.use((req, res, next) => {
  res.locals.message = req.flash('message')[0] || null;
  res.locals.errors = req.flash('errors')[0] || {};
  res.locals.formData = req.flash('formData')[0] || {};
  res.locals.token = req.flash('token')[0] || '';
  const role = req.session.user?.role || null;
  if (role === 'aslab') {
    res.locals.menu = [{ id: 1, menu: 'Aslab' }];
    res.locals.submenu = [
      { id: 1, menu_id: 1, title: 'Kelola Kelas', url: 'kelola', icon: 'fas fa-users', is_active: 1 },
      { id: 2, menu_id: 1, title: 'Tambah Kelas', url: 'tambahKelas', icon: 'fas fa-plus', is_active: 1 },
    ];
  } else if (role === 'praktikan') {
    res.locals.menu = [{ id: 2, menu: 'Praktikan' }];
    res.locals.submenu = [
      { id: 3, menu_id: 2, title: 'Kelas', url: 'mahasiswa', icon: 'fas fa-book', is_active: 1 },
      { id: 4, menu_id: 2, title: 'Kelas Saya', url: 'mahasiswa/kelasSaya', icon: 'fas fa-user', is_active: 1 },
    ];
  } else {
    res.locals.menu = [];
    res.locals.submenu = [];
  }

  res.locals.user = req.session.user || { nama: 'Guest', foto: 'default.jpg' };
  next();
});

app.post('/auth', async (req, res) => {
  const { nim, password } = req.body;
  if (!nim || !password) {
    req.flash('message', 'NIM dan password wajib diisi');
    return res.redirect('/');
  }

  try {
    await Login(req, res, nim, password); 
  } catch (err) {
    req.flash('message', 'Terjadi kesalahan saat login');
    res.redirect('/');
  }
});


// Login page
app.get('/', (req, res) => {
  res.render('Auth/login', {
    errors: {},
    nim: '',
    message: res.locals.message,
  });
});

// Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/');
    console.log('Role:', req.session.user);

  res.render('aslab/index', { judul: 'Home', menu: res.locals.menu });
});

// Tambah Kelas
app.get('/tambahKelas', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('aslab/tambahKelas', { judul: 'Tambah Kelas', aslab: [] });
});

// Get image from DB
app.get('/kelas/image/:id', (req, res) => {
  const db = require('../db');
  const id = req.params.id;
  const sql = 'SELECT gambar FROM kelas WHERE id = ?';

  db.con.query(sql, [id], (err, results) => {
    if (err) return res.status(500).send('Error server');
    if (results.length === 0 || !results[0].gambar) return res.status(404).send('Gambar tidak ditemukan');

    res.setHeader('Content-Type', 'image/jpeg');
    res.send(results[0].gambar);
  });
});

// Kelola kelas
app.get('/kelola', (req, res) => {
  if (!req.session.user) return res.redirect('/');
      GetKelasAslab(req, res);
});

// Katalog kelas untuk mahasiswa
app.get('/mahasiswa', (req, res) => {
  GetAllKelasPraktikan((err, dataKelas) => {
    if (err) return res.status(500).send('Gagal mengambil data kelas.');
    res.render('mahasiswa/katalogKelas', { judul: 'Katalog Kelas', kelas: dataKelas });
  });
});

// Kelas saya untuk mahasiswa
app.get('/mahasiswa/kelasSaya', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  GetKelasSaya(req.session.user.id, req, res, (err, result) => {
    if (err) return res.status(500).send('Gagal mengambil kelas saya.');
    res.render('mahasiswa/kelasSaya', {
      judul: 'Kelas Saya',
      kelas: result,
      message: res.locals.message,
    });
  });
});

app.get('/lihatKelas/:id', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      req.flash('message', 'Anda harus login dulu');
      return res.redirect('/');
    }

    const id_kelas = req.params.id;

    const kelasRes = await fetch(`http://localhost:3000/GetKelas`);
    if (!kelasRes.ok) throw new Error('Gagal ambil kelas');

    const kelasArray = await kelasRes.json();  // parse JSON dulu

    const kelasData = kelasArray.find(k => k.id == id_kelas);
      if (!kelasData) {
      return res.status(404).send('Kelas tidak ditemukan.');
    }


    const tugasRes = await fetch(`http://localhost:3000/GetTugas${id_kelas}`);
    if (!tugasRes.ok) throw new Error('Gagal ambil tugas');

    const tugasData = await tugasRes.json();

    req.session.kelas = kelasData;
    req.session.tugas = tugasData;
    return res.render('aslab/lihatKelas', {
      judul: 'Lihat Kelas',
      kelas: kelasData,
      tugas: tugasData,
      user: req.session.user
    });

  } catch (err) {
    console.error('Error lihat kelas:', err);
    req.flash('message', 'Terjadi kesalahan saat ambil data kelas/tugas');
    return res.redirect('/kelola');
  }
});

app.post('/tambahTugas', upload.single('example'), (req, res) => {
  AddTugas(req, res);
});

app.post('/tambahkelas', upload.single('image'), (req, res) => {
  AddKelas(req, res);
});
app.get('/tambahTugas/:id_kelas', (req, res) => {
  const userId = req.session.user?.id;
    if (!userId) {
      req.flash('message', 'Anda harus login dulu');
      return res.redirect('/');
    }
  var dataaslab =[]
  res.render('aslab/tambahTugas', { judul: 'Tambah Kelas',
      aslab : dataaslab,
      id_kelas : req.session.kelas?.id,
          t : []

   });
});
app.post('/aslab/lihatTugas/:id',(req,res) => {
  SetNilai(req,res);
})
app.get('/lihatTugas/:id',async (req, res) => {
    try {
    const userId = req.session.user?.id;
    if (!userId) {
      req.flash('message', 'Anda harus login dulu');
      return res.redirect('/');
    }

    const TugasRes = await fetch(`http://localhost:3000/api/detailTugas/${req.params.id}`);
    if (!TugasRes.ok) throw new Error('Gagal ambil Tugas');

    const tugasRes = await TugasRes.json(); 
        console.log(tugasRes);

      req.session.LihatTugas= tugasRes;
    res.render('aslab/lihatTugas', {
      judul: 'Lihat Tugas',
      task : tugasRes,
      id_task: req.params.id,
      errors: {}
  });


  } catch (err) {
    console.error('Error lihat kelas:', err);
    req.flash('message', 'Terjadi kesalahan saat ambil data kelas/tugas');
    return res.redirect('/kelola');
  }
});
app.get('/detailTugas/:id_kelas/:id_tugas', async (req, res) => {

   try {
    const userId = req.session.user?.id;
    if (!userId) {
      req.flash('message', 'Anda harus login dulu');
      return res.redirect('/');
    }

    console.log(req.params.id_tugas);

    const TugasRes = await fetch(`http://localhost:3000/api/LihatTugas/${req.params.id_tugas}`);
    if (!TugasRes.ok) throw new Error('Gagal ambil kelas');

    const tugasRes = await TugasRes.json(); 
      req.session.detailTugas= tugasRes;
    res.render('aslab/detailTugas', {
    judul: 'Daftar Pengumpulan Tugas',
    task : tugasRes
  });


  } catch (err) {
    console.error('Error lihat kelas:', err);
    req.flash('message', 'Terjadi kesalahan saat ambil data kelas/tugas');
    return res.redirect('/kelola');
  }
});
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
