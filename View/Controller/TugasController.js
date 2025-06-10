const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const http = require('http');


async function GetPengumpulanTugas(req,res) {
    try {
      const userId = req.session.user?.id;
      if (!userId) {
        req.flash('message', 'Anda harus login dulu');
        return res.redirect('/');
      }

      // Pastikan URL ada '/' sebelum userId
      const response = await fetch(`http://localhost:3000/GetDetailTugas/${req.params.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch {}
        req.flash('message', errorData.message || 'Gagal mengambil data Pengumpulan Tugas');
        return res.redirect('/');
      }

      const kelasData = await response.json();
      console.log("Pengumpulan Tugas : ", kelasData);
      req.session.PengumpulanTugas = kelasData;
    return res.redirect(`/lihatKelas/${req.params.id}`);

    } catch (err) {
console.error('Error ambil kelas:', err);
    req.flash('message', 'Gagal mengambil data kelas karena error server');
    return res.redirect('/kelola');   
  
  }
}
async function GetTugas(req,res){
      try {
      const userId = req.session.user?.id;
      if (!userId) {
        req.flash('message', 'Anda harus login dulu');
        return res.redirect('/');
      }

      // Pastikan URL ada '/' sebelum userId
      const response = await fetch(`http://localhost:3000/GetTugas${req.params.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch {}
        req.flash('message', errorData.message || 'Gagal mengambil data Tugas');
        return res.redirect('/');
      }

      const kelasData = await response.json();
      req.session.tugas = kelasData;
    return res.redirect(`/lihatKelas/${req.params.id}`);

    } catch (err) {
console.error('Error ambil kelas:', err);
    req.flash('message', 'Gagal mengambil data kelas karena error server');
    return res.redirect('/kelola');   
  
  }
}

function AddTugas(req, res) {
  const userId = req.session.user?.id;
  if (!userId) {
    req.flash('message', 'Anda harus login terlebih dahulu');
    return res.redirect('/');
  }

  const form = new FormData();
  form.append('nama', req.body.title);
  form.append('deskripsi', req.body.description);
  form.append('bts_waktu', req.body.bts_waktu);
  form.append('id_kelas',req.session.kelas?.id);

  if (req.file) {
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
  }

form.submit('http://localhost:3000/api/tambahTugas', (err, response) => {
  if (err) {
    console.error('Terjadi error saat menambahkan tugas:', err);
    if (!res.headersSent) {
      req.flash('message', 'Terjadi kesalahan pada server saat menambahkan tugas');
      return res.redirect('/kelola');
    }
    return;
  }

  let data = '';
  response.on('data', chunk => data += chunk);

  response.on('end', () => {
    if (res.headersSent) return; // Cegah multiple response

    try {
      const parsedData = JSON.parse(data);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        req.session.tugas = parsedData;
        req.flash('message', 'Berhasil Menambahkan Tugas');
      } else {
        req.flash('message', parsedData.message || 'Gagal menambahkan tugas');
      }
    } catch (e) {
      req.flash('message', 'Gagal memproses respons dari server');
    }

    return res.redirect('/kelola');
  });

  response.on('error', (e) => {
    console.error('Response error:', e);
    if (!res.headersSent) {
      req.flash('message', 'Gagal menghubungi server tugas');
      return res.redirect('/kelola');
    }
  });
});

}
function PengumpulanTugas(req, res) {
  const userId = req.session.user?.id;
  if (!userId) {
    req.flash('message', 'Anda harus login terlebih dahulu');
    return res.redirect('/');
  }

  const form = new FormData();
  form.append('id', req.body.id);
  form.append('mahasiswa_id', req.session.user?.id);
  if (req.file) {
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
  }

form.submit('http://localhost:3000/api/NgumpulTugas', (err, response) => {
  if (err) {
    console.error('Terjadi error saat menambahkan tugas:', err);
    if (!res.headersSent) {
      req.flash('message', 'Terjadi kesalahan pada server saat menambahkan tugas');
      return res.redirect('/kelola');
    }
    return;
  }

  let data = '';
  response.on('data', chunk => data += chunk);

  response.on('end', () => {
    if (res.headersSent) return; // Cegah multiple response

    try {
      const parsedData = JSON.parse(data);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        req.session.tugas = parsedData;
        req.flash('message', 'Berhasil mengumpulkan Tugas');
      } else {
        req.flash('message', parsedData.message || 'Gagal menambahkan tugas');
      }
    } catch (e) {
      req.flash('message', 'Gagal memproses respons dari server');
    }

    return res.redirect('/kelola');
  });

  response.on('error', (e) => {
    console.error('Response error:', e);
    if (!res.headersSent) {
      req.flash('message', 'Gagal menghubungi server tugas');
      return res.redirect('/kelola');
    }
  });
});
}

function SetNilai(req, res) {
  const userId = req.session.user?.id;
  if (!userId) {
    req.flash('message', 'Anda harus login terlebih dahulu');
    return res.redirect('/');
  }

  const postData = JSON.stringify({
    nilai: req.body.nilai,
    id : req.params.id
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/SetNilai',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const request = http.request(options, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      if (res.headersSent) return;

      try {
        const parsedData = JSON.parse(data);

        if (response.statusCode >= 200 && response.statusCode < 300) {
          req.session.tugas = parsedData;
          req.flash('message', 'Berhasil Mengubah Nilai');
        } else {
          req.flash('message', parsedData.message || 'Gagal menambahkan tugas');
        }
      } catch (e) {
        req.flash('message', 'Gagal memproses respons dari server');
      }

      return res.redirect('/kelola');
    });
  });

  request.on('error', (err) => {
    console.error('Terjadi error saat menghubungi server:', err);
    if (!res.headersSent) {
      req.flash('message', 'Gagal menghubungi server tugas');
      return res.redirect('/kelola');
    }
  });

  request.write(postData);
  request.end();
}


async function IkutiKelas(req,res,callback){
  try {
    const response = await fetch('http://localhost:3000/api/IkutiKelas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token : req.body.token , mahasiswa_id : req.session.user?.id  , idkelas : req.session.kelas?.id })
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {};
      }
      req.flash('message', errorData.message || 'Login gagal');
      return res.redirect('/');
    }
      const message = await response.json();

      req.flash('message', message.message);

   
    return res.redirect('/mahasiswa/Kelas');



  } catch (err) {
    console.error('Login error:', err);
    req.flash('message', 'Login gagal karena error server');
    return res.redirect('/');
  }

}


module.exports = { GetTugas ,AddTugas,SetNilai,PengumpulanTugas};
