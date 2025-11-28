const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { pickColumn } = require('../lib/dbUtils');

// Dashboard page
router.get('/', async (req, res) => {
  try {
    // Get statistics
    const [branches] = await db.query('SELECT COUNT(*) as count FROM branches');
    const [suppliers] = await db.query('SELECT COUNT(*) as count FROM purchasing_suppliers');
    const [barang] = await db.query('SELECT COUNT(*) as count FROM purchasing_barang');
    const [warehouses] = await db.query('SELECT COUNT(*) as count FROM warehouse_locations');
    
    // Get total stock
    const [totalStock] = await db.query('SELECT SUM(quantity) as total FROM warehouse_stock');
    
    // Get low stock items
    const [lowStock] = await db.query(`
      SELECT pb.nama_barang, pb.stock_minimal, SUM(ws.available_qty) as current_stock
      FROM purchasing_barang pb
      LEFT JOIN warehouse_stock ws ON pb.id_barang = ws.id_barang
      GROUP BY pb.id_barang
      HAVING current_stock < pb.stock_minimal OR current_stock IS NULL
      LIMIT 5
    `);
    
    // Get recent incoming
    const wlField = await pickColumn('warehouse_locations', ['location_name','nama_lokasi']) || 'nama_lokasi';
    const [recentIncoming] = await db.query(`
      SELECT pi.*, pb.nama_barang, ps.name as supplier_name, wl.${wlField} as location_name
      FROM purchasing_incoming pi
      LEFT JOIN purchasing_barang pb ON pi.id_barang = pb.id_barang
      LEFT JOIN purchasing_suppliers ps ON pi.supplier_id = ps.id
      LEFT JOIN warehouse_locations wl ON pi.warehouse_id = wl.id
      ORDER BY pi.tanggal_masuk DESC
      LIMIT 5
    `);
    
    // Get recent outgoing
    const wlField2 = await pickColumn('warehouse_locations', ['location_name','nama_lokasi']) || 'nama_lokasi';
    const [recentOutgoing] = await db.query(`
      SELECT pbk.*, pb.nama_barang, wl.${wlField2} as location_name
      FROM purchasing_barang_keluar pbk
      LEFT JOIN purchasing_barang pb ON pbk.id_barang = pb.id_barang
      LEFT JOIN warehouse_locations wl ON pbk.warehouse_id = wl.id
      ORDER BY pbk.tanggal_keluar DESC
      LIMIT 5
    `);
    
    const stats = {
      branches: branches[0].count,
      suppliers: suppliers[0].count,
      barang: barang[0].count,
      warehouses: warehouses[0].count,
      totalStock: totalStock[0].total || 0,
      lowStockCount: lowStock.length
    };
    
    res.render('dashboard/index', {
      title: 'Dashboard',
      stats,
      lowStock,
      recentIncoming,
      recentOutgoing,
      body: '',
      success: req.query.success || null
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { title: 'Error', error });
  }
});

module.exports = router;
