import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import { Pool, PoolClient } from "pg";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.length > 0) return value;
  }
  return undefined;
};

const pool = new Pool({
  host: env("DB_HOST", "host") || "localhost",
  port: parseInt(env("DB_PORT", "port") || "5432", 10),
  database: env("DB_NAME", "dbname") || "intranet",
  user: env("DB_USER", "user") || "postgres",
  password: env("DB_PASSWORD", "password") || "",
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

const withTransaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

const publicPath = path.join(__dirname, "public");
const uploadsPath = path.join(publicPath, "uploads");
if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath);
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        lastname TEXT,
        firstname TEXT,
        role TEXT,
        dob TEXT,
        address TEXT
      );

      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        title TEXT,
        description TEXT,
        image_url TEXT,
        max_participants INTEGER,
        deadline TEXT,
        status TEXT DEFAULT 'pending',
        created_by INTEGER,
        FOREIGN KEY(created_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        type TEXT,
        activity_id INTEGER,
        start_time TEXT,
        end_time TEXT,
        FOREIGN KEY(activity_id) REFERENCES activities(id)
      );

      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        session_id INTEGER,
        user_id INTEGER,
        role_at_registration TEXT,
        FOREIGN KEY(session_id) REFERENCES sessions(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);
    console.log("Database tables initialized");
  } finally {
    client.release();
  }
}

async function seedUsers() {
  try {
    const adminResult = await pool.query("SELECT * FROM users WHERE email = $1", ["admin@assoc.fr"]);
    const admin = adminResult.rows[0];

    if (!admin) {
      await pool.query(
        `INSERT INTO users (email, password, lastname, firstname, role, dob, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO NOTHING`,
        ["admin@assoc.fr", "admin123", "Admin", "Super", "admin", "1980-01-01", "123 Rue de l'Assoc"]
      );
      console.log("Admin seeded: admin@assoc.fr / admin123");
    } else if (admin.password !== "admin123") {
      await pool.query("UPDATE users SET password = $1 WHERE email = $2", ["admin123", "admin@assoc.fr"]);
      console.log("Admin password reset to admin123");
    }

    const roles = ["volunteer", "civic_service", "beneficiary"];
    for (const role of roles) {
      const countResult = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = $1", [role]);
      const count = parseInt(countResult.rows[0].count, 10);

      if (count < 5) {
        for (let i = count + 1; i <= 5; i++) {
          await pool.query(
            `INSERT INTO users (email, password, lastname, firstname, role, dob, address)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (email) DO NOTHING`,
            [
              `test_${role}_${i}@assoc.fr`,
              "password123",
              `Nom${i}`,
              `Test${role.charAt(0).toUpperCase() + role.slice(1)}`,
              role,
              "2000-01-01",
              `${i} Rue du Test`,
            ]
          );
        }
        console.log(`Seeded 5 ${role}s`);
      }
    }
  } catch (e: any) {
    console.error("Seeding error:", e.message);
  }
}

