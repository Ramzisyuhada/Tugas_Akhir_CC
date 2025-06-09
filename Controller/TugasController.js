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

    
    });
}
function GetTugasByID(req,res, callback) {
    db.con.query('SELECT id as id, judul as Title , tenggat as batas_waktu,deskripsi as Description FROM tugas WHERE id = ?', [id_kelas], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return callback(err, null); // kirim error ke callback
        }

        callback(null, result[0]); // kirim hasil ke callback
    });
}



function GetPengumpulanTugasAdmin(req,res,callback){
    const {id} = req.params;
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

    db.con.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return callback(err, null); 
        }

        callback(null, result[0]); 
    });
}

function SetNilai(req, res) {
    const { nilai } = req.body;
    const pengumpulanTugasId = req.body.id;
    console.log("Id : ",pengumpulanTugasId)
    const updateSQL = `UPDATE pengumpulan_tugas SET nilai = ? WHERE id = ?`;
    db.con.query(updateSQL, [nilai, pengumpulanTugasId], function (err, updateResult) {
        if (err) {
            console.error('Error saat mengupdate nilai:', err);
            return res.status(500).json({ error: 'Gagal mengupdate nilai' });
        }

                return res.status(200).json({ message: 'Nilai berhasil diperbarui' });

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
    db.con.query(sql, [req.params.id],function (err, result) {
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
        req.body.nama,
        req.body.id_kelas ,       // judul
        req.body.bts_waktu,    
        linkfile,              
        req.body.deskripsi   
      ];   
    db.con.query(sql,values , function (err,result) {
        if (err) {
            console.error(err);
            return res.status(500).send('Gagal menyimpan data');
          }

        })
}
module.exports = {
    GetTugas,GetTugasByID,AddTugas,GetPengumpulanTugas,SetNilai,GetPengumpulanTugasAdmin,GetTask,PengumpulanTugas
};
