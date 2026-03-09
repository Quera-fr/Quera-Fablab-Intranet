import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("association.db");

import fs from "fs";
const publicPath = path.join(__dirname, "public");
const uploadsPath = path.join(publicPath, "uploads");
if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath);
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    lastname TEXT,
    firstname TEXT,
    role TEXT, -- 'admin', 'volunteer', 'civic_service', 'beneficiary'
    dob TEXT,
    address TEXT
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    image_url TEXT,
    max_participants INTEGER,
    deadline TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved'
    created_by INTEGER,
    FOREIGN KEY(created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, -- 'homework_help', 'activity'
    activity_id INTEGER,
    start_time TEXT,
    end_time TEXT,
    FOREIGN KEY(activity_id) REFERENCES activities(id)
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    user_id INTEGER,
    role_at_registration TEXT, -- 'volunteer', 'beneficiary'
    FOREIGN KEY(session_id) REFERENCES sessions(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed Admin and Test Users
const seedUsers = () => {
  const admin = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@assoc.fr") as any;
  if (!admin) {
    db.prepare(`
      INSERT OR IGNORE INTO users (email, password, lastname, firstname, role, dob, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run("admin@assoc.fr", "admin123", "Admin", "Super", "admin", "1980-01-01", "123 Rue de l'Assoc");
    console.log("Admin seeded: admin@assoc.fr / admin123");
  } else if (admin.password !== "admin123") {
    db.prepare("UPDATE users SET password = ? WHERE email = ?").run("admin123", "admin@assoc.fr");
    console.log("Admin password reset to admin123");
  }

  // Seed 5 of each role for testing
  const roles = ['volunteer', 'civic_service', 'beneficiary'];
  roles.forEach(role => {
    const countQuery = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = ?").get(role) as { count: number };
    if (countQuery.count < 5) {
      for (let i = countQuery.count + 1; i <= 5; i++) {
        db.prepare(`
          INSERT OR IGNORE INTO users (email, password, lastname, firstname, role, dob, address)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          `test_${role}_${i}@assoc.fr`,
          "password123",
          `Nom${i}`,
          `Test${role.charAt(0).toUpperCase() + role.slice(1)}`,
          role,
          "2000-01-01",
          `${i} Rue du Test`
        );
      }
      console.log(`Seeded 5 ${role}s`);
    }
  });
};
seedUsers();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Static files for uploads
  const uploadDir = path.join(__dirname, "public", "uploads");
  app.use("/uploads", express.static(uploadDir));

  app.post("/api/upload", (req, res) => {
    const { image, name } = req.body;
    if (!image) return res.status(400).json({ error: "Pas d'image" });

    // Simple base64 decode and save
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const fileName = `${Date.now()}-${name || 'upload'}`;
    const filePath = path.join(uploadsPath, fileName);

    fs.writeFileSync(filePath, buffer);
    res.json({ url: `/uploads/${fileName}` });
  });

  // Auth API
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      const { password, ...userWithoutPassword } = user as any;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Identifiants invalides" });
    }
  });

  // Users API
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, email, lastname, firstname, role, dob, address FROM users").all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { email, password, lastname, firstname, role, dob, address } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO users (email, password, lastname, firstname, role, dob, address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(email, password || "password123", lastname, firstname, role, dob, address);
      res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/users/batch", (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: "IDs invalides" });

    const transaction = db.transaction(() => {
      for (const id of ids) {
        const numericId = Number(id);
        db.prepare("DELETE FROM registrations WHERE user_id = ?").run(numericId);
        const activities = db.prepare("SELECT id FROM activities WHERE created_by = ?").all(numericId) as { id: number }[];
        for (const act of activities) {
          db.prepare("DELETE FROM registrations WHERE session_id IN (SELECT id FROM sessions WHERE activity_id = ?)").run(act.id);
          db.prepare("DELETE FROM sessions WHERE activity_id = ?").run(act.id);
        }
        db.prepare("DELETE FROM activities WHERE created_by = ?").run(numericId);
        db.prepare("DELETE FROM users WHERE id = ?").run(numericId);
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    const userId = req.params.id;
    try {
      db.transaction(() => {
        db.prepare("DELETE FROM registrations WHERE user_id = ?").run(userId);
        const activities = db.prepare("SELECT id FROM activities WHERE created_by = ?").all(userId) as { id: number }[];
        for (const act of activities) {
          db.prepare("DELETE FROM registrations WHERE session_id IN (SELECT id FROM sessions WHERE activity_id = ?)").run(act.id);
          db.prepare("DELETE FROM sessions WHERE activity_id = ?").run(act.id);
        }
        db.prepare("DELETE FROM activities WHERE created_by = ?").run(userId);
        db.prepare("DELETE FROM sessions WHERE type = 'room_booking' AND id NOT IN (SELECT session_id FROM registrations)").run();
        db.prepare("DELETE FROM users WHERE id = ?").run(userId);
      })();
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/users/:id", (req, res) => {
    const user = db.prepare("SELECT id, email, lastname, firstname, role, dob, address FROM users WHERE id = ?").get(req.params.id);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(user);
  });

  app.patch("/api/users/:id", (req, res) => {
    const { email, password, lastname, firstname, role, dob, address } = req.body;
    try {
      if (password) {
        db.prepare(`
          UPDATE users SET email = ?, password = ?, lastname = ?, firstname = ?, role = ?, dob = ?, address = ? WHERE id = ?
        `).run(email, password, lastname, firstname, role, dob, address, req.params.id);
      } else {
        db.prepare(`
          UPDATE users SET email = ?, lastname = ?, firstname = ?, role = ?, dob = ?, address = ? WHERE id = ?
        `).run(email, lastname, firstname, role, dob, address, req.params.id);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Activities API
  app.get("/api/activities", (req, res) => {
    const activities = db.prepare(`
      SELECT a.*, u.firstname || ' ' || u.lastname as creator_name 
      FROM activities a 
      JOIN users u ON a.created_by = u.id
    `).all();
    res.json(activities);
  });

  app.post("/api/activities", (req, res) => {
    const { title, description, image_url, max_participants, deadline, created_by, start_time, end_time } = req.body;

    const sessionDate = new Date(start_time).toISOString().split('T')[0];
    const existing = db.prepare(`
      SELECT count(*) as count FROM sessions 
      WHERE type = 'activity' AND date(start_time) = ?
    `).get(sessionDate) as { count: number };

    if (existing.count > 0) {
      return res.status(400).json({ error: "Une activité existe déjà à cette date." });
    }

    const info = db.transaction(() => {
      const activityResult = db.prepare(`
        INSERT INTO activities (title, description, image_url, max_participants, deadline, created_by, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `).run(title, description, image_url, max_participants, deadline, created_by);

      const activityId = activityResult.lastInsertRowid;

      db.prepare(`
        INSERT INTO sessions (type, activity_id, start_time, end_time)
        VALUES ('activity', ?, ?, ?)
      `).run(activityId, start_time, end_time);

      return activityId;
    })();
    res.json({ id: info });
  });

  app.patch("/api/activities/:id/status", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE activities SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/activities/:id", (req, res) => {
    db.prepare("DELETE FROM sessions WHERE activity_id = ?").run(req.params.id);
    db.prepare("DELETE FROM activities WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Sessions & Registrations API
  app.get("/api/sessions", (req, res) => {
    const sessions = db.prepare(`
      SELECT s.*, a.title, a.description, a.status, a.max_participants, a.image_url
      FROM sessions s
      LEFT JOIN activities a ON s.activity_id = a.id
    `).all();

    const sessionsWithParticipants = sessions.map((s: any) => {
      const participants = db.prepare(`
        SELECT r.user_id, r.role_at_registration, u.firstname, u.lastname, u.role
        FROM registrations r
        JOIN users u ON r.user_id = u.id
        WHERE r.session_id = ?
      `).all(s.id);
      return { ...s, participants };
    });

    res.json(sessionsWithParticipants);
  });

  app.post("/api/sessions/homework", (req, res) => {
    const { start_time, end_time } = req.body;

    const sessionDate = new Date(start_time).toISOString().split('T')[0];
    const existing = db.prepare(`
      SELECT count(*) as count FROM sessions 
      WHERE type = 'homework_help' AND date(start_time) = ?
    `).get(sessionDate) as { count: number };

    if (existing.count > 0) {
      return res.status(400).json({ error: "Une session d'aide aux devoirs existe déjà à cette date." });
    }

    const result = db.prepare(`
      INSERT INTO sessions (type, start_time, end_time)
      VALUES ('homework_help', ?, ?)
    `).run(start_time, end_time);
    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/sessions/room", (req, res) => {
    const { start_time, end_time, user_id } = req.body;

    const sessionDate = new Date(start_time).toISOString().split('T')[0];
    const existing = db.prepare(`
      SELECT count(*) as count FROM sessions 
      WHERE type = 'room_booking' AND date(start_time) = ?
    `).get(sessionDate) as { count: number };

    if (existing.count > 0) {
      return res.status(400).json({ error: "Une réservation de local existe déjà à cette date." });
    }

    const info = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO sessions (type, start_time, end_time)
        VALUES ('room_booking', ?, ?)
      `).run(start_time, end_time);

      const sessionId = result.lastInsertRowid;

      db.prepare(`
        INSERT INTO registrations (session_id, user_id, role_at_registration)
        VALUES (?, ?, 'adherent')
      `).run(sessionId, user_id);

      return sessionId;
    })();

    res.json({ id: info });
  });

  app.post("/api/sessions/homework/batch", (req, res) => {
    const { start_date } = req.body; // Expects a Monday Date string
    const start = new Date(start_date);

    const checkExisting = db.prepare(`SELECT count(*) as count FROM sessions WHERE type = 'homework_help' AND start_time = ?`);

    const insertSession = db.prepare(`
      INSERT INTO sessions (type, start_time, end_time)
      VALUES ('homework_help', ?, ?)
    `);

    db.transaction(() => {
      // 5 days: Monday to Friday
      for (let i = 0; i < 5; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(currentDate.getDate() + i);

        const startTimeStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 16, 30).toISOString();
        const endTimeStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 20, 0).toISOString();

        const exists = checkExisting.get(startTimeStr) as { count: number };
        if (exists.count === 0) {
          insertSession.run(startTimeStr, endTimeStr);
        }
      }
    })();

    res.json({ success: true });
  });

  app.patch("/api/sessions/:id", (req, res) => {
    const { start_time, end_time } = req.body;
    try {
      db.prepare("UPDATE sessions SET start_time = ?, end_time = ? WHERE id = ?").run(start_time, end_time, req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/sessions/:id", (req, res) => {
    db.prepare("DELETE FROM registrations WHERE session_id = ?").run(req.params.id);
    db.prepare("DELETE FROM sessions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/registrations", (req, res) => {
    const { session_id, user_id, role_at_registration } = req.body;

    const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(session_id) as any;
    if (session.type === 'room_booking') {
      return res.status(400).json({ error: "Les réservations du local ne permettent pas d'inscription." });
    }

    // Check quotas
    const participants = db.prepare("SELECT * FROM registrations WHERE session_id = ?").all(session_id);

    if (session.type === 'homework_help') {
      if (role_at_registration === 'volunteer') {
        const volunteerCount = participants.filter((p: any) => p.role_at_registration === 'volunteer').length;
        if (volunteerCount >= 3) {
          return res.status(400).json({ error: "Maximum de 3 bénévoles atteint pour cette permanence." });
        }
      } else if (role_at_registration === 'beneficiary') {
        const beneficiaryCount = participants.filter((p: any) => p.role_at_registration === 'beneficiary').length;
        if (beneficiaryCount >= 15) {
          return res.status(400).json({ error: "Maximum de 15 jeunes atteint pour cette permanence." });
        }
      }
    }

    if (session.type === 'activity') {
      const activity = db.prepare("SELECT * FROM activities WHERE id = ?").get(session.activity_id) as any;
      if (participants.length >= activity.max_participants) {
        return res.status(400).json({ error: "Nombre maximum de participants atteint." });
      }
    }

    // Check if already registered
    const existing = db.prepare("SELECT * FROM registrations WHERE session_id = ? AND user_id = ?").get(session_id, user_id);
    if (existing) {
      return res.status(400).json({ error: "Déjà inscrit à cette session." });
    }

    db.prepare(`
      INSERT INTO registrations (session_id, user_id, role_at_registration)
      VALUES (?, ?, ?)
    `).run(session_id, user_id, role_at_registration);

    res.json({ success: true });
  });

  app.delete("/api/registrations", (req, res) => {
    const { session_id, user_id } = req.body;
    db.prepare("DELETE FROM registrations WHERE session_id = ? AND user_id = ?").run(session_id, user_id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
