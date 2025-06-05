const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const { body, validationResult } = require('express-validator');

const flash = require('connect-flash');
const { AddUser,Login } = require('./Controller/UserController');
const multer = require('multer');
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });
const db = require('./db');
const AWS = require('aws-sdk');
const fs = require('fs');

AWS.config.update({
  accessKeyId: '',
  secretAccessKey: '',
  region: 'ap-southeast-2'
});
const s3 = new AWS.S3();
const uploads_file = multer({ dest: 'uploads/' });


const { AddKelas ,GetKelasSaya ,GetKelasClick,GetAllKelas ,IkutiKelas,GetKelasMahasiswa,GetAllKelasPraktikan,GetKelas} = require('./Controller/KelasController');
const { GetTugas,PengumpulanTugas,GetTugasByID,GetTask,GetPengumpulanTugasAdmin ,AddTugas,GetPengumpulanTugas,SetNilai} = require('./Controller/TugasController');

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
  res.locals.message = flashMsg.length > 0 ? flashMsg[0] : null;
  res.locals.errors = req.flash('errors')[0] || {};
  res.locals.formData = req.flash('formData')[0] || {};
  res.locals.token = req.flash('token')[0] || '';

  // Cek role user dari session
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

  res.locals.user = req.session.user || {
    nama: 'Guest',
    foto: 'default.jpg',
  };

  next();
});

var globalkelas = []

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'View'));

// ================= ROUTES =================
app.post('/aslab/tambahTugas/:id', upload.single('example'), [ body('title').notEmpty().withMessage('Judul tidak boleh kosong'),
body('description').notEmpty().withMessage('Deskripsi tidak boleh kosong'),
body('bts_waktu').notEmpty().withMessage('Tenggang waktu tidak boleh kosong')],(req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render('aslab/tambahTugas', {
      judul: 'Tambah Tugas',
      id_kelas: req.params.id,
      errors: errors.mapped(),
      formData: req.body
    });
  }
  const fileContent = req.file.buffer;
  const params = {
    Bucket: 'ramzisyuhadabucket12',
    Key: req.file.originalname,
    Body: fileContent
  };

  s3.upload(params, function(err, data) {
    if (err) {
      return res.status(500).send("Error saat mengunggah file");
    }

    const linkfileaws = data.Location;
    AddTugas(linkfileaws,req,res);

  });
});

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
app.post('/mahasiswa/tambahTugas', (req, res) => {
  IkutiKelas(id,idkelass,req, res);
});

app.post('/tambahkelas', upload.single('image') ,(req, res) => {
  AddKelas(id,req, res);
});

