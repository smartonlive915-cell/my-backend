const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/gemini', async (req, res) => {
    try {
        res.status(200).json({ success: true, message: "Gemini connected" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/elevenlabs', async (req, res) => {
    try {
        res.status(200).json({ success: true, message: "ElevenLabs connected" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
