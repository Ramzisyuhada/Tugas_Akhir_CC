const fetch = require('node-fetch');

const { GetTugas } = require('./TugasController');
const FormData  = require('form-data');  


async function GetKelasAslab(req, res) {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      req.flash('message', 'Anda harus login dulu');
      return res.redirect('/');
    }

    // Pastikan URL ada '/' sebelum userId
    const response = await fetch(`http://localhost:3000/GetAllKelasByAslab/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch {}
      req.flash('message', errorData.message || 'Gagal mengambil data kelas');
      return res.redirect('/');
    }

    const kelasData = await response.json();

    req.session.kelasaslab = kelasData;

    // Render halaman kelola dan kirim data kelas ke template
    return res.render('aslab/kelola', { judul: 'Kelola Kelas', kelas: kelasData, user: req.session.user });

  } catch (err) {
    console.error('Error ambil kelas:', err);
    req.flash('message', 'Gagal mengambil data kelas karena error server');
    return res.redirect('/kelola');
  }
}

async function GetKelas(id,req,res,callback){
    try {
    const userId = req.session.user?.id;
    if (!userId) {
      req.flash('message', 'Anda harus login dulu');
      return res.redirect('/');
    }

    const response = await fetch(`http://localhost:3000/GetKelas`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch {}
      req.flash('message', errorData.message || 'Gagal mengambil data kelas');
      return res.redirect('/');
    }

    const kelasData = await response.json();

    req.session.kelas = kelasData;
    GetTugas(req,res);

  } catch (err) {
    console.error('Error ambil kelas:', err);
    
  }
}

function AddKelas(req, res) {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      req.flash('message', 'Anda harus login terlebih dahulu');
      return res.redirect('/');
    }

    const form = new FormData();
    form.append('class_name', req.body.class_name);
    form.append('description', req.body.description);
    form.append('token', req.body.token);
    form.append('id_user', userId);

    if (req.file) {
      // Sesuaikan field 'image' karena multer pakai upload.single('image')
      form.append('image', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });
    }

    form.submit('http://localhost:3000/api/tambahkelas', (err, response) => {
      if (err) {
        console.error('Terjadi error saat menambahkan kelas:', err);
        if (!res.headersSent) {
          req.flash('message', 'Terjadi kesalahan pada server saat menambahkan kelas');
          return res.redirect('/kelola');
        }
        return;
      }

      let data = '';
      response.on('data', chunk => data += chunk);

      response.on('end', () => {
        if (res.headersSent) return;

        try {
          const parsedData = JSON.parse(data);

          if (response.statusCode >= 200 && response.statusCode < 300) {
            req.session.kelas = parsedData;
            req.flash('message', 'Berhasil Menambahkan Kelas');
          } else {
            req.flash('message', parsedData.message || 'Gagal menambahkan kelas');
          }
        } catch (e) {
          console.error('Gagal parsing response:', e);
          req.flash('message', 'Gagal memproses respons dari server');
        }

        return res.redirect('/kelola');
      });

      response.on('error', (e) => {
        console.error('Response error:', e);
        if (!res.headersSent) {
          req.flash('message', 'Gagal menghubungi server kelas');
          return res.redirect('/kelola');
        }
      });
    });
  } catch (error) {
    console.error('Error dalam AddKelas:', error);
    if (!res.headersSent) {
      req.flash('message', 'Terjadi kesalahan server');
      return res.redirect('/kelola');
    }
  }
}

module.exports = { GetKelasAslab ,GetKelas,AddKelas};