var id ;
app.post('/auth' , (req,res) => {
  Login(req,res,(err ,data)  => {
    id = data.id;

  });
})
console.log(id);
app.get('/kelas/image/:id', (req, res) => {
  const id = req.params.id;

  const sql = 'SELECT gambar FROM kelas WHERE id = ?';
  db.con.query(sql, 
    [id], (err, results) => {
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
  Login(req, res, (err, success) => {
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
  var dataaslab =[]
  // GetKelasMahasiswa(idkelas,(err, dataKelas) => {
  //   dataaslab = dataKelas
  // });
  res.render('aslab/tambahKelas', { judul: 'Tambah Kelas',
      aslab : dataaslab
   });
});

app.get('/tambahTugas/:id_kelas', (req, res) => {
  const id_kelas = req.params.id_kelas;
  res.render('aslab/tambahTugas', {
    judul: 'Tambah Tugas',
    id_kelas: id_kelas,
    t : []
  });

});

  
app.get('/mahasiswa/tambahKelas' , (req,res) => {
  res.render('mahasiswa/tambahKelas', {
    judul : "Tambah Kelas",
    kelas  : globalkelas,
    aslab : []
  });

});
var idkelasglobal;
app.get('/mahasiswa/tambahKelas/:idkelas', (req, res) => {
  const idkelas = req.params.idkelas;
 // const userId = req.session.userId;
 req.session.idkelas = req.params.idkelas;

 idkelasglobal = idkelas;
  if (!id) {
    return res.redirect('/');
  }

  // Pertama ambil info aslab-nya dulu
  GetKelasMahasiswa(idkelas, (err, dataAslab) => {
    if (err) {
      console.error('Gagal ambil data aslab:', err);
      return res.status(500).send('Gagal mengambil data aslab.');
    }

    
    // IkutiKelas(id,idkelas, req, res, (err, dataKelas) => {
    //   if (err) {
    //     console.error('Gagal ambil data kelas:', err);
    //     return res.status(500).send('Gagal mengambil data kelas.');
    //   }
    //   IkutiKelas(id, idkelas, req, res); // Di dalam ini sudah ada res.redirect

    // });
  });
});
var idkelass;

var gambar;
app.get('/mahasiswa/ikutiKelas/:idkelas', (req, res) => {
  const idkelas = req.params.idkelas;
  idkelass = idkelas;

  if (!id) {
    return res.redirect('/');
  }

  GetKelasMahasiswa(idkelas, (err, dataAslab) => {
    if (err) {
      console.error('Gagal ambil data aslab:', err);
      return res.status(500).send('Gagal mengambil data aslab.');
    }
    console.log(dataAslab);
    res.render('mahasiswa/tambahKelas', {
      judul: 'Tambah Kelas',
      kelas: dataAslab,
      aslab: dataAslab ,
      id_kelas: idkelass // <-- kirim variabel id_kelas di sini
      // atau sesuaikan sesuai data
    });
  });
});



// Kelola Kelas
app.get('/kelola', (req, res) => {
  
  GetAllKelas(id,(err, dataKelas) => {
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
app.get('/gambarAslab/:id', (req,res) => {
  const id = req.params.id; // ambil id dari url param

  const sql = 'SELECT gambar FROM kelas WHERE id = ?';
  db.con.query(sql, [id], (err, result) => {
    if (err || result.length === 0) {
      return res.status(404).send('Gambar tidak ditemukan');
    }
    console.log("Hello");
    res.setHeader('Content-Type', 'image/jpeg'); // sesuaikan jika PNG
    res.send(result[0].gambar);
  });
})
app.get('/kelas/image/:id', (req, res) => {
  const id = req.params.id;

  const sql = 'SELECT gambar FROM kelas WHERE id = ?';
  db.con.query(sql, [id], (err, result) => {
    if (err || result.length === 0) {
      return res.status(404).send('Gambar tidak ditemukan');
    }

    res.setHeader('Content-Type', 'image/jpeg'); // sesuaikan jika PNG
    res.send(result[0].gambar);
  });
});

app.get('/lihatKelas/:id', (req, res) => {
  const idKelas = req.params.id;

  GetKelas((err, dataKelas) => {
    if (err) {
      console.error('Gagal ambil data kelas:', err);
      return res.status(500).send('Gagal mengambil data kelas.');
    }

    const kelas = dataKelas.find(k => k.id == idKelas);

    if (!kelas) {
      return res.status(404).send('Kelas tidak ditemukan.');
    }

    GetTugas(idKelas, (err, dataTugas) => {
      
      if (err) {
        console.error('Gagal ambil tugas:', err);
        return res.status(500).send('Gagal mengambil data tugas.');
      }

      res.render('aslab/lihatKelas', {
        judul: 'Kelola Kelas',
        kelas: kelas,
        tugas: dataTugas
      });
      

    });
  });
});


// Detail Kelas (untuk Aslab)
// app.get('/lihatKelas/:id', (req, res) => {
//   const kelas = {
//     id: req.params.id,
//     nama_kelas: 'Pemrograman Web',
//     image: 'kelasweb.jpg'
//   };

//   const tugas = [
//     { id: 1, Title: 'Tugas 1', batas_waktu: 1716643200 },
//     { id: 2, Title: 'Tugas 2', batas_waktu: 1717003200 }
//   ];

  
//   res.render('aslab/lihatKelas', {
//     judul: 'Kelola Kelas',
//     kelas,
//     tugas
//   });
// });


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
  GetPengumpulanTugas(req,res,(err,datatugas) => {
    if (err) {
      console.error('Gagal ambil tugas:', err);
      return res.status(500).send('Gagal mengambil data tugas.');
    }
  res.render('aslab/detailTugas', {
    judul: 'Daftar Pengumpulan Tugas',
    task : datatugas
  });
  })
});

app.post('/aslab/lihatTugas/:id',(req,res) => {
    SetNilai(req ,res);
})
app.get('/lihatTugas/:id_task', (req, res) => {
  // const task = {
  //   nama: 'Tugas 1',
  //   file: 'tugas1.pdf',
  //   nilai: 0
  // };
  const id_task = req.params.id_task;
  GetPengumpulanTugasAdmin(req,res ,(err,DataTugas) => {
    
    res.render('aslab/lihatTugas', {
      judul: 'Lihat Tugas',
      task : DataTugas,
      id_task,
      errors: {}
    });
  })
  
});

// Mahasiswa - Katalog Kelas
app.get('/mahasiswa', (req, res) => {

  GetAllKelasPraktikan((err, dataKelas) => {
    if (err) {
      console.error('Gagal ambil data:', err);
      return res.status(500).send('Gagal mengambil data kelas dari database.');
    }
    
    res.render('mahasiswa/katalogKelas', {
      judul: 'Katalog Kelas',
      kelas : dataKelas,
     
    });
  
  
  });
});


app.get('/mahasiswa/kelasSaya', (req, res) => {
  GetKelasSaya(id,req,res ,(err,result) => {
    res.render('mahasiswa/kelasSaya', {
      judul: 'Kelas Saya',
      kelas: result,
      message: req.flash('message','Berhasil Ditambahkan')
    });
  })
  
});
//Mahasiswa - Post Tugas 
app.post('/mahasiswa/kumpulTugas',upload.single('file'), (req,res) => {
 
  const fileContent = req.file.buffer;
  const params = {
    Bucket: 'ramzisyuhadabucket12',
    Key: req.file.originalname,
    Body: fileContent
  };

  s3.upload(params, function(err, data) {
    if (err) {
      return res.status(500).send("Error saat mengunggah file");
    }

    const linkfileaws = data.Location;
    PengumpulanTugas(id,linkfileaws,req,res);

  });
})
//Mahasiswa - Detail Tugas
app.get('/mahasiswa/detailTugas/:id' , (req,res) => {
  const tugasId = req.params.id;
  GetTugasByID(tugasId, (err,DataTugas) => {
    GetTask(id,tugasId,(err,DataTask) => {
      res.render('mahasiswa/detailTugas', {
        judul : "Tugas Saya",
        tugas : DataTugas,
        task : DataTask
      });
    })
  })
})
// Mahasiswa - Detail Kelas
app.get('/mahasiswa/detailKelas/:id', (req, res) => {
  const kelasId = req.params.id;

  GetKelasClick(kelasId,  (err, DataKelas) => {
    if (err) {
      return res.status(500).send('Gagal mengambil data kelas');
    }

    GetTugas(kelasId, (err, DataTugas) => {
      if (err) {
        return res.status(500).send('Gagal mengambil data tugas');
      }

      console.log("Parameter ini adalah : " + JSON.stringify(DataKelas));

      res.render('mahasiswa/detailKelas', {
        judul: 'Detail Kelas',
        kelas: DataKelas,
        tugas: DataTugas,
        message: req.flash('message')
      });
    });
  });
});

// ================= END ROUTES =================

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
