require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    // Create the connection pool
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('Starting audit fields migration for warehouse tables...');
        
        // Get a connection from the pool
        const connection = await pool.getConnection();
        
        try {
            // ===================================================
            // 1. ADD AUDIT FIELDS TO warehouse_locations
            // ===================================================
            console.log('\n1. Adding audit fields to warehouse_locations...');
            
            // Check if columns already exist
            const [locationsColumns] = await connection.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME = 'warehouse_locations' 
                AND COLUMN_NAME IN ('created_by', 'updated_by', 'deleted_at', 'deleted_by')
            `, [process.env.DB_NAME]);
            
            const existingLocationsColumns = locationsColumns.map(row => row.COLUMN_NAME);
            
            if (!existingLocationsColumns.includes('created_by')) {
                console.log('  - Adding created_by to warehouse_locations...');
                await connection.query(`
                    ALTER TABLE warehouse_locations 
                    ADD COLUMN created_by INT DEFAULT NULL AFTER created_at
                `);
            } else {
                console.log('  - created_by already exists in warehouse_locations');
            }
            
            if (!existingLocationsColumns.includes('updated_by')) {
                console.log('  - Adding updated_by to warehouse_locations...');
                await connection.query(`
                    ALTER TABLE warehouse_locations 
                    ADD COLUMN updated_by INT DEFAULT NULL AFTER updated_at
                `);
            } else {
                console.log('  - updated_by already exists in warehouse_locations');
            }
            
            if (!existingLocationsColumns.includes('deleted_at')) {
                console.log('  - Adding deleted_at to warehouse_locations...');
                await connection.query(`
                    ALTER TABLE warehouse_locations 
                    ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_by
                `);
            } else {
                console.log('  - deleted_at already exists in warehouse_locations');
            }
            
            if (!existingLocationsColumns.includes('deleted_by')) {
                console.log('  - Adding deleted_by to warehouse_locations...');
                await connection.query(`
                    ALTER TABLE warehouse_locations 
                    ADD COLUMN deleted_by INT DEFAULT NULL AFTER deleted_at
                `);
            } else {
                console.log('  - deleted_by already exists in warehouse_locations');
            }
            
            // Add foreign keys if they don't exist
            console.log('  - Adding foreign keys to warehouse_locations...');
            try {
                await connection.query(`
                    ALTER TABLE warehouse_locations 
                    ADD CONSTRAINT fk_wh_locations_created_by 
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
                `);
            } catch (e) {
                if (!e.message.includes('Duplicate key name')) throw e;
                console.log('    - Foreign key fk_wh_locations_created_by already exists');
            }
            
            try {
                await connection.query(`
                    ALTER TABLE warehouse_locations 
                    ADD CONSTRAINT fk_wh_locations_updated_by 
                    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
                `);
            } catch (e) {
                if (!e.message.includes('Duplicate key name')) throw e;
                console.log('    - Foreign key fk_wh_locations_updated_by already exists');
            }
            
            try {
                await connection.query(`
                    ALTER TABLE warehouse_locations 
                    ADD CONSTRAINT fk_wh_locations_deleted_by 
                    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
                `);
            } catch (e) {
                if (!e.message.includes('Duplicate key name')) throw e;
                console.log('    - Foreign key fk_wh_locations_deleted_by already exists');
            }

            // ===================================================
            // 2. ADD AUDIT FIELDS TO warehouse_racks
            // ===================================================
            console.log('\n2. Adding audit fields to warehouse_racks...');
            
            const [racksColumns] = await connection.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME = 'warehouse_racks' 
                AND COLUMN_NAME IN ('created_by', 'updated_by', 'deleted_at', 'deleted_by')
            `, [process.env.DB_NAME]);
            
            const existingRacksColumns = racksColumns.map(row => row.COLUMN_NAME);
            
            if (!existingRacksColumns.includes('created_by')) {
                console.log('  - Adding created_by to warehouse_racks...');
                await connection.query(`
                    ALTER TABLE warehouse_racks 
                    ADD COLUMN created_by INT DEFAULT NULL AFTER created_at
                `);
            } else {
                console.log('  - created_by already exists in warehouse_racks');
            }
            
            if (!existingRacksColumns.includes('updated_by')) {
                console.log('  - Adding updated_by to warehouse_racks...');
                await connection.query(`
                    ALTER TABLE warehouse_racks 
                    ADD COLUMN updated_by INT DEFAULT NULL AFTER updated_at
                `);
            } else {
                console.log('  - updated_by already exists in warehouse_racks');
            }
            
            if (!existingRacksColumns.includes('deleted_at')) {
                console.log('  - Adding deleted_at to warehouse_racks...');
                await connection.query(`
                    ALTER TABLE warehouse_racks 
                    ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_by
                `);
            } else {
                console.log('  - deleted_at already exists in warehouse_racks');
            }
            
            if (!existingRacksColumns.includes('deleted_by')) {
                console.log('  - Adding deleted_by to warehouse_racks...');
                await connection.query(`
                    ALTER TABLE warehouse_racks 
                    ADD COLUMN deleted_by INT DEFAULT NULL AFTER deleted_at
                `);
            } else {
                console.log('  - deleted_by already exists in warehouse_racks');
            }
            
            // Add foreign keys
            console.log('  - Adding foreign keys to warehouse_racks...');
            try {
                await connection.query(`
                    ALTER TABLE warehouse_racks 
                    ADD CONSTRAINT fk_wh_racks_created_by 
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
                `);
            } catch (e) {
                if (!e.message.includes('Duplicate key name')) throw e;
                console.log('    - Foreign key fk_wh_racks_created_by already exists');
            }
            
            try {
                await connection.query(`
                    ALTER TABLE warehouse_racks 
                    ADD CONSTRAINT fk_wh_racks_updated_by 
                    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
                `);
            } catch (e) {
                if (!e.message.includes('Duplicate key name')) throw e;
                console.log('    - Foreign key fk_wh_racks_updated_by already exists');
            }
            
            try {
                await connection.query(`
                    ALTER TABLE warehouse_racks 
                    ADD CONSTRAINT fk_wh_racks_deleted_by 
                    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
                `);
            } catch (e) {
                if (!e.message.includes('Duplicate key name')) throw e;
                console.log('    - Foreign key fk_wh_racks_deleted_by already exists');
            }

            // ===================================================
            // 3. ADD AUDIT FIELDS TO warehouse_bins
            // ===================================================
            console.log('\n3. Adding audit fields to warehouse_bins...');
            
            const [binsColumns] = await connection.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME = 'warehouse_bins' 
                AND COLUMN_NAME IN ('created_by', 'updated_by', 'deleted_at', 'deleted_by')
            `, [process.env.DB_NAME]);
            
            const existingBinsColumns = binsColumns.map(row => row.COLUMN_NAME);
            
            if (!existingBinsColumns.includes('created_by')) {
                console.log('  - Adding created_by to warehouse_bins...');
                await connection.query(`
                    ALTER TABLE warehouse_bins 
                    ADD COLUMN created_by INT DEFAULT NULL AFTER created_at
                `);
            } else {
                console.log('  - created_by already exists in warehouse_bins');
            }
            
            if (!existingBinsColumns.includes('updated_by')) {
                console.log('  - Adding updated_by to warehouse_bins...');
                await connection.query(`
                    ALTER TABLE warehouse_bins 
                    ADD COLUMN updated_by INT DEFAULT NULL AFTER updated_at
                `);
            } else {
                console.log('  - updated_by already exists in warehouse_bins');
            }
            
            if (!existingBinsColumns.includes('deleted_at')) {
                console.log('  - Adding deleted_at to warehouse_bins...');
                await connection.query(`
                    ALTER TABLE warehouse_bins 
                    ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_by
                `);
            } else {
                console.log('  - deleted_at already exists in warehouse_bins');
            }
            
            if (!existingBinsColumns.includes('deleted_by')) {
                console.log('  - Adding deleted_by to warehouse_bins...');
                await connection.query(`
                    ALTER TABLE warehouse_bins 
                    ADD COLUMN deleted_by INT DEFAULT NULL AFTER deleted_at
                `);
            } else {
                console.log('  - deleted_by already exists in warehouse_bins');
            }
            
            // Add foreign keys
            console.log('  - Adding foreign keys to warehouse_bins...');
            try {
                await connection.query(`
                    ALTER TABLE warehouse_bins 
                    ADD CONSTRAINT fk_wh_bins_created_by 
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
                `);
            } catch (e) {
                if (!e.message.includes('Duplicate key name')) throw e;
                console.log('    - Foreign key fk_wh_bins_created_by already exists');
            }
            
            try {
                await connection.query(`
                    ALTER TABLE warehouse_bins 
                    ADD CONSTRAINT fk_wh_bins_updated_by 
                    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
                `);
            } catch (e) {
                if (!e.message.includes('Duplicate key name')) throw e;
                console.log('    - Foreign key fk_wh_bins_updated_by already exists');
            }
            
            try {
                await connection.query(`
                    ALTER TABLE warehouse_bins 
                    ADD CONSTRAINT fk_wh_bins_deleted_by 
                    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
                `);
            } catch (e) {
                if (!e.message.includes('Duplicate key name')) throw e;
                console.log('    - Foreign key fk_wh_bins_deleted_by already exists');
            }

            // ===================================================
            // 4. ADD AUDIT FIELDS TO warehouse_stock
            // ===================================================
            console.log('\n4. Adding audit fields to warehouse_stock...');
            
            const [stockColumns] = await connection.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME = 'warehouse_stock' 
                AND COLUMN_NAME IN ('created_by', 'updated_by', 'deleted_at', 'deleted_by')
            `, [process.env.DB_NAME]);
            
            const existingStockColumns = stockColumns.map(row => row.COLUMN_NAME);
            
            if (!existingStockColumns.includes('created_by')) {
                console.log('  - Adding created_by to warehouse_stock...');
                await connection.query(`
                    ALTER TABLE warehouse_stock 
                    ADD COLUMN created_by INT DEFAULT NULL AFTER created_at
                `);
            } else {
                console.log('  - created_by already exists in warehouse_stock');
            }
            
            if (!existingStockColumns.includes('updated_by')) {
                console.log('  - Adding updated_by to warehouse_stock...');
                await connection.query(`
                    ALTER TABLE warehouse_stock 
                    ADD COLUMN updated_by INT DEFAULT NULL AFTER updated_at
                `);
            } else {
                console.log('  - updated_by already exists in warehouse_stock');
            }
            
            if (!existingStockColumns.includes('deleted_at')) {
                console.log('  - Adding deleted_at to warehouse_stock...');
                await connection.query(`
                    ALTER TABLE warehouse_stock 
                    ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_by
                `);
            } else {
                console.log('  - deleted_at already exists in warehouse_stock');
            }
            
            if (!existingStockColumns.includes('deleted_by')) {
                console.log('  - Adding deleted_by to warehouse_stock...');
                await connection.query(`
                    ALTER TABLE warehouse_stock 
                    ADD COLUMN deleted_by INT DEFAULT NULL AFTER deleted_at
                `);
            } else {
                console.log('  - deleted_by already exists in warehouse_stock');
            }
            
            // Add foreign keys
            console.log('  - Adding foreign keys to warehouse_stock...');
            try {
                await connection.query(`
                    ALTER TABLE warehouse_stock 
                    ADD CONSTRAINT fk_wh_stock_created_by 
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
                `);
            } catch (e) {
                if (!e.message.includes('Duplicate key name')) throw e;
                console.log('    - Foreign key fk_wh_stock_created_by already exists');
            }
            
            try {
                await connection.query(`
                    ALTER TABLE warehouse_stock 
                    ADD CONSTRAINT fk_wh_stock_updated_by 
                    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
                `);
            } catch (e) {
                if (!e.message.includes('Duplicate key name')) throw e;
                console.log('    - Foreign key fk_wh_stock_updated_by already exists');
            }
            
            try {
                await connection.query(`
                    ALTER TABLE warehouse_stock 
                    ADD CONSTRAINT fk_wh_stock_deleted_by 
                    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
                `);
            } catch (e) {
                if (!e.message.includes('Duplicate key name')) throw e;
                console.log('    - Foreign key fk_wh_stock_deleted_by already exists');
            }

            // ===================================================
            // 5. ADD AUDIT FIELDS TO stock_movements
            // ===================================================
            console.log('\n5. Adding audit fields to stock_movements...');
            
            const [movementsColumns] = await connection.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME = 'stock_movements' 
                AND COLUMN_NAME IN ('created_by', 'updated_by', 'deleted_at', 'deleted_by')
            `, [process.env.DB_NAME]);
            
            const existingMovementsColumns = movementsColumns.map(row => row.COLUMN_NAME);
            
            if (!existingMovementsColumns.includes('created_by')) {
                console.log('  - Adding created_by to stock_movements...');
                await connection.query(`
                    ALTER TABLE stock_movements 
                    ADD COLUMN created_by INT DEFAULT NULL AFTER created_at
                `);
            } else {
                console.log('  - created_by already exists in stock_movements');
            }
            
            if (!existingMovementsColumns.includes('updated_by')) {
                console.log('  - Adding updated_by to stock_movements...');
                await connection.query(`
                    ALTER TABLE stock_movements 
                    ADD COLUMN updated_by INT DEFAULT NULL AFTER created_by
                `);
            } else {
                console.log('  - updated_by already exists in stock_movements');
            }
            
            if (!existingMovementsColumns.includes('deleted_at')) {
                console.log('  - Adding deleted_at to stock_movements...');
                await connection.query(`
                    ALTER TABLE stock_movements 
                    ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_by
                `);
            } else {
                console.log('  - deleted_at already exists in stock_movements');
            }
            
            if (!existingMovementsColumns.includes('deleted_by')) {
                console.log('  - Adding deleted_by to stock_movements...');
                await connection.query(`
                    ALTER TABLE stock_movements 
                    ADD COLUMN deleted_by INT DEFAULT NULL AFTER deleted_at
                `);
            } else {
                console.log('  - deleted_by already exists in stock_movements');
            }
            
            // Add foreign keys
            console.log('  - Adding foreign keys to stock_movements...');
            try {
                await connection.query(`
                    ALTER TABLE stock_movements 
                    ADD CONSTRAINT fk_stock_movements_created_by 
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
                `);
            } catch (e) {
                if (!e.message.includes('Duplicate key name')) throw e;
                console.log('    - Foreign key fk_stock_movements_created_by already exists');
            }
            
            try {
                await connection.query(`
                    ALTER TABLE stock_movements 
                    ADD CONSTRAINT fk_stock_movements_updated_by 
                    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
                `);
            } catch (e) {
                if (!e.message.includes('Duplicate key name')) throw e;
                console.log('    - Foreign key fk_stock_movements_updated_by already exists');
            }
            
            try {
                await connection.query(`
                    ALTER TABLE stock_movements 
                    ADD CONSTRAINT fk_stock_movements_deleted_by 
                    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
                `);
            } catch (e) {
                if (!e.message.includes('Duplicate key name')) throw e;
                console.log('    - Foreign key fk_stock_movements_deleted_by already exists');
            }

            console.log('\n✅ Audit fields migration completed successfully!');
            console.log('\nSummary:');
            console.log('- Added created_by, updated_by, deleted_at, deleted_by to:');
            console.log('  • warehouse_locations');
            console.log('  • warehouse_racks');
            console.log('  • warehouse_bins');
            console.log('  • warehouse_stock');
            console.log('  • stock_movements');
            console.log('- All foreign key constraints added to users table');
            
        } finally {
            // Release the connection back to the pool
            connection.release();
        }
    } catch (error) {
        console.error('❌ Error during migration:', error);
        throw error;
    } finally {
        // Close the pool
        await pool.end();
    }
}

// Run migration
migrate().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
});
