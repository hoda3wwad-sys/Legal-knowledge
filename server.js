const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = process.env.PORT || 3000;
const uploadsDir = path.join(__dirname, "uploads");
const dbFile = path.join(__dirname, "research.db");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-_]/g, "_")}`;
      cb(null, safeName);
    },
  }),
  limits: {
    fileSize: 1000 * 1024 * 1024,
  },
});

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error("فشل فتح قاعدة البيانات:", err);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS research (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      title TEXT NOT NULL,
      abstract TEXT,
      fileName TEXT,
      fileUrl TEXT,
      createdAt INTEGER NOT NULL
    )`
  );
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use("/uploads", express.static(uploadsDir));

app.get("/api/research", (req, res) => {
  db.all(`SELECT * FROM research ORDER BY createdAt DESC`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "فشل جلب الأبحاث." });
    }
    res.json(rows);
  });
});

app.post("/api/research", upload.single("file"), (req, res) => {
  const { name, role, title, abstract } = req.body;
  const file = req.file;

  if (!name || !role || !title) {
    return res.status(400).json({ error: "الاسم والمهنة والعنوان مطلوبة." });
  }

  const fileName = file ? file.originalname : "";
  const fileUrl = file ? `/uploads/${file.filename}` : "";
  const createdAt = Date.now();

  db.run(
    `INSERT INTO research (name, role, title, abstract, fileName, fileUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, role, title, abstract || "", fileName, fileUrl, createdAt],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "فشل حفظ البحث." });
      }

      db.get(`SELECT * FROM research WHERE id = ?`, [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ error: "فشل جلب البحث بعد الحفظ." });
        }
        res.status(201).json(row);
      });
    }
  );
});

app.delete("/api/research/:id", (req, res) => {
  const id = Number(req.params.id);
  db.get(`SELECT * FROM research WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "فشل جلب البحث." });
    }
    if (!row) {
      return res.status(404).json({ error: "البحث غير موجود." });
    }

    db.run(`DELETE FROM research WHERE id = ?`, [id], (err) => {
      if (err) {
        return res.status(500).json({ error: "فشل حذف البحث." });
      }

      if (row.fileUrl) {
        const filePath = path.join(uploadsDir, path.basename(row.fileUrl));
        fs.unlink(filePath, () => {
          return res.json({ success: true });
        });
      } else {
        res.json({ success: true });
      }
    });
  });
});

app.listen(port, () => {
  console.log(`الخادم يعمل على http://localhost:${port}`);
});
