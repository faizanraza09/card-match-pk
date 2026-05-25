import * as SQLite from "expo-sqlite";

let _db: SQLite.SQLiteDatabase | null = null;

async function db(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync("konsacard.db");
  await _db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      restaurant TEXT NOT NULL,
      city TEXT,
      bank TEXT NOT NULL,
      card TEXT NOT NULL,
      bill_pkr INTEGER NOT NULL,
      saving_pkr INTEGER NOT NULL,
      notes TEXT
    );
    CREATE INDEX IF NOT EXISTS visits_ts_idx ON visits(ts);
    CREATE TABLE IF NOT EXISTS owned_cards_meta (
      card_key TEXT PRIMARY KEY,
      issued_at INTEGER,
      anniversary_month INTEGER
    );
  `);
  return _db;
}

export interface Visit {
  id?: number;
  ts: number;
  restaurant: string;
  city?: string | null;
  bank: string;
  card: string;
  bill_pkr: number;
  saving_pkr: number;
  notes?: string | null;
}

export async function logVisit(v: Omit<Visit, "id">): Promise<number> {
  const conn = await db();
  const res = await conn.runAsync(
    `INSERT INTO visits (ts, restaurant, city, bank, card, bill_pkr, saving_pkr, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      v.ts,
      v.restaurant,
      v.city ?? null,
      v.bank,
      v.card,
      Math.round(v.bill_pkr),
      Math.round(v.saving_pkr),
      v.notes ?? null,
    ]
  );
  return res.lastInsertRowId;
}

export async function listVisits(limit = 100): Promise<Visit[]> {
  const conn = await db();
  return await conn.getAllAsync<Visit>(`SELECT * FROM visits ORDER BY ts DESC LIMIT ?`, [limit]);
}

export async function deleteVisit(id: number): Promise<void> {
  const conn = await db();
  await conn.runAsync(`DELETE FROM visits WHERE id = ?`, [id]);
}

export async function monthlySummary(month: Date): Promise<{
  start: number;
  end: number;
  totalBill: number;
  totalSaving: number;
  visitCount: number;
  byCard: { bank: string; card: string; saving: number; visits: number }[];
}> {
  const start = new Date(month.getFullYear(), month.getMonth(), 1).getTime();
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1).getTime();
  const conn = await db();
  const rows = await conn.getAllAsync<Visit>(
    `SELECT * FROM visits WHERE ts >= ? AND ts < ?`,
    [start, end]
  );
  const byCardMap = new Map<string, { bank: string; card: string; saving: number; visits: number }>();
  let totalBill = 0;
  let totalSaving = 0;
  rows.forEach((r) => {
    totalBill += r.bill_pkr;
    totalSaving += r.saving_pkr;
    const key = `${r.bank}||${r.card}`;
    const cur = byCardMap.get(key);
    if (cur) {
      cur.saving += r.saving_pkr;
      cur.visits += 1;
    } else {
      byCardMap.set(key, { bank: r.bank, card: r.card, saving: r.saving_pkr, visits: 1 });
    }
  });
  return {
    start,
    end,
    totalBill,
    totalSaving,
    visitCount: rows.length,
    byCard: Array.from(byCardMap.values()).sort((a, b) => b.saving - a.saving),
  };
}

export async function setOwnedCardAnniversary(cardKey: string, month: number): Promise<void> {
  const conn = await db();
  await conn.runAsync(
    `INSERT INTO owned_cards_meta (card_key, anniversary_month) VALUES (?, ?)
     ON CONFLICT(card_key) DO UPDATE SET anniversary_month = excluded.anniversary_month`,
    [cardKey, month]
  );
}

export async function getOwnedCardAnniversaries(): Promise<{ card_key: string; anniversary_month: number | null }[]> {
  const conn = await db();
  return await conn.getAllAsync(
    `SELECT card_key, anniversary_month FROM owned_cards_meta`
  );
}
