const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const say = require("say");
const os = require("os");
const { createClient } = require("@deepgram/sdk");

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: "uploads/" });

app.post("/transcribe", upload.single("file"), async (req, res) => {
  try {
    const pathToFile = req.file.path;
    const deepgramApiKey = "c6412f6023d0d8b0489eaa02a5a147246c8b6a87";
    const deepgram = createClient(deepgramApiKey);

    // Perform transcription using Deepgram
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      fs.readFileSync(pathToFile),
      { smart_format: true, model: "nova-2", language: "en-US" }
    );

    if (error) throw error;
    if (!error) {
      const transcriptionText =
        result?.results?.channels[0].alternatives[0]?.transcript;
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="transcription.txt"'
      );
      res.setHeader("Content-Type", "text/plain");

      res.send(transcriptionText);
    }
  } catch (err) {
    console.log(err);
  }
});


app.post("/generate-audio", upload.single("file"), async(req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File is required." });
  }

  let text;
  const inputFile = req.file.path;

  if (req.file.mimetype === "application/pdf") {
    // Handle PDF file
    const pdf = require("pdf-parse");
    const dataBuffer = fs.readFileSync(inputFile);

    try {
      const pdfData = await pdf(dataBuffer); 
      text = pdfData.text;
  } catch (error) {
      console.error("Error parsing PDF:", error);
      return res.status(500).json({ error: "Error parsing PDF." });
  }
  } else if (req.file.mimetype === "text/plain") {
    text = fs.readFileSync(inputFile, "utf-8");
  } else {
    fs.unlinkSync(inputFile); // Delete uploaded file
    return res.status(400).json({ error: "Unsupported file type." });
  }

  let voice;
  const platform = os.platform();

  // Choose the voice based on the platform
  if (platform === "darwin") {
    // macOS default voice
    voice = "Alex";
  } else if (platform === "win32") {
    // Windows default voice
    voice = "Microsoft David Desktop";
  } else if (platform === "linux") {
    // Linux default voice (example)
    voice = "espeak";
  } else {
    // Default voice for other platforms
    voice = "default";
  }

  // Use the 'say' package to perform text-to-speech synthesis
  say.export(text, voice, 1, path.join(__dirname, "output.wav"), (err) => {
    if (err) {
      console.error("Error generating audio:", err);
      return res.status(500).json({ error: "Error generating audio." });
    }

    const audioData = fs.readFileSync(path.join(__dirname, "output.wav"));
    res.set("Content-Type", "audio/wav");
    res.status(200).send(audioData);

    // Remove the generated audio file
    fs.unlinkSync(path.join(__dirname, "output.wav"));
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
