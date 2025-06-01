const db = require('../db'); 
const path = require('path');


function GetTugas(id_kelas, callback) {
    db.con.query('SELECT * FROM tugas WHERE kelas_id = ?', [id_kelas], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return callback(err, null); // kirim error ke callback
        }

        callback(null, result); // kirim hasil ke callback
    });
}

module.exports = {
    GetTugas
};
