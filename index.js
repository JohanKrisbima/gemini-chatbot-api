import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = "gemini-3.5-flash";

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post("/api/chat", async (req, res) => {
  const { conversation } = req.body;

  try {
    if (!Array.isArray(conversation)) throw new Error("Message must be an array");

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }],
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: `Kamu adalah asisten virtual yang ramah, hangat, dan santai untuk website undangan pernikahan ini 😊💍.
        Aturan kamu:
        1. Fokus HANYA menjawab pertanyaan seputar website undangan pernikahan (jadwal acara, lokasi/venue, dress code, RSVP, petunjuk peta, info kado/rekening, atau cara penggunaan website undangan).
        2. Jika ditanya hal di luar topik pernikahan atau undangan, tolak dengan sopan, santai, dan ceria. Ajak mereka kembali bertanya seputar acara pernikahan.
        3. Jika informasinya belum ada atau kamu tidak tahu, arahkan pengguna dengan ramah untuk menghubungi Contact Person (CP) yang tertera di website.
        4. Gunakan nada bicara yang santai, ramah, bersahabat, dan boleh gunakan emoji secukupnya agar terkesan hangat.`,
      },
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
