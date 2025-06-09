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
app.use(express.static(path.join(__dirname, './View/Public')));

// Global variables untuk views
app.use((req, res, next) => {
  const flashMsg = req.flash('message');
  res.locals.message = flashMsg.length > 0 ? flashMsg[0] : null;
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

  res.locals.user = req.session.user || {
    nama: 'Guest',
    foto: 'default.jpg',
  };

  next();
});


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'View'));

// ================= ROUTES =================


app.post('/api/tambahkelas' , upload.single('image'),(req,res) => {
    AddKelas(req,res);
});
app.get('/api/GetDetailTugas/:id' , (req,res) => {
  GetPengumpulanTugas(req,res,(err , data)  => {
        res.json(data);
  })
});

app.get('/api/LihatTugas/:id' , (req,res) => {
  GetPengumpulanTugas(req,res,(err,data) => {
            res.json(data);
  })
});
app.post('/api/SetNilai',(req,res) => {
  console.log('Nilai:', req.body.nilai); // Harusnya sekarang muncul
   SetNilai(req,res);
})
app.get('/api/detailTugas/:id',(req,res) => {
  GetPengumpulanTugasAdmin(req,res ,(err,data) => {
      res.json(data);
  })
})
app.post('/api/tambahTugas', upload.single('file') ,(req,res) => {
  

  res.json({ message: 'Data diterima', data: req.body });  

 
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

app.post('/Auth/registrasi', (req, res) => {
  AddUser(req, res);
});
app.post('/mahasiswa/tambahTugas', (req, res) => {
  IkutiKelas(id,idkelass,req, res);
});
app.post('/tambahkelas', upload.single('image') ,(req, res) => {
  AddKelas(id,req, res);
});
app.post('/auth' , (req,res) => {
  Login(req, res);    
})

app.get('/GetAllKelasByAslab/:id',(req,res) => {
  GetAllKelas(req.params.id, (err, kelas) => {
    if (err) {
      req.flash('message', 'Gagal mengambil data kelas');
    }

    req.session.kelas = kelas;

    res.json(kelas);
});

})
app.get('/GetKelas',(req,res) => {
    GetKelas((err , DataKelas) => {
        res.json(DataKelas);
    })
})
app.get('/GetTugas:id', (req, res) => {
    GetTugas(req.params.id, (err, DataTugas) => {
        if (err) {
            console.error('Error di GetTugas:', err);
            return res.status(500).json({ message: 'Gagal mengambil data tugas' });
        }
        res.json(DataTugas);
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



app.post('/aslab/lihatTugas/:id',(req,res) => {
    SetNilai(req ,res);
})



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

// Mahasiswa - Detail Kelas

// ================= END ROUTES =================

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
