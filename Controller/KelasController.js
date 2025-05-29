const db = require('../db'); // import koneksi database
const path = require('path');

function AddKelas(req, res) {
    const imageFile = req.file;
    const NamaKelas = req.body.class_name;
    const Deskripsi = req.body.description;
    const Token = req.body.token;
  
    const errors = {};
  
    // Validasi nama kelas
    if (!NamaKelas || NamaKelas.trim() === '') {
      errors.class_name = 'Nama kelas tidak boleh kosong';
    }
  
    // Validasi deskripsi
    if (!Deskripsi || Deskripsi.trim() === '') {
      errors.description = 'Deskripsi tidak boleh kosong';
    }
  
    if (!Token || Token.trim() === '') {
      errors.token = 'Token tidak boleh kosong';
    }
  
    if (!imageFile) {
      errors.image = 'Gambar harus dipilih';
    } else {
      const ext = path.extname(imageFile.originalname).toLowerCase();
      const allowedExts = ['.jpg', '.jpeg', '.png'];
      if (!allowedExts.includes(ext)) {
        errors.image = 'Format gambar harus JPG, JPEG, atau PNG';
      }
    }
  
    // Jika ada error, render ulang form dan kirim data error & input sebelumnya
    if (Object.keys(errors).length > 0) {
      return res.render('aslab/tambahKelas', {
        judul: 'Tambah Kelas',
        errors,
        formData: req.body,
        token: Token,
      });
    }
  
    // Simpan ke database jika valid, gambar sebagai BLOB dari buffer multer
    const sql = `INSERT INTO kelas (namakelas, gambar, deskripsi, token) VALUES (?, ?, ?, ?)`;
    const values = [NamaKelas, imageFile.buffer, Deskripsi, Token];
  
    db.con.query(sql, values, function (err, result) {
      if (err) {
        console.error(err);
        return res.status(500).send('Gagal menyimpan data');
      }
  
      req.flash('message', 'Kelas Berhasil Ditambahkan!');
      res.redirect('/kelola');
    });
  }

  function GetAllKelas(callback){
    const sql = `SELECT id, namakelas AS nama_kelas, gambar AS image FROM kelas`;

  db.con.query(sql, (err, results) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, results);
  });
  }
module.exports = { AddKelas,GetAllKelas  };
