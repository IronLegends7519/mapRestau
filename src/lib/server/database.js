import Database from 'better-sqlite3';

const db = new Database('./db.sqlite');

export function getRestaurants() {
  const stmt = db.prepare('SELECT * FROM restaurants');
  return stmt.all();
}

export function getRestaurantByGeo(latMin, latMax, lonMin, lonMax) {
  const stmt = db.prepare('SELECT r.*, rt.tag_id, t.name as tag_name FROM restaurants r LEFT JOIN restaurant_tags rt ON rt.restaurant_id = r.id LEFT JOIN tags t ON t.id = rt.tag_id WHERE r.latitude  BETWEEN ? AND ? AND r.longitude BETWEEN ? AND ?');
  return stmt.all(latMin, latMax, lonMin, lonMax);
}

export function getRestaurantById(id) {
  const stmt = db.prepare('SELECT * FROM restaurants WHERE id = ?');
  return stmt.get(id);
}

export function getAllTag()
{
    const stmt = db.prepare('SELECT * FROM tags');
    return stmt.all();
}