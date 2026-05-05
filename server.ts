import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for n8n lookup proxy
  app.post("/api/customer-lookup", async (req, res) => {
    try {
      const { cedula } = req.body;
      console.log(`Buscando cédula ${cedula} en n8n...`);
      
      const response = await axios.post('https://yulietmendoza668.app.n8n.cloud/webhook/0841d8ee-f02e-46a7-9b52-4c23bb1f8f38', {
        cedula: cedula
      });

      res.json(response.data);
    } catch (error: any) {
      console.error("Error calling n8n:", error.message);
      res.status(500).json({ error: "Error al conectar con n8n", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
