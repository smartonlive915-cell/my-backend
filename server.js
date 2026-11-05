const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// In-memory storage for projects
let projects = {};

// Root route 
app.get('/', (req, res) => {
    res.status(200).send('Backend API is running successfully!');
});

// GET /projects
app.get('/projects', (req, res) => {
    const projectList = Object.values(projects);
    res.status(200).json(projectList);
});

// POST /projects
app.post('/projects', (req, res) => {
    const { title, topic, genre } = req.body;
    const id = 'proj_' + Date.now();
    const newProject = {
        id,
        title: title || 'Untitled Project',
        topic: topic || '',
        genre: genre || '',
        script: '',
        audio_url: ''
    };
    projects[id] = newProject;
    res.status(201).json(newProject);
});

// GET /projects/:id
app.get('/projects/:id', (req, res) => {
    const { id } = req.params;
    const project = projects[id];
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    res.status(200).json(project);
});

// POST /projects/:id/generate-script (Gemini API Integration)
app.post('/projects/:id/generate-script', async (req, res) => {
    try {
        const { id } = req.params;
        const { prompt, topic } = req.body;
        
        if (!projects[id]) {
            projects[id] = { id, title: 'Project', topic: topic || '' };
        }
        const project = projects[id];
        
        const apiKey = process.env.GEMINI_API_KEY;
        const textPrompt = prompt || `Create an engaging video script about: ${project.topic || topic}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: textPrompt }] }]
            })
        });

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error generating script";

        project.script = generatedText;
        res.status(200).json({ success: true, script: generatedText, project });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /projects/:id/generate (ElevenLabs API Integration)
app.post('/projects/:id/generate', async (req, res) => {
    try {
        const { id } = req.params;
        const { text, voice_id } = req.body;
        const project = projects[id];
        const textToSpeech = text || (project ? project.script : 'Hello');

        const apiKey = process.env.ELEVENLABS_API_KEY;
        const defaultVoiceId = voice_id || '21m00Tcm4TlvDq8ikWAM'; 

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${defaultVoiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify({
                text: textToSpeech,
                model_id: 'eleven_multilingual_v2',
                voice_settings: { stability: 0.5, similarity_boost: 0.5 }
            })
        });

        if (!response.ok) {
            const errData = await response.text();
            return res.status(response.status).json({ error: errData });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
