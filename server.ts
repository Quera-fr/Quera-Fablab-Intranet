import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import fs from "fs";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

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

const pool = mysql.createPool({
	host: env("DB_HOST", "host") || "localhost",
	port: parseInt(env("DB_PORT", "port") || "3306", 10),
	database: env("DB_NAME", "dbname") || "intranet",
	user: env("DB_USER", "user") || "root",
	password: env("DB_PASSWORD", "password") || "",
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

const withTransaction = async <T>(
	callback: (conn: mysql.PoolConnection) => Promise<T>,
): Promise<T> => {
	const conn = await pool.getConnection();
	try {
		await conn.query("START TRANSACTION");
		const result = await callback(conn);
		await conn.query("COMMIT");
		return result;
	} catch (e) {
		await conn.query("ROLLBACK");
		throw e;
	} finally {
		await conn.release();
	}
};

const publicPath = path.join(__dirname, "public");
const uploadsPath = path.join(publicPath, "uploads");
if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath);
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);

async function initializeDatabase() {
	const conn = await pool.getConnection();
	try {
		await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        lastname VARCHAR(255),
        firstname VARCHAR(255),
        role VARCHAR(255),
        dob VARCHAR(255),
        address VARCHAR(255)
      )
    `);

		await conn.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        image_url VARCHAR(255),
        max_participants INT,
        deadline VARCHAR(255),
        status VARCHAR(255) DEFAULT 'pending',
        created_by INT,
        FOREIGN KEY(created_by) REFERENCES users(id)
      )
    `);

		await conn.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(255),
        activity_id INT,
        start_time VARCHAR(255),
        end_time VARCHAR(255),
        FOREIGN KEY(activity_id) REFERENCES activities(id)
      )
    `);

		await conn.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT,
        user_id INT,
        role_at_registration VARCHAR(255),
        FOREIGN KEY(session_id) REFERENCES sessions(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

		await conn.query(`
      CREATE TABLE IF NOT EXISTS quera_point_managers (
        date VARCHAR(255) PRIMARY KEY,
        user_id INT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

		await conn.query(`
      CREATE TABLE IF NOT EXISTS quera_points (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date VARCHAR(255) NOT NULL,
        manager_user_id INT NOT NULL,
        beneficiary_user_id INT NOT NULL,
        delta INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        comment TEXT,
        FOREIGN KEY(manager_user_id) REFERENCES users(id),
        FOREIGN KEY(beneficiary_user_id) REFERENCES users(id),
        INDEX idx_quera_points_date_manager (date, manager_user_id)
      )
    `);

		await conn.query(`
      CREATE TABLE IF NOT EXISTS golden_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        beneficiary_user_id INT NOT NULL,
        assigned_by_user_id INT NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        starts_at VARCHAR(255) NOT NULL,
        ends_at VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_month_year (month, year),
        FOREIGN KEY(beneficiary_user_id) REFERENCES users(id),
        FOREIGN KEY(assigned_by_user_id) REFERENCES users(id)
      )
    `);

		console.log("Database tables initialized");
	} catch (error) {
		console.error("Error initializing database:", error);
	} finally {
		await conn.release();
	}
}

