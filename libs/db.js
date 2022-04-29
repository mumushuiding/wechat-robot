import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { LowSync, JSONFileSync } from 'lowdb';
const __dirname = dirname(fileURLToPath(import.meta.url));

// Use JSON file for storage
const file = join(__dirname, 'db.json');
const adapter = new JSONFileSync(file);
const db = new LowSync(adapter);
export default db;

