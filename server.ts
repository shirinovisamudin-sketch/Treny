import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Отдаем статические файлы из собранной папки dist
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));

// Для всех остальных маршрутов отдаем index.html (для React Router, если он появится)
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Сервер запущен на порту: ${PORT}`);
});