async function seedUsers() {
	if (String(process.env.SEED_USERS || "false").toLowerCase() !== "true") {
		console.log("SeedUsers skipped (set SEED_USERS=true to enable)");
		return;
	}

	try {
		const [adminResult] = await pool.query(
			"SELECT * FROM users WHERE email = ?",
			["admin@assoc.fr"],
		);
		const admin = (adminResult as any)[0];

		if (!admin) {
			await pool.query(
				`INSERT INTO users (email, password, lastname, firstname, role, dob, address)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
				[
					"admin@assoc.fr",
					"admin123",
					"Admin",
					"Super",
					"admin",
					"1980-01-01",
					"123 Rue de l'Assoc",
				],
			);
			console.log("Admin seeded: admin@assoc.fr / admin123");
		} else if (admin.password !== "admin123") {
			await pool.query("UPDATE users SET password = ? WHERE email = ?", [
				"admin123",
				"admin@assoc.fr",
			]);
			console.log("Admin password reset to admin123");
		}

		// Ne plus créer d'utilisateurs de test par défaut
		// const roles = ["volunteer", "civic_service", "beneficiary"];
		// ...
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
			const [result] = await pool.query(
				"SELECT * FROM users WHERE email = ? AND password = ?",
				[email, password],
			);
			const user = (result as any)[0];

      if (user) {
        const { password: _password, ...userWithoutPassword } = user;

        const today = new Date().toISOString().split("T")[0];
        const [ticketRows] = await pool.query(
          `SELECT id, month, year, starts_at, ends_at
           FROM golden_tickets
           WHERE beneficiary_user_id = ? AND starts_at <= ? AND ends_at >= ?`,
          [user.id, today, today],
        );
        const ticket = (ticketRows as any)[0] ?? null;

        res.json({ ...userWithoutPassword, goldenTicket: ticket });
      } else {
        res.status(401).json({ error: "Identifiants invalides" });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

	app.get("/api/users", async (_req: Request, res: Response) => {
		try {
			const today = new Date().toISOString().split("T")[0];
			const [result] = await pool.query(
				`SELECT
					u.id,
					u.email,
					u.lastname,
					u.firstname,
					u.role,
					u.dob,
					u.address,
					gt.id AS golden_ticket_id,
					gt.month AS golden_ticket_month,
					gt.year AS golden_ticket_year,
					gt.starts_at AS golden_ticket_starts_at,
					gt.ends_at AS golden_ticket_ends_at
				FROM users u
				LEFT JOIN golden_tickets gt
					ON gt.beneficiary_user_id = u.id
					AND gt.starts_at <= ?
					AND gt.ends_at >= ?`,
				[today, today],
			);

			const users = (result as any[]).map((row) => ({
				id: row.id,
				email: row.email,
				lastname: row.lastname,
				firstname: row.firstname,
				role: row.role,
				dob: row.dob,
				address: row.address,
				goldenTicket: row.golden_ticket_id
					? {
							id: row.golden_ticket_id,
							month: row.golden_ticket_month,
							year: row.golden_ticket_year,
							starts_at: row.golden_ticket_starts_at,
							ends_at: row.golden_ticket_ends_at,
					  }
					: null,
			}));

			res.json(users);
		} catch (e: any) {
			res.status(500).json({ error: e.message });
		}
	});

	app.post("/api/users", async (req: Request, res: Response) => {
		try {
			const { email, password, lastname, firstname, role, dob, address } =
				req.body;
			const [result] = await pool.query(
				`INSERT INTO users (email, password, lastname, firstname, role, dob, address)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
				[
					email,
					password || "password123",
					lastname,
					firstname,
					role,
					dob,
					address,
				],
			);
			res.json({ id: (result as any).insertId });
		} catch (e: any) {
			res.status(400).json({ error: e.message });
		}
	});

	app.delete("/api/users/batch", async (req: Request, res: Response) => {
		try {
			const { ids } = req.body;
			if (!ids || !Array.isArray(ids))
				return res.status(400).json({ error: "IDs invalides" });

			await withTransaction(async (conn) => {
				for (const id of ids) {
					const numericId = Number(id);
					await conn.query("DELETE FROM registrations WHERE user_id = ?", [
						numericId,
					]);

					const [activitiesResult] = await conn.query(
						"SELECT id FROM activities WHERE created_by = ?",
						[numericId],
					);
					const activities = activitiesResult as any;

					for (const act of activities) {
						await conn.query(
							"DELETE FROM registrations WHERE session_id IN (SELECT id FROM sessions WHERE activity_id = ?)",
							[act.id],
						);
						await conn.query("DELETE FROM sessions WHERE activity_id = ?", [
							act.id,
						]);
					}

					await conn.query("DELETE FROM activities WHERE created_by = ?", [
						numericId,
					]);
					await conn.query("DELETE FROM users WHERE id = ?", [numericId]);
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

			await withTransaction(async (conn) => {
				await conn.query("DELETE FROM registrations WHERE user_id = ?", [
					userId,
				]);

				const [activitiesResult] = await conn.query(
					"SELECT id FROM activities WHERE created_by = ?",
					[userId],
				);
				const activities = activitiesResult as any;

				for (const act of activities) {
					await conn.query(
						"DELETE FROM registrations WHERE session_id IN (SELECT id FROM sessions WHERE activity_id = ?)",
						[act.id],
					);
					await conn.query("DELETE FROM sessions WHERE activity_id = ?", [
						act.id,
					]);
				}

				await conn.query("DELETE FROM activities WHERE created_by = ?", [
					userId,
				]);
				await conn.query(
					"DELETE FROM sessions WHERE type = 'room_booking' AND id NOT IN (SELECT session_id FROM registrations)",
				);
				await conn.query("DELETE FROM users WHERE id = ?", [userId]);
			});

			res.json({ success: true });
		} catch (e: any) {
			res.status(400).json({ error: e.message });
		}
	});

	app.get("/api/users/:id", async (req: Request, res: Response) => {
		try {
			const today = new Date().toISOString().split("T")[0];
			const [result] = await pool.query(
				`SELECT
					u.id,
					u.email,
					u.lastname,
					u.firstname,
					u.role,
					u.dob,
					u.address,
					gt.id AS golden_ticket_id,
					gt.month AS golden_ticket_month,
					gt.year AS golden_ticket_year,
					gt.starts_at AS golden_ticket_starts_at,
					gt.ends_at AS golden_ticket_ends_at
				FROM users u
				LEFT JOIN golden_tickets gt
					ON gt.beneficiary_user_id = u.id
					AND gt.starts_at <= ?
					AND gt.ends_at >= ?
				WHERE u.id = ?`,
				[today, today, req.params.id],
			);
			const row = (result as any)[0];

			if (!row)
				return res.status(404).json({ error: "Utilisateur non trouvé" });

			const user = {
				id: row.id,
				email: row.email,
				lastname: row.lastname,
				firstname: row.firstname,
				role: row.role,
				dob: row.dob,
				address: row.address,
				goldenTicket: row.golden_ticket_id
					? {
							id: row.golden_ticket_id,
							month: row.golden_ticket_month,
							year: row.golden_ticket_year,
							starts_at: row.golden_ticket_starts_at,
							ends_at: row.golden_ticket_ends_at,
					  }
					: null,
			};

			res.json(user);
		} catch (e: any) {
			res.status(500).json({ error: e.message });
		}
	});

	app.patch("/api/users/:id", async (req: Request, res: Response) => {
		try {
			const { email, password, lastname, firstname, role, dob, address } =
				req.body;

			if (password) {
				await pool.query(
					`UPDATE users SET email = ?, password = ?, lastname = ?, firstname = ?, role = ?, dob = ?, address = ?
           WHERE id = ?`,
					[
						email,
						password,
						lastname,
						firstname,
						role,
						dob,
						address,
						req.params.id,
					],
				);
			} else {
				await pool.query(
					`UPDATE users SET email = ?, lastname = ?, firstname = ?, role = ?, dob = ?, address = ?
           WHERE id = ?`,
					[email, lastname, firstname, role, dob, address, req.params.id],
				);
			}

			res.json({ success: true });
		} catch (e: any) {
			res.status(400).json({ error: e.message });
		}
	});

	app.get("/api/activities", async (_req: Request, res: Response) => {
		try {
			const [result] = await pool.query(`
        SELECT a.*, CONCAT(u.firstname, ' ', u.lastname) as creator_name
        FROM activities a
        JOIN users u ON a.created_by = u.id
      `);
			res.json(result);
		} catch (e: any) {
			res.status(500).json({ error: e.message });
		}
	});

	app.post("/api/activities", async (req: Request, res: Response) => {
		try {
			const {
				title,
				description,
				image_url,
				max_participants,
				deadline,
				created_by,
				start_time,
				end_time,
			} = req.body;

			const sessionDate = new Date(start_time).toISOString().split("T")[0];
			const [existingResult] = await pool.query(
				`SELECT COUNT(*) as count FROM sessions
         WHERE type = 'activity' AND DATE(start_time) = ?`,
				[sessionDate],
			);

			if (parseInt((existingResult as any)[0].count, 10) > 0) {
				return res
					.status(400)
					.json({ error: "Une activité existe déjà à cette date." });
			}

			const id = await withTransaction(async (conn) => {
				const [activityResult] = await conn.query(
					`INSERT INTO activities (title, description, image_url, max_participants, deadline, created_by, status)
           VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
					[
						title,
						description,
						image_url,
						max_participants,
						deadline,
						created_by,
					],
				);

				const activityId = (activityResult as any).insertId;

				await conn.query(
					`INSERT INTO sessions (type, activity_id, start_time, end_time)
           VALUES (?, ?, ?, ?)`,
					["activity", activityId, start_time, end_time],
				);

				return activityId;
			});

			res.json({ id });
		} catch (e: any) {
			res.status(400).json({ error: e.message });
		}
	});

	app.patch(
		"/api/activities/:id/status",
		async (req: Request, res: Response) => {
			try {
				const { status } = req.body;
				await pool.query("UPDATE activities SET status = ? WHERE id = ?", [
					status,
					req.params.id,
				]);
				res.json({ success: true });
			} catch (e: any) {
				res.status(500).json({ error: e.message });
			}
		},
	);

	app.delete("/api/activities/:id", async (req: Request, res: Response) => {
		try {
			await withTransaction(async (conn) => {
				await conn.query(
					"DELETE FROM registrations WHERE session_id IN (SELECT id FROM sessions WHERE activity_id = ?)",
					[req.params.id],
				);
				await conn.query("DELETE FROM sessions WHERE activity_id = ?", [
					req.params.id,
				]);
				await conn.query("DELETE FROM activities WHERE id = ?", [
					req.params.id,
				]);
			});

			res.json({ success: true });
		} catch (e: any) {
			res.status(500).json({ error: e.message });
		}
	});

	app.get("/api/sessions", async (_req: Request, res: Response) => {
		try {
			const [sessionsResult] = await pool.query(`
        SELECT s.*, a.title, a.description, a.status, a.max_participants, a.image_url, a.deadline
        FROM sessions s
        LEFT JOIN activities a ON s.activity_id = a.id
      `);

			const today = new Date().toISOString().split("T")[0];

			const sessionsWithParticipants = await Promise.all(
				(sessionsResult as any).map(async (s: any) => {
					const [participantsResult] = await pool.query(
						`SELECT
							r.user_id,
							r.role_at_registration,
							u.firstname,
							u.lastname,
							u.role,
							gt.id AS golden_ticket_id,
							gt.month AS golden_ticket_month,
							gt.year AS golden_ticket_year,
							gt.starts_at AS golden_ticket_starts_at,
							gt.ends_at AS golden_ticket_ends_at
             FROM registrations r
             JOIN users u ON r.user_id = u.id
             LEFT JOIN golden_tickets gt
               ON gt.beneficiary_user_id = u.id
              AND gt.starts_at <= ?
              AND gt.ends_at >= ?
             WHERE r.session_id = ?`,
						[today, today, s.id],
					);
							const participants = (participantsResult as any[]).map((p) => ({
						user_id: p.user_id,
						role_at_registration: p.role_at_registration,
						firstname: p.firstname,
						lastname: p.lastname,
						role: p.role,
						goldenTicket: p.golden_ticket_id
							? {
									id: p.golden_ticket_id,
									month: p.golden_ticket_month,
									year: p.golden_ticket_year,
									starts_at: p.golden_ticket_starts_at,
									ends_at: p.golden_ticket_ends_at,
						  }
							: null,
					}));

					return { ...s, participants };
				}),
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
			const [existingResult] = await pool.query(
				`SELECT COUNT(*) as count FROM sessions
         WHERE type = 'homework_help' AND DATE(start_time) = ?`,
				[sessionDate],
			);

			if (parseInt((existingResult as any)[0].count, 10) > 0) {
				return res.status(400).json({
					error: "Une session d'aide aux devoirs existe déjà à cette date.",
				});
			}

			const [result] = await pool.query(
				`INSERT INTO sessions (type, start_time, end_time)
         VALUES (?, ?, ?)`,
				["homework_help", start_time, end_time],
			);

			res.json({ id: (result as any).insertId });
		} catch (e: any) {
			res.status(400).json({ error: e.message });
		}
	});

	app.post("/api/sessions/room", async (req: Request, res: Response) => {
		try {
			const { start_time, end_time, user_id } = req.body;

			const sessionDate = new Date(start_time).toISOString().split("T")[0];
			const [existingResult] = await pool.query(
				`SELECT COUNT(*) as count FROM sessions
         WHERE type = 'room_booking' AND DATE(start_time) = ?`,
				[sessionDate],
			);

			if (parseInt((existingResult as any)[0].count, 10) > 0) {
				return res.status(400).json({
					error: "Une réservation de local existe déjà à cette date.",
				});
			}

			const sessionId = await withTransaction(async (conn) => {
				const [result] = await conn.query(
					`INSERT INTO sessions (type, start_time, end_time)
           VALUES (?, ?, ?)`,
					["room_booking", start_time, end_time],
				);

				const id = (result as any).insertId;

				await conn.query(
					`INSERT INTO registrations (session_id, user_id, role_at_registration)
           VALUES (?, ?, ?)`,
					[id, user_id, "adherent"],
				);

				return id;
			});

			res.json({ id: sessionId });
		} catch (e: any) {
			res.status(400).json({ error: e.message });
		}
	});

	app.post(
		"/api/sessions/homework/batch",
		async (req: Request, res: Response) => {
			try {
				const { start_date } = req.body;
				const start = new Date(start_date);

				await withTransaction(async (conn) => {
					for (let i = 0; i < 5; i++) {
						const currentDate = new Date(start);
						currentDate.setDate(currentDate.getDate() + i);

						const startTimeStr = new Date(
							currentDate.getFullYear(),
							currentDate.getMonth(),
							currentDate.getDate(),
							16,
							30,
						).toISOString();
						const endTimeStr = new Date(
							currentDate.getFullYear(),
							currentDate.getMonth(),
							currentDate.getDate(),
							20,
							0,
						).toISOString();

						const [existsResult] = await conn.query(
							"SELECT COUNT(*) as count FROM sessions WHERE type = 'homework_help' AND start_time = ?",
							[startTimeStr],
						);

						if (parseInt((existsResult as any)[0].count, 10) === 0) {
							await conn.query(
								`INSERT INTO sessions (type, start_time, end_time) VALUES (?, ?, ?)`,
								["homework_help", startTimeStr, endTimeStr],
							);
						}
					}
				});

				res.json({ success: true });
			} catch (e: any) {
				res.status(400).json({ error: e.message });
			}
		},
	);

	app.patch("/api/sessions/:id", async (req: Request, res: Response) => {
		try {
			const { start_time, end_time } = req.body;
			await pool.query(
				"UPDATE sessions SET start_time = ?, end_time = ? WHERE id = ?",
				[start_time, end_time, req.params.id],
			);
			res.json({ success: true });
		} catch (e: any) {
			res.status(400).json({ error: e.message });
		}
	});

	app.delete("/api/sessions/:id", async (req: Request, res: Response) => {
		try {
			await withTransaction(async (conn) => {
				await conn.query("DELETE FROM registrations WHERE session_id = ?", [
					req.params.id,
				]);
				await conn.query("DELETE FROM sessions WHERE id = ?", [req.params.id]);
			});

			res.json({ success: true });
		} catch (e: any) {
			res.status(500).json({ error: e.message });
		}
	});

	app.post("/api/registrations", async (req: Request, res: Response) => {
		try {
			const { session_id, user_id, role_at_registration } = req.body;

			const [sessionResult] = await pool.query(
				"SELECT * FROM sessions WHERE id = ?",
				[session_id],
			);
			const session = (sessionResult as any)[0];
			if (!session)
				return res.status(404).json({ error: "Session non trouvée." });

			if (session.type === "room_booking") {
				return res.status(400).json({
					error: "Les réservations du local ne permettent pas d'inscription.",
				});
			}

			const [participantsResult] = await pool.query(
				"SELECT * FROM registrations WHERE session_id = ?",
				[session_id],
			);
			const participants = participantsResult as any;

			if (session.type === "homework_help") {
				if (role_at_registration === "volunteer") {
					const volunteerCount = participants.filter(
						(p: any) => p.role_at_registration === "volunteer",
					).length;
					if (volunteerCount >= 3) {
						return res.status(400).json({
							error: "Maximum de 3 bénévoles atteint pour cette permanence.",
						});
					}
				} else if (role_at_registration === "beneficiary") {
					const beneficiaryCount = participants.filter(
						(p: any) => p.role_at_registration === "beneficiary",
					).length;
					if (beneficiaryCount >= 15) {
						return res.status(400).json({
							error: "Maximum de 15 jeunes atteint pour cette permanence.",
						});
					}
				}
			}

			if (session.type === "activity") {
				const [activityResult] = await pool.query(
					"SELECT * FROM activities WHERE id = ?",
					[session.activity_id],
				);
				const activity = (activityResult as any)[0];

				if (activity && participants.length >= activity.max_participants) {
					return res
						.status(400)
						.json({ error: "Nombre maximum de participants atteint." });
				}
			}

			const [existingResult] = await pool.query(
				"SELECT * FROM registrations WHERE session_id = ? AND user_id = ?",
				[session_id, user_id],
			);
			if ((existingResult as any).length > 0) {
				return res.status(400).json({ error: "Déjà inscrit à cette session." });
			}

			await pool.query(
				`INSERT INTO registrations (session_id, user_id, role_at_registration)
         VALUES (?, ?, ?)`,
				[session_id, user_id, role_at_registration],
			);

			res.json({ success: true });
		} catch (e: any) {
			res.status(400).json({ error: e.message });
		}
	});

	app.delete("/api/registrations", async (req: Request, res: Response) => {
		try {
			const { session_id, user_id } = req.body;
			await pool.query(
				"DELETE FROM registrations WHERE session_id = ? AND user_id = ?",
				[session_id, user_id],
			);
			res.json({ success: true });
		} catch (e: any) {
			res.status(500).json({ error: e.message });
		}
	});

	app.get("/api/quera-point-managers", async (_req: Request, res: Response) => {
		try {
			const [result] = await pool.query(`
        SELECT q.date, q.user_id, u.firstname, u.lastname, u.role
        FROM quera_point_managers q
        JOIN users u ON q.user_id = u.id
      `);
			res.json(result);
		} catch (e: any) {
			res.status(500).json({ error: e.message });
		}
	});

	app.post("/api/quera-point-managers", async (req: Request, res: Response) => {
		try {
			const { date, user_id } = req.body;
			if (!user_id) {
				await pool.query("DELETE FROM quera_point_managers WHERE date = ?", [
					date,
				]);
			} else {
				await pool.query(
					`INSERT INTO quera_point_managers (date, user_id) 
           VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
					[date, user_id],
				);
			}
			res.json({ success: true });
		} catch (e: any) {
			res.status(400).json({ error: e.message });
		}
	});

	app.get("/api/quera-points", async (req: Request, res: Response) => {
		try {
			const date = String(req.query.date || "");
			const managerUserIdRaw = req.query.manager_user_id;
			const managerUserId =
				managerUserIdRaw !== undefined ? Number(managerUserIdRaw) : null;
			if (!date) return res.status(400).json({ error: "date requise" });

			const params: any[] = [date];
			let managerWhere = "";
			if (managerUserId !== null && !Number.isNaN(managerUserId)) {
				params.push(managerUserId);
				managerWhere = " AND manager_user_id = ?";
			}

			const [totalsResult] = await pool.query(
				`SELECT COALESCE(SUM(delta), 0) AS total
         FROM quera_points
         WHERE date = ?${managerWhere}`,
				params,
			);

			const [perBeneficiaryResult] = await pool.query(
				`SELECT qp.beneficiary_user_id AS user_id,
                COALESCE(SUM(qp.delta), 0) AS points,
                u.firstname, u.lastname
         FROM quera_points qp
         JOIN users u ON u.id = qp.beneficiary_user_id
         WHERE qp.date = ?${managerWhere}
         GROUP BY qp.beneficiary_user_id, u.firstname, u.lastname
         ORDER BY points DESC, u.lastname ASC, u.firstname ASC`,
				params,
			);

			const total = Number((totalsResult as any)[0]?.total ?? 0);
			const remaining = Math.max(0, 5 - total);

			res.json({
				date,
				manager_user_id: managerUserId,
				total,
				remaining,
				beneficiaries: (perBeneficiaryResult as any).map((r: any) => ({
					user_id: Number(r.user_id),
					firstname: r.firstname,
					lastname: r.lastname,
					points: Number(r.points),
				})),
			});
		} catch (e: any) {
			res.status(500).json({ error: e.message });
		}
	});

	app.get("/api/quera-points/totals", async (_req: Request, res: Response) => {
		try {
			const [result] = await pool.query(
				`SELECT qp.beneficiary_user_id AS user_id,
                COALESCE(SUM(qp.delta), 0) AS total_points,
                u.firstname, u.lastname
         FROM quera_points qp
         JOIN users u ON u.id = qp.beneficiary_user_id
         GROUP BY qp.beneficiary_user_id, u.firstname, u.lastname
         ORDER BY total_points DESC, u.lastname ASC, u.firstname ASC`,
			);
			res.json(
				(result as any).map((r: any) => ({
					user_id: Number(r.user_id),
					firstname: r.firstname,
					lastname: r.lastname,
					total_points: Number(r.total_points),
				})),
			);
		} catch (e: any) {
			res.status(500).json({ error: e.message });
		}
	});

	app.post("/api/quera-points", async (req: Request, res: Response) => {
		try {
			const { date, manager_user_id, beneficiary_user_id, delta, comment } =
				req.body;
			const managerUserId = Number(manager_user_id);
			const beneficiaryUserId = Number(beneficiary_user_id);
			const deltaInt = Number(delta);

			if (!date) return res.status(400).json({ error: "date requise" });
			if (
				Number.isNaN(managerUserId) ||
				Number.isNaN(beneficiaryUserId) ||
				Number.isNaN(deltaInt)
			) {
				return res.status(400).json({ error: "Paramètres invalides" });
			}
			if (!Number.isInteger(deltaInt) || deltaInt === 0) {
				return res
					.status(400)
					.json({ error: "delta doit être un entier non nul" });
			}
			if (Math.abs(deltaInt) > 5) {
				return res.status(400).json({ error: "delta trop grand" });
			}

			const [managerCheck] = await pool.query(
				"SELECT user_id FROM quera_point_managers WHERE date = ?",
				[date],
			);
			const designatedManagerId = (managerCheck as any)[0]?.user_id;
			if (
				!designatedManagerId ||
				Number(designatedManagerId) !== managerUserId
			) {
				return res.status(403).json({
					error: "Vous n'êtes pas responsable Quera Point de cette journée.",
				});
			}

			const [beneficiaryPresentResult] = await pool.query(
				`SELECT 1
         FROM registrations r
         JOIN sessions s ON s.id = r.session_id
         JOIN users u ON u.id = r.user_id
         WHERE r.user_id = ?
           AND u.role = 'beneficiary'
           AND DATE(s.start_time) = ?
         LIMIT 1`,
				[beneficiaryUserId, date],
			);
			if ((beneficiaryPresentResult as any).length === 0) {
				return res.status(400).json({
					error: "Le bénéficiaire n'est pas inscrit à une session aujourd'hui.",
				});
			}

			const { totalForDay, beneficiaryTotal } = await withTransaction(
				async (conn) => {
					const [totals] = await conn.query(
						`SELECT COALESCE(SUM(delta), 0) AS total
           FROM quera_points
           WHERE date = ? AND manager_user_id = ?`,
						[date, managerUserId],
					);
					const [beneficiaryTotals] = await conn.query(
						`SELECT COALESCE(SUM(delta), 0) AS total
           FROM quera_points
           WHERE date = ? AND manager_user_id = ? AND beneficiary_user_id = ?`,
						[date, managerUserId, beneficiaryUserId],
					);

					const totalForDayNum = Number((totals as any)[0]?.total ?? 0);
					const beneficiaryTotalNum = Number(
						(beneficiaryTotals as any)[0]?.total ?? 0,
					);

					if (deltaInt > 0 && totalForDayNum + deltaInt > 5) {
						throw new Error("Budget de points du jour dépassé (max 5).");
					}
					if (beneficiaryTotalNum + deltaInt < 0) {
						throw new Error(
							"Impossible de retirer plus de points que déjà donnés aujourd'hui à ce bénéficiaire.",
						);
					}

					await conn.query(
						`INSERT INTO quera_points (date, manager_user_id, beneficiary_user_id, delta, comment)
           VALUES (?, ?, ?, ?, ?)`,
						[date, managerUserId, beneficiaryUserId, deltaInt, comment ?? null],
					);

					return {
						totalForDay: totalForDayNum + deltaInt,
						beneficiaryTotal: beneficiaryTotalNum + deltaInt,
					};
				},
			);

			res.json({
				success: true,
				date,
				manager_user_id: managerUserId,
				beneficiary_user_id: beneficiaryUserId,
				total: totalForDay,
				beneficiary_total: beneficiaryTotal,
			});
		} catch (e: any) {
			const msg = e?.message ?? "Erreur";
			if (msg.includes("Budget") || msg.includes("Impossible de retirer")) {
				return res.status(400).json({ error: msg });
			}
			res.status(400).json({ error: msg });
		}
	});

  // ─── GOLDEN TICKETS ──────────────────────────────────────────────────────────
  const GOLDEN_TICKET_ASSIGNERS: string[] = ['admin', 'civic_service'];

  app.get("/api/golden-tickets/active", async (_req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [result] = await pool.query(
        `SELECT gt.id, gt.beneficiary_user_id, gt.month, gt.year, gt.starts_at, gt.ends_at,
              u.firstname, u.lastname
       FROM golden_tickets gt
       JOIN users u ON u.id = gt.beneficiary_user_id
       WHERE gt.starts_at <= ? AND gt.ends_at >= ?`,
        [today, today]
      );
      res.json((result as any)[0] ?? null);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/golden-tickets", async (req: Request, res: Response) => {
    try {
      const { beneficiary_user_id, assigned_by_user_id, month, year } = req.body;

      if (!beneficiary_user_id || !assigned_by_user_id || !month || !year) {
        return res.status(400).json({ error: "Paramètres manquants" });
      }

      const [assignerRows] = await pool.query("SELECT role FROM users WHERE id = ?", [assigned_by_user_id]);
      const assigner = (assignerRows as any)[0];
      if (!assigner || !GOLDEN_TICKET_ASSIGNERS.includes(assigner.role)) {
        return res.status(403).json({ error: "Rôle non autorisé à attribuer un golden ticket" });
      }

      const [targetRows] = await pool.query("SELECT role FROM users WHERE id = ?", [beneficiary_user_id]);
      const target = (targetRows as any)[0];
      if (!target || target.role !== 'beneficiary') {
        return res.status(400).json({ error: "L'utilisateur cible doit être un bénéficiaire" });
      }

      const starts_at = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const ends_at = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      await pool.query(
        `INSERT INTO golden_tickets (beneficiary_user_id, assigned_by_user_id, month, year, starts_at, ends_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           beneficiary_user_id = VALUES(beneficiary_user_id),
           assigned_by_user_id = VALUES(assigned_by_user_id),
           starts_at = VALUES(starts_at),
           ends_at = VALUES(ends_at),
           created_at = NOW()`,
        [beneficiary_user_id, assigned_by_user_id, month, year, starts_at, ends_at]
      );

      const [rows] = await pool.query(
        `SELECT * FROM golden_tickets WHERE month = ? AND year = ?`,
        [month, year]
      );
      res.json((rows as any)[0]);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/golden-tickets/:id", async (req: Request, res: Response) => {
    try {
      const { requester_role } = req.body;
      if (!requester_role || !GOLDEN_TICKET_ASSIGNERS.includes(requester_role)) {
        return res.status(403).json({ error: "Rôle non autorisé" });
      }
      await pool.query("DELETE FROM golden_tickets WHERE id = ?", [req.params.id]);
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
		console.log(`Server running on http://127.0.0.1:${PORT}`);
	});
}

startServer().catch((e) => {
	console.error("Server startup error:", e);
	process.exit(1);
});
