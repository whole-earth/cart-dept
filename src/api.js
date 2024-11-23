import OpenAI from 'openai';
import axios from 'axios';

    // Initialize the OpenAI client with API key from environment or localStorage
    const openai = new OpenAI({
      apiKey: import.meta.env.OPENAI_API_KEY || localStorage.getItem('openaiApiKey'),
      dangerouslyAllowBrowser: true
    });

    const fetchImages = async (query) => {
      try {
        const response = await axios.get('/api/search-images', {
          params: { query }
        });
        return response.data;
      } catch (error) {
        console.error("Error fetching images:", error);
        return [];
      }
    };

    const fetchRelatedTopics = async (topic) => {
      // Get API key from localStorage
      const openaiApiKey = localStorage.getItem('openaiApiKey');
      
      try {
        const response = await axios.post('/api/themes', 
          { query: topic },
          { 
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`
            }
          }
        );
        return response.data.related_topics;
      } catch (error) {
        console.error("Error fetching related topics:", error);
        return [];
      }
    };

    export const fetchRelatedThemes = async (topic) => {
      try {
        // First, get the main topic images
        const mainTopicImages = await fetchImages(topic);
        
        // Then get related topics
        const relatedTopics = await fetchRelatedTopics(topic);
        
        // Finally, fetch images for each related topic
        const topicsWithImages = await Promise.all(
          relatedTopics.map(async (topic) => {
            const images = await fetchImages(topic.title);
            return {
              ...topic,
              images
            };
          })
        );

        return {
          mainTopicImages,
          related_topics: topicsWithImages
        };
      } catch (error) {
        console.error("Error generating related topics:", error);
        throw error;
      }
    };
