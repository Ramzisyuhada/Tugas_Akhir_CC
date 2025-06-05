const db = require('../db'); 
const path = require('path');

function GetTask(mahasiswaId, tugasId, callback) {
    const sql = `SELECT * FROM pengumpulan_tugas WHERE mahasiswa_id = ? AND tugas_id = ?`;

    db.con.query(sql, [mahasiswaId, tugasId], (err, hasil) => {
        if (err) {
            console.error('Database error:', err);
            return callback(err, null);
        }

        if (hasil.length > 0) {
            console.log("Ada data nya");
            callback(null, hasil[0]); 
        } else {
            console.log("Tidak ada data nya");

            callback(null, null); 
        }
    });
}

function GetTugas(id_kelas, callback) {
    db.con.query('SELECT id, judul as Title , tenggat as batas_waktu FROM tugas WHERE kelas_id = ?', [id_kelas], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return callback(err, null); // kirim error ke callback
        }

        callback(null, result); // kirim hasil ke callback
    });
}

function PengumpulanTugas(mahasiswa_id,link,req,res){
    const sql = `INSERT INTO pengumpulan_tugas (tugas_id,mahasiswa_id,nilai,link) VALUES (?,?,?,?)`;
    db.con.query(sql, [req.body.id,mahasiswa_id,0,link], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return callback(err, null); // kirim error ke callback
        }

        res.redirect(`/mahasiswa/detailTugas/${req.body.id}`);   
    
    });
}
function GetTugasByID(id_kelas, callback) {
    db.con.query('SELECT id as id, judul as Title , tenggat as batas_waktu,deskripsi as Description FROM tugas WHERE id = ?', [id_kelas], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return callback(err, null); // kirim error ke callback
        }

        callback(null, result[0]); // kirim hasil ke callback
    });
}



function GetPengumpulanTugasAdmin(req,res,callback){
    const {id_task} = req.params;
    const sql = `SELECT 
    pengumpulan_tugas.id, 
    pengumpulan_tugas.file_pengumpulan AS nama_file,
    pengumpulan_tugas.link AS file,

    pengumpulan_tugas.nilai AS nilai,
    mahasiswa.nama AS nama
FROM pengumpulan_tugas
LEFT JOIN tugas ON pengumpulan_tugas.tugas_id = tugas.id
LEFT JOIN kelas ON tugas.kelas_id = kelas.id
LEFT JOIN mahasiswa ON kelas.aslab_id = mahasiswa.id
WHERE pengumpulan_tugas.id = ?
    `;

    db.con.query(sql, [id_task], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return callback(err, null); 
        }

        callback(null, result[0]); 
    });
}

function SetNilai(req, res) {
    const { nilai } = req.body;
    const pengumpulanTugasId = req.params.id;

    const updateSQL = `UPDATE pengumpulan_tugas SET nilai = ? WHERE id = ?`;
    db.con.query(updateSQL, [nilai, pengumpulanTugasId], function (err, updateResult) {
        if (err) {
            console.error('Error saat mengupdate nilai:', err);
            return res.status(500).json({ error: 'Gagal mengupdate nilai' });
        }

        // SELECT untuk ambil data terbaru
        const selectSQL = `SELECT * FROM pengumpulan_tugas WHERE id = ?`;
        db.con.query(selectSQL, [pengumpulanTugasId], function (err2, rows) {
            if (err2 || rows.length === 0) {
                console.error('Error saat mengambil data setelah update:', err2);
                return res.status(500).json({ error: 'Gagal mengambil data setelah update' });
            }

            const updatedData = rows[0]; // data yang sudah diupdate

            req.flash('message', 'Nilai berhasil diubah!');
            res.redirect(`/detailTugas/${updatedData.kelas_id}/${updatedData.tugas_id}`);
        });
    });
}



function GetPengumpulanTugas(req,res,callback){
    const sql = `SELECT 
    pengumpulan_tugas.id, 
    pengumpulan_tugas.file_pengumpulan AS file,
    pengumpulan_tugas.nilai AS nilai,
    mahasiswa.nama AS nama
FROM pengumpulan_tugas
LEFT JOIN tugas ON pengumpulan_tugas.tugas_id = tugas.id
LEFT JOIN kelas ON tugas.kelas_id = kelas.id
LEFT JOIN mahasiswa ON kelas.aslab_id = mahasiswa.id
WHERE pengumpulan_tugas.tugas_id = ?
    `;
    db.con.query(sql, [req.params.id_tugas],function (err, result) {
        if (err) {
          console.error('Error saat query GetKelasMahasiswa:', err);
          return callback(err, null); // Jangan pakai res di sini
        }
        callback(null, result); 
      });
}
function AddTugas(linkfile,req,res){
    const sql = 'INSERT INTO tugas (judul, kelas_id, tenggat, file, deskripsi) VALUES (?, ?, ?, ?, ?)';
    const values = [
        req.body.title,
        req.params.id ,       // judul
        req.body.bts_waktu,    
        linkfile,              
        req.body.description   
      ];   
    db.con.query(sql,values , function (err,result) {
        if (err) {
            console.error(err);
            return res.status(500).send('Gagal menyimpan data');
          }

          req.flash('message', 'Tugas Berhasil Ditambahkan!');
          res.redirect(`/lihatKelas/${req.params.id}`);
        })
}
module.exports = {
    GetTugas,GetTugasByID,AddTugas,GetPengumpulanTugas,SetNilai,GetPengumpulanTugasAdmin,GetTask,PengumpulanTugas
};
