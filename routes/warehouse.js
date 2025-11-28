const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Locations
router.get('/locations', async (req, res) => {
  try {
    const [locations] = await db.query(`
      SELECT wl.*, 
             b.nama_cabang as branch_name,
             uc.name as created_by_name,
             uu.name as updated_by_name,
             ud.name as deleted_by_name
      FROM warehouse_locations wl
      LEFT JOIN branches b ON wl.branch_id = b.id
      LEFT JOIN users uc ON wl.created_by = uc.id
      LEFT JOIN users uu ON wl.updated_by = uu.id
      LEFT JOIN users ud ON wl.deleted_by = ud.id
      WHERE wl.deleted_at IS NULL
      ORDER BY wl.created_at DESC
    `);
    const [branches] = await db.query('SELECT * FROM branches');
    res.render('warehouse/locations/index', { title: 'Lokasi Gudang', locations, branches, body: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get next location code
router.get('/locations/api/next-code', async (req, res) => {
  try {
    // Get the last inserted ID
    const [result] = await db.query(`
      SELECT MAX(id) as max_id FROM warehouse_locations
    `);
    
    const nextId = (result[0].max_id || 0) + 1;
    const nextCode = `WH${String(nextId).padStart(3, '0')}`;
    
    res.json({ code: nextCode, nextId: nextId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get location data for edit
router.get('/locations/:id/data', async (req, res) => {
  try {
    const [locations] = await db.query(`
      SELECT wl.*, 
             b.nama_cabang as branch_name,
             uc.name as created_by_name,
             uu.name as updated_by_name,
             ud.name as deleted_by_name
      FROM warehouse_locations wl
      LEFT JOIN branches b ON wl.branch_id = b.id
      LEFT JOIN users uc ON wl.created_by = uc.id
      LEFT JOIN users uu ON wl.updated_by = uu.id
      LEFT JOIN users ud ON wl.deleted_by = ud.id
      WHERE wl.id = ?
    `, [req.params.id]);
    res.json(locations[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/locations/create', async (req, res) => {
  try {
    const [branches] = await db.query('SELECT * FROM branches');
    res.render('warehouse/locations/create', { title: 'Tambah Lokasi Gudang', branches, body: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/locations', async (req, res) => {
  try {
    const { kode_lokasi, nama_lokasi, tipe_lokasi, alamat, telepon, pic, branch_id } = req.body;
    const userId = req.session.user ? req.session.user.id : null;
    await db.query(
      'INSERT INTO warehouse_locations (kode_lokasi, nama_lokasi, tipe_lokasi, alamat, telepon, pic, branch_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [kode_lokasi, nama_lokasi, tipe_lokasi, alamat, telepon, pic, branch_id, userId]
    );
    const isAjax = req.get('X-Requested-With') === 'XMLHttpRequest' || (req.headers.accept && req.headers.accept.includes('application/json')) || (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));
    if (isAjax) return res.json({ success: true });
    res.redirect('/warehouse/locations');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/locations/edit/:id', async (req, res) => {
  try {
    const [locations] = await db.query('SELECT * FROM warehouse_locations WHERE id = ?', [req.params.id]);
    const [branches] = await db.query('SELECT * FROM branches');
    res.render('warehouse/locations/edit', { title: 'Edit Lokasi Gudang', location: locations[0], branches, body: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/locations/update/:id', async (req, res) => {
  try {
    const { kode_lokasi, nama_lokasi, tipe_lokasi, alamat, telepon, pic, branch_id } = req.body;
    const userId = req.session.user ? req.session.user.id : null;
    await db.query(
      'UPDATE warehouse_locations SET kode_lokasi = ?, nama_lokasi = ?, tipe_lokasi = ?, alamat = ?, telepon = ?, pic = ?, branch_id = ?, updated_by = ? WHERE id = ?',
      [kode_lokasi, nama_lokasi, tipe_lokasi, alamat, telepon, pic, branch_id, userId, req.params.id]
    );
    const isAjax = req.get('X-Requested-With') === 'XMLHttpRequest' || (req.headers.accept && req.headers.accept.includes('application/json')) || (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));
    if (isAjax) return res.json({ success: true });
    res.redirect('/warehouse/locations');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/locations/delete/:id', async (req, res) => {
  try {
    const userId = req.session.user ? req.session.user.id : null;
    await db.query(
      'UPDATE warehouse_locations SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [userId, req.params.id]
    );
    const isAjax = req.get('X-Requested-With') === 'XMLHttpRequest' || (req.headers.accept && req.headers.accept.includes('application/json')) || (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));
    if (isAjax) return res.json({ success: true });
    res.redirect('/warehouse/locations');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Racks
// API: Get next rack code
router.get('/racks/api/next-code', async (req, res) => {
  try {
    // Get the last inserted ID
    const [result] = await db.query(`
      SELECT MAX(id) as max_id FROM warehouse_racks
    `);
    
    const nextId = (result[0].max_id || 0) + 1;
    const nextCode = `RAK-${String(nextId).padStart(3, '0')}`;
    
    res.json({ code: nextCode, nextId: nextId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/racks', async (req, res) => {
  try {
    const [racks] = await db.query(`
      SELECT wr.*, 
             wl.nama_lokasi,
             uc.name as created_by_name,
             uu.name as updated_by_name,
             ud.name as deleted_by_name
      FROM warehouse_racks wr
      LEFT JOIN warehouse_locations wl ON wr.warehouse_id = wl.id
      LEFT JOIN users uc ON wr.created_by = uc.id
      LEFT JOIN users uu ON wr.updated_by = uu.id
      LEFT JOIN users ud ON wr.deleted_by = ud.id
      WHERE wr.deleted_at IS NULL
      ORDER BY wr.created_at DESC
    `);
    const [warehouses] = await db.query('SELECT * FROM warehouse_locations WHERE deleted_at IS NULL');
    res.render('warehouse/racks/index', { title: 'Data Rak', racks, warehouses, body: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rack data for edit
router.get('/racks/:id/data', async (req, res) => {
  try {
    const [racks] = await db.query(`
      SELECT wr.*, 
             wl.nama_lokasi,
             uc.name as created_by_name,
             uu.name as updated_by_name,
             ud.name as deleted_by_name
      FROM warehouse_racks wr
      LEFT JOIN warehouse_locations wl ON wr.warehouse_id = wl.id
      LEFT JOIN users uc ON wr.created_by = uc.id
      LEFT JOIN users uu ON wr.updated_by = uu.id
      LEFT JOIN users ud ON wr.deleted_by = ud.id
      WHERE wr.id = ?
    `, [req.params.id]);
    res.json(racks[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/racks/create', async (req, res) => {
  try {
    const [warehouses] = await db.query('SELECT * FROM warehouse_locations');
    res.render('warehouse/racks/create', { title: 'Tambah Rak', warehouses, body: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/racks', async (req, res) => {
  try {
    const { warehouse_id, kode_rak, nama_rak, deskripsi, kapasitas_berat_kg } = req.body;
    const userId = req.session.user ? req.session.user.id : null;
    await db.query(
      'INSERT INTO warehouse_racks (warehouse_id, kode_rak, nama_rak, deskripsi, kapasitas_berat_kg, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [warehouse_id, kode_rak, nama_rak, deskripsi || null, kapasitas_berat_kg || null, userId]
    );
    const isAjax = req.get('X-Requested-With') === 'XMLHttpRequest' || (req.headers.accept && req.headers.accept.includes('application/json')) || (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));
    if (isAjax) return res.json({ success: true });
    res.redirect('/warehouse/racks');
  } catch (error) {
    console.error('Error creating rack:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/racks/edit/:id', async (req, res) => {
  try {
    const [racks] = await db.query('SELECT * FROM warehouse_racks WHERE id = ?', [req.params.id]);
    const [warehouses] = await db.query('SELECT * FROM warehouse_locations');
    res.render('warehouse/racks/edit', { title: 'Edit Rak', rack: racks[0], warehouses, body: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/racks/update/:id', async (req, res) => {
  try {
    const { warehouse_id, kode_rak, nama_rak, deskripsi, kapasitas_berat_kg } = req.body;
    const userId = req.session.user ? req.session.user.id : null;
    await db.query(
      'UPDATE warehouse_racks SET warehouse_id = ?, kode_rak = ?, nama_rak = ?, deskripsi = ?, kapasitas_berat_kg = ?, updated_by = ? WHERE id = ?',
      [warehouse_id, kode_rak, nama_rak, deskripsi || null, kapasitas_berat_kg || null, userId, req.params.id]
    );
    const isAjax = req.get('X-Requested-With') === 'XMLHttpRequest' || (req.headers.accept && req.headers.accept.includes('application/json')) || (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));
    if (isAjax) return res.json({ success: true });
    res.redirect('/warehouse/racks');
  } catch (error) {
    console.error('Error updating rack:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/racks/delete/:id', async (req, res) => {
  try {
    const userId = req.session.user ? req.session.user.id : null;
    await db.query(
      'UPDATE warehouse_racks SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [userId, req.params.id]
    );
    const isAjax = req.get('X-Requested-With') === 'XMLHttpRequest' || (req.headers.accept && req.headers.accept.includes('application/json')) || (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));
    if (isAjax) return res.json({ success: true });
    res.redirect('/warehouse/racks');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bins
// API: Get next bin code
router.get('/bins/api/next-code', async (req, res) => {
  try {
    // Get the last inserted ID
    const [result] = await db.query(`
      SELECT MAX(id) as max_id FROM warehouse_bins
    `);
    
    const nextId = (result[0].max_id || 0) + 1;
    const nextCode = `BIN-${String(nextId).padStart(3, '0')}`;
    
    res.json({ code: nextCode, nextId: nextId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/bins', async (req, res) => {
  try {
    const [bins] = await db.query(`
      SELECT wb.*, 
             wr.nama_rak, 
             wl.nama_lokasi,
             uc.name as created_by_name,
             uu.name as updated_by_name,
             ud.name as deleted_by_name
      FROM warehouse_bins wb
      LEFT JOIN warehouse_racks wr ON wb.rack_id = wr.id
      LEFT JOIN warehouse_locations wl ON wr.warehouse_id = wl.id
      LEFT JOIN users uc ON wb.created_by = uc.id
      LEFT JOIN users uu ON wb.updated_by = uu.id
      LEFT JOIN users ud ON wb.deleted_by = ud.id
      WHERE wb.deleted_at IS NULL
      ORDER BY wb.created_at DESC
    `);
    const [racks] = await db.query(`
      SELECT wr.*, wl.nama_lokasi
      FROM warehouse_racks wr
      LEFT JOIN warehouse_locations wl ON wr.warehouse_id = wl.id
      WHERE wr.deleted_at IS NULL
    `);
    res.render('warehouse/bins/index', { title: 'Data Bin', bins, racks, body: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bin data for edit
router.get('/bins/:id/data', async (req, res) => {
  try {
    const [bins] = await db.query(`
      SELECT wb.*, 
             wr.nama_rak, 
             wl.nama_lokasi,
             uc.name as created_by_name,
             uu.name as updated_by_name,
             ud.name as deleted_by_name
      FROM warehouse_bins wb
      LEFT JOIN warehouse_racks wr ON wb.rack_id = wr.id
      LEFT JOIN warehouse_locations wl ON wr.warehouse_id = wl.id
      LEFT JOIN users uc ON wb.created_by = uc.id
      LEFT JOIN users uu ON wb.updated_by = uu.id
      LEFT JOIN users ud ON wb.deleted_by = ud.id
      WHERE wb.id = ?
    `, [req.params.id]);
    res.json(bins[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/bins/create', async (req, res) => {
  try {
    const [racks] = await db.query(`
      SELECT wr.*, wl.nama_lokasi
      FROM warehouse_racks wr
      LEFT JOIN warehouse_locations wl ON wr.warehouse_id = wl.id
    `);
    res.render('warehouse/bins/create', { title: 'Tambah Bin', racks, body: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bins', async (req, res) => {
  try {
    const { rack_id, kode_bin, nama_bin, level_posisi, kolom_posisi, kapasitas_item } = req.body;
    const userId = req.session.user ? req.session.user.id : null;
    await db.query(
      'INSERT INTO warehouse_bins (rack_id, kode_bin, nama_bin, level_posisi, kolom_posisi, kapasitas_item, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [rack_id, kode_bin, nama_bin, level_posisi || null, kolom_posisi || null, kapasitas_item || null, userId]
    );
    const isAjax = req.get('X-Requested-With') === 'XMLHttpRequest' || (req.headers.accept && req.headers.accept.includes('application/json')) || (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));
    if (isAjax) return res.json({ success: true });
    res.redirect('/warehouse/bins');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/bins/edit/:id', async (req, res) => {
  try {
    const [bins] = await db.query('SELECT * FROM warehouse_bins WHERE id = ?', [req.params.id]);
    const [racks] = await db.query(`
      SELECT wr.*, wl.nama_lokasi
      FROM warehouse_racks wr
      LEFT JOIN warehouse_locations wl ON wr.warehouse_id = wl.id
    `);
    res.render('warehouse/bins/edit', { title: 'Edit Bin', bin: bins[0], racks, body: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bins/update/:id', async (req, res) => {
  try {
    const { rack_id, kode_bin, nama_bin, level_posisi, kolom_posisi, kapasitas_item } = req.body;
    const userId = req.session.user ? req.session.user.id : null;
    await db.query(
      'UPDATE warehouse_bins SET rack_id = ?, kode_bin = ?, nama_bin = ?, level_posisi = ?, kolom_posisi = ?, kapasitas_item = ?, updated_by = ? WHERE id = ?',
      [rack_id, kode_bin, nama_bin, level_posisi || null, kolom_posisi || null, kapasitas_item || null, userId, req.params.id]
    );
    const isAjax = req.get('X-Requested-With') === 'XMLHttpRequest' || (req.headers.accept && req.headers.accept.includes('application/json'));
    if (isAjax) return res.json({ success: true });
    res.redirect('/warehouse/bins');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bins/delete/:id', async (req, res) => {
  try {
    const userId = req.session.user ? req.session.user.id : null;
    await db.query(
      'UPDATE warehouse_bins SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [userId, req.params.id]
    );
    const isAjax = req.get('X-Requested-With') === 'XMLHttpRequest' || (req.headers.accept && req.headers.accept.includes('application/json'));
    if (isAjax) return res.json({ success: true });
    res.redirect('/warehouse/bins');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
