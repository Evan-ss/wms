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
    
    // Get total jamaah statistics (excluding Infant room types and deleted records)
    const [totalJamaah] = await db.query(`
      SELECT COUNT(DISTINCT od.nama_jamaah) as count
      FROM order_details od
      LEFT JOIN room_types rt ON od.room_type_id = rt.id
      WHERE od.deleted_at IS NULL 
      AND (rt.tipe_kamar IS NULL OR rt.tipe_kamar NOT LIKE '%Infant%')
      AND od.nama_jamaah IS NOT NULL 
      AND od.nama_jamaah != ''
    `);
    
    // Get equipment availability statistics
    const [equipmentStats] = await db.query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN pb.stock_akhir >= pb.stock_minimal THEN 1 ELSE 0 END) as available_items,
        SUM(CASE WHEN pb.stock_akhir < pb.stock_minimal AND pb.stock_akhir > 0 THEN 1 ELSE 0 END) as low_stock_items,
        SUM(CASE WHEN pb.stock_akhir = 0 THEN 1 ELSE 0 END) as out_of_stock_items,
        SUM(pb.stock_akhir) as total_stock_qty
      FROM purchasing_barang pb
    `);
    
    // Get available stock items list
    const [availableStockItems] = await db.query(`
      SELECT id_barang, kode_barang, nama_barang, stock_minimal, stock_akhir, satuan
      FROM purchasing_barang
      WHERE stock_akhir >= stock_minimal
      ORDER BY nama_barang ASC
    `);
    
    // Get low stock items list
    const [lowStockItems] = await db.query(`
      SELECT id_barang, kode_barang, nama_barang, stock_minimal, stock_akhir, satuan
      FROM purchasing_barang
      WHERE stock_akhir < stock_minimal AND stock_akhir > 0
      ORDER BY stock_akhir ASC
    `);
    
    // Get out of stock items list
    const [outOfStockItems] = await db.query(`
      SELECT id_barang, kode_barang, nama_barang, stock_minimal, stock_akhir, satuan
      FROM purchasing_barang
      WHERE stock_akhir = 0
      ORDER BY nama_barang ASC
    `);
    
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
      lowStockCount: lowStock.length,
      totalJamaah: totalJamaah[0].count || 0,
      equipment: {
        totalItems: equipmentStats[0].total_items || 0,
        availableItems: equipmentStats[0].available_items || 0,
        lowStockItems: equipmentStats[0].low_stock_items || 0,
        outOfStockItems: equipmentStats[0].out_of_stock_items || 0,
        totalStockQty: equipmentStats[0].total_stock_qty || 0
      }
    };
    
    res.render('dashboard/index', {
      title: 'Dashboard',
      stats,
      lowStock,
      recentIncoming,
      recentOutgoing,
      equipmentItems: {
        available: availableStockItems,
        lowStock: lowStockItems,
        outOfStock: outOfStockItems
      },
      body: '',
      success: req.query.success || null
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { title: 'Error', error });
  }
});

module.exports = router;
