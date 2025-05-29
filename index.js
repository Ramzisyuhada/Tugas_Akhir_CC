const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const flash = require('connect-flash');
const { AddUser,Login } = require('./Controller/UserController');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const db = require('./db'); // import koneksi database

const { AddKelas , GetAllKelas } = require('./Controller/KelasController');

const app = express();

// Middleware global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'secretKey123',
  resave: false,
  saveUninitialized: false,
}));

app.use(flash());

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Global variables untuk views
app.use((req, res, next) => {
  const flashMsg = req.flash('message');
  res.locals.message = flashMsg.length > 0 ? flashMsg[0] : null;  res.locals.errors = req.flash('errors')[0] || {};
  res.locals.formData = req.flash('formData')[0] || {};
  res.locals.token = req.flash('token')[0] || '';
  res.locals.menu = [{ id: 1, menu: 'Aslab' }];
  res.locals.submenu = [
    { id: 1, menu_id: 1, title: 'Kelola Kelas', url: 'kelola', icon: 'fas fa-users', is_active: 1 },
    { id: 2, menu_id: 1, title: 'Tambah Kelas', url: 'tambahKelas', icon: 'fas fa-plus', is_active: 1 },
  ];
  res.locals.user = {
    nama: 'Budi Santoso',
    foto: 'budi.jpg'
  };
  next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'View'));

// ================= ROUTES =================

// Login Page
app.get('/', (req, res) => {
  res.render('Auth/login', {
    errors: {},
    nim: '',
    message: res.locals.message

  });
});


app.post('/Auth/registrasi', (req, res) => {
  AddUser(req, res);
});
app.post('/tambahkelas', upload.single('image'),(req, res) => {
  AddKelas(req, res);
});
app.post('/auth' , (req,res) => {
  Login(req,res);
})

app.get('/kelas/image/:id', (req, res) => {
  const id = req.params.id;

  const sql = 'SELECT gambar FROM kelas WHERE id = ?';
  db.con.query(sql, [id], (err, results) => {
    if (err) return res.status(500).send('Error server');
    if (results.length === 0) return res.status(404).send('Gambar tidak ditemukan');

    const img = results[0].gambar;
    if (!img) return res.status(404).send('Gambar tidak ditemukan');

    res.writeHead(200, {
      'Content-Type': 'image/jpeg', // sesuaikan jika gambarnya PNG atau lainnya
      'Content-Length': img.length
    });
    res.end(img);
  });
});

// Register Page
app.get('/Auth/register', (req, res) => {
  res.render('Auth/register', {
    formData: {},
    errors: {}
  });
});

// Proses Login
app.post('/login', (req, res) => {
  login(req, res, (err, success) => {
    if (err) {
      req.flash('message', err);
      return res.redirect('/');
    }
    if (success) {
      return res.redirect('/dashboard');
    }
  });
});


app.get('/dashboard', (req, res) => {
  res.render('aslab/index', { judul: 'Home' });
});


app.get('/tambahKelas', (req, res) => {
  res.render('aslab/tambahKelas', { judul: 'Tambah Kelas' });
});

app.get('/tambahTugas/:id_kelas', (req, res) => {
  res.render('aslab/tambahTugas', { judul: 'Tambah Kelas' });
});

// Kelola Kelas
app.get('/kelola', (req, res) => {
  GetAllKelas((err, dataKelas) => {
    if (err) {
      console.error('Gagal ambil data:', err);
      return res.status(500).send('Gagal mengambil data kelas dari database.');
    }

    res.render('aslab/kelola', {
      judul: 'Kelola Kelas',
      kelas: dataKelas
    });
  });
});

// Detail Kelas (untuk Aslab)
app.get('/lihatKelas/:id', (req, res) => {
  const kelas = {
    id: req.params.id,
    nama_kelas: 'Pemrograman Web',
    image: 'kelasweb.jpg'
  };

  const tugas = [
    { id: 1, Title: 'Tugas 1', batas_waktu: 1716643200 },
    { id: 2, Title: 'Tugas 2', batas_waktu: 1717003200 }
  ];

  res.render('aslab/lihatKelas', {
    judul: 'Kelola Kelas',
    kelas,
    tugas
  });
});


app.get('/detailTugas/:id_kelas/:id_tugas', (req, res) => {
  const { id_kelas, id_tugas } = req.params;

  const tugas = {
    id: id_tugas,
    title: 'Tugas ' + id_tugas,
    batas_waktu: Date.now() + 86400000 // 1 hari ke depan
  };

  const task = [
    { id: 1, nama: 'Andi', file: 'Tugas1_Andi.pdf', nilai: 0 },
    { id: 2, nama: 'Budi', file: 'Tugas1_Budi.pdf', nilai: 85 }
  ];

  res.render('aslab/detailTugas', {
    judul: 'Daftar Pengumpulan Tugas',
    tugas,
    task,
    id_kelas
  });
});


app.get('/lihatTugas/:id_task', (req, res) => {
  const task = {
    nama: 'Tugas 1',
    file: 'tugas1.pdf',
    nilai: 0
  };
  const id_task = req.params.id_task;

  res.render('aslab/lihatTugas', {
    judul: 'Lihat Tugas',
    task,
    id_task,
    errors: {}
  });
});

// Mahasiswa - Katalog Kelas
app.get('/mahasiswa', (req, res) => {
  const kelas = [
    { id: 1, nama_kelas: 'Kelas A', image: 'kelasA.jpg', deskripsi: 'Belajar dasar pemrograman' },
    { id: 2, nama_kelas: 'Kelas B', image: 'kelasB.jpg', deskripsi: 'Lanjutan pemrograman' }
  ];

  res.render('mahasiswa/katalogKelas', {
    judul: 'Katalog Kelas',
    kelas
  });
});

// Mahasiswa - Kelas Saya
app.get('/mahasiswa/kelasSaya', (req, res) => {
  const kelasSaya = req.session.kelasSaya || [];
  const flashMessage = req.flash('message');

  res.render('mahasiswa/kelasSaya', {
    judul: 'Kelas Saya',
    kelas: kelasSaya,
    message: flashMessage.length > 0 ? flashMessage[0] : ''
  });
});

// Mahasiswa - Detail Kelas
app.get('/mahasiswa/detailKelas/:id', (req, res) => {
  const kelasId = req.params.id;

  const kelas = {
    id: kelasId,
    nama_kelas: 'Pemrograman Web',
    image: 'web.png'
  };

  const tugas = [
    {
      id: 1,
      Title: 'Tugas HTML',
      batas_waktu: Date.now() + 86400000
    }
  ];

  res.render('mahasiswa/detailKelas', {
    judul: 'Detail Kelas',
    kelas,
    tugas,
    message: req.flash('message')
  });
});

// ================= END ROUTES =================

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
