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
    const sql = `INSERT INTO kelas (namakelas, gambar, deskripsi, token,aslab_id) VALUES (?, ?, ?, ?,?)`;
    const values = [NamaKelas, imageFile.buffer, Deskripsi, Token,req.body.id_user];
  
    db.con.query(sql, values, function (err, result) {
      if (err) {
        console.error(err);
        return res.status(500).send('Gagal menyimpan data');
      }
  
      req.flash('message', 'Kelas Berhasil Ditambahkan!');
      res.redirect('/kelola');
    });
  }

  function GetKelasMahasiswa(req,res, callback) {
    const sql = `
    SELECT 
    kelas.id, 
    kelas.namakelas AS nama_kelas,
    kelas.gambar AS foto,
    mahasiswa.nama AS nama,
    kelas.token AS token
  FROM kelas
  LEFT JOIN mahasiswa ON kelas.aslab_id = mahasiswa.id
  WHERE kelas.id = ?
    `;
  
    db.con.query(sql, [req.params.id], function (err, result) {
      if (err) {
        console.error('Error saat query GetKelasMahasiswa:', err);
        return callback(err, null); // Jangan pakai res di sini
      }
      callback(null, result[0]); // hasil dikembalikan lewat callback
    });
  }
  
  function GetAllKelas(id, callback){
    const sql = `SELECT id, namakelas AS nama_kelas, gambar AS image FROM kelas WHERE aslab_id = ?`;

  db.con.query(sql,[id] ,(err, results) => {
    if (err) {
      return callback(err, null);
    }
    console.log(id);
    callback(null, results);
  });
  }
  function GetKelas( callback){
    const sql = `SELECT id, namakelas AS nama_kelas, gambar AS image  ,deskripsi as deskripsi , token as token FROM kelas`;

    db.con.query(sql ,(err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results);
    });
  }
  function GetKelasSaya(req,res,callback){
    const sql = `SELECT 
    kelas.id, 
    kelas.namakelas AS nama_kelas, 
    kelas.gambar AS image, 
    kelas.deskripsi AS deskripsi
  FROM kelas_mahasiswa
  JOIN kelas ON kelas_mahasiswa.kelas_id = kelas.id
  WHERE kelas_mahasiswa.mahasiswa_id = ?
  `;
    db.con.query(sql, [req.params.id], function (err, result) {
      if (err) {
        console.error('Error saat query GetKelasMahasiswa:', err);
        return callback(err, null); 
      }
      callback(null, result); 



    });

  }
  function IkutiKelas(req, res,callback) {
    const cekTokenQuery = 'SELECT * FROM kelas WHERE token = ?';
    db.con.query(cekTokenQuery, [req.body.token], function (err, resultToken) {
      if (err) {

        return res.status(500).send('Gagal memeriksa token.');
      }
  
      if (resultToken.length === 0) {
            return res.status(200).json( {message : 'Kode Salah.'});
      }
  
      const cekKelasQuery = 'SELECT * FROM kelas WHERE id = ?';
      db.con.query(cekKelasQuery, [req.body.idkelas], function (err, resultKelas) {
        if (err) {
            return res.status(500).send('Gagal memeriksa  kelas.');
        }
  
        
  
        const cekDuplikatQuery = 'SELECT * FROM kelas_mahasiswa WHERE mahasiswa_id = ? AND kelas_id = ?';
        db.con.query(cekDuplikatQuery, [req.body.mahasiswa_id, req.body.idkelas], function (err, resultDuplikat) {
          if (err) {
            console.error(err);
            
            return res.status(500).send('Gagal memeriksa keikutsertaan kelas.');
          }
  
          if (resultDuplikat.length > 0) {
            return res.status(200).json({ message: 'Anda sudah mengikuti kelas ini!' });
          }
  
          const insertQuery = 'INSERT INTO kelas_mahasiswa (mahasiswa_id, kelas_id, status) VALUES (?, ?, ?)';
          const values = [req.body.mahasiswa_id, req.body.idkelas, 'aktif'];
          db.con.query(insertQuery, values, function (err, resultInsert) {
            if (err) {
              console.error(err);
              return res.status(500).send('Gagal menyimpan data keikutsertaan.');
            }
  
                return res.status(200).json({ message: 'Kelas Berhasil Di Perbarui' });
          });
        });
      });
    });
  }
  function GetKelasClick(req,res,callback){
    const sql = `SELECT namakelas as nama_kelas FROM kelas WHERE id = ? `;
    db.con.query(sql ,[req.params.id], (err,result) => {
      if (err) {
        return callback(err, null);
      }
      callback(null,result[0]);
    })
  }
  

  function GetAllKelasPraktikan( callback){
    const sql = `SELECT id, namakelas AS nama_kelas, gambar AS image FROM kelas`;

  db.con.query(sql ,(err, results) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, results);
  });
  }
  
module.exports = { AddKelas,GetAllKelas,GetKelas ,GetKelasClick,IkutiKelas,GetKelasMahasiswa ,GetAllKelasPraktikan,GetKelasSaya};