async function startServer() {
  await initializeDatabase();
  await seedUsers();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  app.use("/uploads", express.static(uploadsPath));

  app.post("/api/upload", async (req: Request, res: Response) => {
    try {
      const { image, name } = req.body;
      if (!image) return res.status(400).json({ error: "Pas d'image" });

      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${Date.now()}-${name || "upload"}`;
      const filePath = path.join(uploadsPath, fileName);

      fs.writeFileSync(filePath, buffer);
      res.json({ url: `/uploads/${fileName}` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await pool.query("SELECT * FROM users WHERE email = $1 AND password = $2", [email, password]);
      const user = result.rows[0];

      if (user) {
        const { password: _password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } else {
        res.status(401).json({ error: "Identifiants invalides" });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/users", async (_req: Request, res: Response) => {
    try {
      const result = await pool.query("SELECT id, email, lastname, firstname, role, dob, address FROM users");
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const { email, password, lastname, firstname, role, dob, address } = req.body;
      const result = await pool.query(
        `INSERT INTO users (email, password, lastname, firstname, role, dob, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [email, password || "password123", lastname, firstname, role, dob, address]
      );
      res.json({ id: result.rows[0].id });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/users/batch", async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: "IDs invalides" });

      await withTransaction(async (client) => {
        for (const id of ids) {
          const numericId = Number(id);
          await client.query("DELETE FROM registrations WHERE user_id = $1", [numericId]);

          const activitiesResult = await client.query("SELECT id FROM activities WHERE created_by = $1", [numericId]);
          const activities = activitiesResult.rows;

          for (const act of activities) {
            await client.query(
              "DELETE FROM registrations WHERE session_id IN (SELECT id FROM sessions WHERE activity_id = $1)",
              [act.id]
            );
            await client.query("DELETE FROM sessions WHERE activity_id = $1", [act.id]);
          }

          await client.query("DELETE FROM activities WHERE created_by = $1", [numericId]);
          await client.query("DELETE FROM users WHERE id = $1", [numericId]);
        }
      });

      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  });

  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;

      await withTransaction(async (client) => {
        await client.query("DELETE FROM registrations WHERE user_id = $1", [userId]);

        const activitiesResult = await client.query("SELECT id FROM activities WHERE created_by = $1", [userId]);
        const activities = activitiesResult.rows;

        for (const act of activities) {
          await client.query(
            "DELETE FROM registrations WHERE session_id IN (SELECT id FROM sessions WHERE activity_id = $1)",
            [act.id]
          );
          await client.query("DELETE FROM sessions WHERE activity_id = $1", [act.id]);
        }

        await client.query("DELETE FROM activities WHERE created_by = $1", [userId]);
        await client.query("DELETE FROM sessions WHERE type = 'room_booking' AND id NOT IN (SELECT session_id FROM registrations)");
        await client.query("DELETE FROM users WHERE id = $1", [userId]);
      });

      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const result = await pool.query("SELECT id, email, lastname, firstname, role, dob, address FROM users WHERE id = $1", [
        req.params.id,
      ]);
      const user = result.rows[0];

      if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
      res.json(user);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const { email, password, lastname, firstname, role, dob, address } = req.body;

      if (password) {
        await pool.query(
          `UPDATE users SET email = $1, password = $2, lastname = $3, firstname = $4, role = $5, dob = $6, address = $7
           WHERE id = $8`,
          [email, password, lastname, firstname, role, dob, address, req.params.id]
        );
      } else {
        await pool.query(
          `UPDATE users SET email = $1, lastname = $2, firstname = $3, role = $4, dob = $5, address = $6
           WHERE id = $7`,
          [email, lastname, firstname, role, dob, address, req.params.id]
        );
      }

      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/activities", async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT a.*, u.firstname || ' ' || u.lastname as creator_name
        FROM activities a
        JOIN users u ON a.created_by = u.id
      `);
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/activities", async (req: Request, res: Response) => {
    try {
      const { title, description, image_url, max_participants, deadline, created_by, start_time, end_time } = req.body;

      const sessionDate = new Date(start_time).toISOString().split("T")[0];
      const existingResult = await pool.query(
        `SELECT COUNT(*) as count FROM sessions
         WHERE type = 'activity' AND DATE(start_time::timestamp) = $1::date`,
        [sessionDate]
      );

      if (parseInt(existingResult.rows[0].count, 10) > 0) {
        return res.status(400).json({ error: "Une activité existe déjà à cette date." });
      }

      const id = await withTransaction(async (client) => {
        const activityResult = await client.query(
          `INSERT INTO activities (title, description, image_url, max_participants, deadline, created_by, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING id`,
          [title, description, image_url, max_participants, deadline, created_by]
        );

        const activityId = activityResult.rows[0].id;

        await client.query(
          `INSERT INTO sessions (type, activity_id, start_time, end_time)
           VALUES ('activity', $1, $2, $3)`,
          [activityId, start_time, end_time]
        );

        return activityId;
      });

      res.json({ id });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/activities/:id/status", async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      await pool.query("UPDATE activities SET status = $1 WHERE id = $2", [status, req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/activities/:id", async (req: Request, res: Response) => {
    try {
      await withTransaction(async (client) => {
        await client.query("DELETE FROM registrations WHERE session_id IN (SELECT id FROM sessions WHERE activity_id = $1)", [
          req.params.id,
        ]);
        await client.query("DELETE FROM sessions WHERE activity_id = $1", [req.params.id]);
        await client.query("DELETE FROM activities WHERE id = $1", [req.params.id]);
      });

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/sessions", async (_req: Request, res: Response) => {
    try {
      const sessionsResult = await pool.query(`
        SELECT s.*, a.title, a.description, a.status, a.max_participants, a.image_url, a.deadline
        FROM sessions s
        LEFT JOIN activities a ON s.activity_id = a.id
      `);

      const sessionsWithParticipants = await Promise.all(
        sessionsResult.rows.map(async (s: any) => {
          const participantsResult = await pool.query(
            `SELECT r.user_id, r.role_at_registration, u.firstname, u.lastname, u.role
             FROM registrations r
             JOIN users u ON r.user_id = u.id
             WHERE r.session_id = $1`,
            [s.id]
          );
          return { ...s, participants: participantsResult.rows };
        })
      );

      res.json(sessionsWithParticipants);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/sessions/homework", async (req: Request, res: Response) => {
    try {
      const { start_time, end_time } = req.body;

      const sessionDate = new Date(start_time).toISOString().split("T")[0];
      const existingResult = await pool.query(
        `SELECT COUNT(*) as count FROM sessions
         WHERE type = 'homework_help' AND DATE(start_time::timestamp) = $1::date`,
        [sessionDate]
      );

      if (parseInt(existingResult.rows[0].count, 10) > 0) {
        return res.status(400).json({ error: "Une session d'aide aux devoirs existe déjà à cette date." });
      }

      const result = await pool.query(
        `INSERT INTO sessions (type, start_time, end_time)
         VALUES ('homework_help', $1, $2) RETURNING id`,
        [start_time, end_time]
      );

      res.json({ id: result.rows[0].id });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/sessions/room", async (req: Request, res: Response) => {
    try {
      const { start_time, end_time, user_id } = req.body;

      const sessionDate = new Date(start_time).toISOString().split("T")[0];
      const existingResult = await pool.query(
        `SELECT COUNT(*) as count FROM sessions
         WHERE type = 'room_booking' AND DATE(start_time::timestamp) = $1::date`,
        [sessionDate]
      );

      if (parseInt(existingResult.rows[0].count, 10) > 0) {
        return res.status(400).json({ error: "Une réservation de local existe déjà à cette date." });
      }

      const sessionId = await withTransaction(async (client) => {
        const result = await client.query(
          `INSERT INTO sessions (type, start_time, end_time)
           VALUES ('room_booking', $1, $2) RETURNING id`,
          [start_time, end_time]
        );

        const id = result.rows[0].id;

        await client.query(
          `INSERT INTO registrations (session_id, user_id, role_at_registration)
           VALUES ($1, $2, 'adherent')`,
          [id, user_id]
        );

        return id;
      });

      res.json({ id: sessionId });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/sessions/homework/batch", async (req: Request, res: Response) => {
    try {
      const { start_date } = req.body;
      const start = new Date(start_date);

      await withTransaction(async (client) => {
        for (let i = 0; i < 5; i++) {
          const currentDate = new Date(start);
          currentDate.setDate(currentDate.getDate() + i);

          const startTimeStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 16, 30).toISOString();
          const endTimeStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 20, 0).toISOString();

          const existsResult = await client.query("SELECT COUNT(*) as count FROM sessions WHERE type = 'homework_help' AND start_time = $1", [
            startTimeStr,
          ]);

          if (parseInt(existsResult.rows[0].count, 10) === 0) {
            await client.query(`INSERT INTO sessions (type, start_time, end_time) VALUES ('homework_help', $1, $2)`, [startTimeStr, endTimeStr]);
          }
        }
      });

      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/sessions/:id", async (req: Request, res: Response) => {
    try {
      const { start_time, end_time } = req.body;
      await pool.query("UPDATE sessions SET start_time = $1, end_time = $2 WHERE id = $3", [start_time, end_time, req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/sessions/:id", async (req: Request, res: Response) => {
    try {
      await withTransaction(async (client) => {
        await client.query("DELETE FROM registrations WHERE session_id = $1", [req.params.id]);
        await client.query("DELETE FROM sessions WHERE id = $1", [req.params.id]);
      });

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/registrations", async (req: Request, res: Response) => {
    try {
      const { session_id, user_id, role_at_registration } = req.body;

      const sessionResult = await pool.query("SELECT * FROM sessions WHERE id = $1", [session_id]);
      const session = sessionResult.rows[0];
      if (!session) return res.status(404).json({ error: "Session non trouvée." });

      if (session.type === "room_booking") {
        return res.status(400).json({ error: "Les réservations du local ne permettent pas d'inscription." });
      }

      const participantsResult = await pool.query("SELECT * FROM registrations WHERE session_id = $1", [session_id]);
      const participants = participantsResult.rows;

      if (session.type === "homework_help") {
        if (role_at_registration === "volunteer") {
          const volunteerCount = participants.filter((p: any) => p.role_at_registration === "volunteer").length;
          if (volunteerCount >= 3) {
            return res.status(400).json({ error: "Maximum de 3 bénévoles atteint pour cette permanence." });
          }
        } else if (role_at_registration === "beneficiary") {
          const beneficiaryCount = participants.filter((p: any) => p.role_at_registration === "beneficiary").length;
          if (beneficiaryCount >= 15) {
            return res.status(400).json({ error: "Maximum de 15 jeunes atteint pour cette permanence." });
          }
        }
      }

      if (session.type === "activity") {
        const activityResult = await pool.query("SELECT * FROM activities WHERE id = $1", [session.activity_id]);
        const activity = activityResult.rows[0];

        if (activity && participants.length >= activity.max_participants) {
          return res.status(400).json({ error: "Nombre maximum de participants atteint." });
        }
      }

      const existingResult = await pool.query("SELECT * FROM registrations WHERE session_id = $1 AND user_id = $2", [session_id, user_id]);
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ error: "Déjà inscrit à cette session." });
      }

      await pool.query(
        `INSERT INTO registrations (session_id, user_id, role_at_registration)
         VALUES ($1, $2, $3)`,
        [session_id, user_id, role_at_registration]
      );

      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/registrations", async (req: Request, res: Response) => {
    try {
      const { session_id, user_id } = req.body;
      await pool.query("DELETE FROM registrations WHERE session_id = $1 AND user_id = $2", [session_id, user_id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error("Server startup error:", e);
  process.exit(1);
});
