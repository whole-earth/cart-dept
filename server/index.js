const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mcache = require('memory-cache');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Cache middleware
const cache = (duration) => {
    return (req, res, next) => {
        const key = 'cache-' + req.originalUrl || req.url;
        const cachedBody = mcache.get(key);

        if (cachedBody) {
            console.log('Serving from cache:', key);
            return res.json(JSON.parse(cachedBody));
        } else {
            res.sendResponse = res.json;
            res.json = (body) => {
                mcache.put(key, JSON.stringify(body), duration * 1000);
                res.sendResponse(body);
            };
            next();
        }
    };
};

// Keep your existing image search endpoint
app.get('/api/search-images', cache(86400), async (req, res) => {
    try {
        const query = decodeURIComponent(req.query.query);

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        console.log('Searching images for:', query);

        const response = await axios.post('https://google.serper.dev/images',
            { q: query },
            {
                headers: {
                    'X-API-KEY': process.env.SERPER_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Log the raw response
        console.log('Raw Serper response for query:', query);
        console.log('First image data:', response.data.images[0]);
        console.log('Image URLs:', response.data.images.map(img => ({
            title: img.title,
            imageUrl: img.imageUrl,
            link: img.link
        })));

        res.json(response.data.images);

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            error: 'Error fetching images',
            details: error.message
        });
    }
});

// Keep your existing proxy endpoint
app.get('/api/proxy-image', async (req, res) => {
    try {
        const imageUrl = decodeURIComponent(req.query.url);

        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required' });
        }

        const response = await axios.get(imageUrl, {
            responseType: 'stream'
        });

        // Forward content-type header
        if (response.headers['content-type']) {
            res.set('Content-Type', response.headers['content-type']);
        } else {
            res.set('Content-Type', 'image/jpeg');
        }

        res.set('Cache-Control', 'public, max-age=31536000');
        response.data.pipe(res);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            error: 'Error proxying image',
            details: error.message
        });
    }
});

// Update your themes endpoint to use caching
app.post('/api/themes', cache(86400), async (req, res) => {
    try {
        const { query } = req.body;

        // Get OpenAI completion
        const completion = await openai.chat.completions.create({
            model: "gpt-4-0125-preview",
            messages: [
                {
                    role: "system",
                    content: "You are a savvy coolhunter with expertise in cars and art, specializing in their cultural impact from the 1980s to 2024. Your mission is to uncover and showcase the fascinating connections between automobiles and artistic expression in pop culture, entertainment, and music. For any given topic, provide four related references that explore different facets of car-art relationships, focusing on unexpected or lesser-known connections. Use a casual yet articulate tone, as if you're chatting with a fellow enthusiast at a gallery opening in a converted auto shop. Your knowledge bank includes: Pop Art and Automotive Imagery: Explore how artists transformed everyday vehicles into symbols of popular culture, including album covers featuring iconic cars. Cars in Film and TV: Highlight the cultural impact of famous movie and TV cars, focusing on less obvious choices and their legacies. Music and Motors: Discuss bands named after cars and explore how racing drivers, especially from Formula One, are crossing over into the music world. Formula One's Cultural Acceleration: Analyze F1's growing influence on music and entertainment, including collaborations with artists and the presence of concerts at Grand Prix events. Artistic Automobiles: Showcase artists who use cars as their medium or subject matter in innovative ways. Exclude NASCAR references but include Formula One. Your goal is to create an engaging, interconnected web of car-art relationships that will expand users' knowledge with surprising and intriguing connections."
                },
                {
                    role: "user",
                    content: `Generate 4 related topics to "${query}" with descriptions. Each topic should have a brief description explaining its relationship to ${query}.`
                }
            ],
            functions: [
                {
                    name: "generate_related_topics",
                    description: "Generate related topics with descriptions",
                    parameters: {
                        type: "object",
                        properties: {
                            related_topics: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        title: {
                                            type: "string",
                                            description: "The title of the related topic"
                                        },
                                        description: {
                                            type: "string",
                                            description: "A detailed description of how this topic relates to the main topic"
                                        }
                                    },
                                    required: ["title", "description"]
                                }
                            }
                        },
                        required: ["related_topics"]
                    }
                }
            ],
            function_call: { name: "generate_related_topics" }
        });

        const functionResponse = JSON.parse(completion.choices[0].message.function_call.arguments);

        // Get images for the main topic
        const mainImagesResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/search-images`, {
            params: { query }
        });

        // Get images for each related topic
        const relatedTopicsWithImages = await Promise.all(
            functionResponse.related_topics.map(async (topic) => {
                const topicImagesResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/search-images`, {
                    params: { query: topic.title }
                });

                return {
                    ...topic,
                    images: topicImagesResponse.data
                };
            })
        );

        res.json({
            mainTopicImages: mainImagesResponse.data,
            related_topics: relatedTopicsWithImages
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Add the related-topics endpoint
app.post('/api/related-topics', async (req, res) => {
    try {
        const { query } = req.body;
        const apiKey = req.headers.authorization?.split('Bearer ')[1];

        const openai = new OpenAI({ apiKey });

        const completion = await openai.chat.completions.create({
            model: "gpt-4-0125-preview",
            messages: [
                {
                    role: "system",
                    content: "You are a savvy coolhunter with expertise in cars and art, specializing in their cultural impact from the 1980s to 2024. Your mission is to uncover and showcase the fascinating connections between automobiles and artistic expression in pop culture, entertainment, and music. For any given topic, provide four related references that explore different facets of car-art relationships, focusing on unexpected or lesser-known connections. Use a casual yet articulate tone, as if you're chatting with a fellow enthusiast at a gallery opening in a converted auto shop. Your knowledge bank includes: Pop Art and Automotive Imagery: Explore how artists transformed everyday vehicles into symbols of popular culture, including album covers featuring iconic cars. Cars in Film and TV: Highlight the cultural impact of famous movie and TV cars, focusing on less obvious choices and their legacies. Music and Motors: Discuss bands named after cars and explore how racing drivers, especially from Formula One, are crossing over into the music world. Formula One's Cultural Acceleration: Analyze F1's growing influence on music and entertainment, including collaborations with artists and the presence of concerts at Grand Prix events. Artistic Automobiles: Showcase artists who use cars as their medium or subject matter in innovative ways. Exclude NASCAR references but include Formula One. Your goal is to create an engaging, interconnected web of car-art relationships that will expand users' knowledge with surprising and intriguing connections."
                },
                {
                    role: "user",
                    content: `Generate 4 related topics to "${query}" with descriptions. Each topic should have a brief description explaining its relationship to ${query}.`
                }
            ],
            functions: [
                {
                    name: "generate_related_topics",
                    description: "Generate related topics with descriptions",
                    parameters: {
                        type: "object",
                        properties: {
                            related_topics: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        title: {
                                            type: "string",
                                            description: "The title of the related topic"
                                        },
                                        description: {
                                            type: "string",
                                            description: "A detailed description of how this topic relates to the main topic"
                                        }
                                    },
                                    required: ["title", "description"]
                                }
                            }
                        },
                        required: ["related_topics"]
                    }
                }
            ],
            function_call: { name: "generate_related_topics" }
        });

        const functionResponse = JSON.parse(completion.choices[0].message.function_call.arguments);
        res.json(functionResponse);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 