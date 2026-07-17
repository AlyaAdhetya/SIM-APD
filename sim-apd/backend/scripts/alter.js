const db = require('../../backend/src/config/database');
async function run() {
  try {
    await db.query('ALTER TABLE pengembalian ADD COLUMN qr_code_token VARCHAR(100) UNIQUE NULL AFTER status;');
    console.log("Success");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log("Already exists");
    else console.error(e);
  } finally {
    process.exit();
  }
}
run();
