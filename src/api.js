import OpenAI from 'openai';
import axios from 'axios';

// Initialize the OpenAI client with API key from environment or localStorage
const openai = new OpenAI({
  apiKey: (() => {
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    const localKey = localStorage.getItem('openaiApiKey');
    //console.log('ENV Key:', envKey);
    //console.log('Local Storage Key:', localKey);
    return envKey || localKey;
  })(),
  dangerouslyAllowBrowser: true
});

const isValidImageUrl = (url) => {
  return url && 
    (url.startsWith('http') || url.startsWith('https')) && 
    (url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || url.endsWith('.webp') || url.endsWith('.gif'));
};

// Update the fetchImages function to use the backend endpoint
const fetchImages = async (query) => {
  try {
    const response = await axios.get('/api/search-images', {
      params: { query }
    });
    
    const mappedImages = response.data
      .filter(image => isValidImageUrl(image.imageUrl)) // Only keep valid URLs
      .map(image => ({
        url: image.imageUrl,
        thumbnail: image.thumbnailUrl,
        source: image.source,
        title: image.title,
        width: image.imageWidth,
        height: image.imageHeight
      }));

    return mappedImages;
    
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }
};

export const fetchRelatedThemes = async (topic) => {
  // Define the schema for structured output
  const schema = {
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
          required: ["title", "description"],
          additionalProperties: false
        }
      }
    },
    required: ["related_topics"],
    additionalProperties: false
  };

  try {
    // Get related topics from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [
        {
          role: "system",
          content: "You are a savvy coolhunter with expertise in cars and art, specializing in their cultural impact from the 1980s to 2024. Your mission is to uncover and showcase the fascinating connections between automobiles and artistic expression in pop culture, entertainment, and music. For any given topic, provide four related references that explore different facets of car-art relationships, focusing on unexpected or lesser-known connections. Use a casual yet articulate tone, as if you're chatting with a fellow enthusiast at a gallery opening in a converted auto shop. Your knowledge bank includes: Pop Art and Automotive Imagery: Explore how artists transformed everyday vehicles into symbols of popular culture, including album covers featuring iconic cars. Cars in Film and TV: Highlight the cultural impact of famous movie and TV cars, focusing on less obvious choices and their legacies. Music and Motors: Discuss bands named after cars and explore how racing drivers, especially from Formula One, are crossing over into the music world. Formula One's Cultural Acceleration: Analyze F1's growing influence on music and entertainment, including collaborations with artists and the presence of concerts at Grand Prix events. Artistic Automobiles: Showcase artists who use cars as their medium or subject matter in innovative ways. Exclude NASCAR references but include Formula One. Your goal is to create an engaging, interconnected web of car-art relationships that will expand users' knowledge with surprising and intriguing connections."
        },
        {
          role: "user",
          content: `Generate 4 related topics to "${topic}" with descriptions. Each topic should have a brief description explaining its relationship to ${topic}.`
        }
      ],
      functions: [
        {
          name: "generate_related_topics",
          description: "Generate related topics with descriptions",
          parameters: schema
        }
      ],
      function_call: { name: "generate_related_topics" }
    });

    // Parse the function call response
    const functionResponse = JSON.parse(response.choices[0].message.function_call.arguments);
    
    // Fetch images for the main topic
    const mainTopicImages = await fetchImages(topic);
    
    // Fetch images for each related topic
    const topicsWithImages = await Promise.all(
      functionResponse.related_topics.map(async (topic) => {
        const images = await fetchImages(topic.title);
        return {
          ...topic,
          images: images
        };
      })
    );

    return {
      mainTopicImages: mainTopicImages,
      related_topics: topicsWithImages
    };
  } catch (error) {
    console.error("Error generating related topics:", error);
    throw error;
  }
};