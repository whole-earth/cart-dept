import { useEffect, useState } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'digitalLibrarianDB';
const HISTORY_STORE = 'topics';
const CACHE_STORE = 'queryCache';
const DB_VERSION = 2;

export const useLocalDB = () => {
  const [db, setDb] = useState(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        const database = await openDB(DB_NAME, DB_VERSION, {
          upgrade(db, oldVersion) {
            if (!db.objectStoreNames.contains(HISTORY_STORE)) {
              db.createObjectStore(HISTORY_STORE, {
                keyPath: 'id',
                autoIncrement: true
              });
            }
            if (!db.objectStoreNames.contains(CACHE_STORE)) {
              db.createObjectStore(CACHE_STORE, {
                keyPath: 'query'
              });
            }
          },
        });
        setDb(database);
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };

    initDB();
  }, []);

  const saveToHistory = async (topic, relatedTopics) => {
    if (!db) return;
    try {
      await db.add(HISTORY_STORE, {
        topic,
        relatedTopics,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const getHistory = async () => {
    if (!db) return [];
    try {
      return await db.getAll(HISTORY_STORE);
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  };

  const clearHistory = async () => {
    if (!db) return;
    try {
      await db.clear(HISTORY_STORE);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const getCachedResult = async (query) => {
    if (!db) return null;
    try {
      const result = await db.get(CACHE_STORE, query);
      return result?.data;
    } catch (error) {
      console.error('Error getting cached result:', error);
      return null;
    }
  };

  const cacheResult = async (query, data) => {
    if (!db) return;
    try {
      await db.put(CACHE_STORE, {
        query,
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error caching result:', error);
    }
  };

  return {
    saveToHistory,
    getHistory,
    clearHistory,
    getCachedResult,
    cacheResult
  };
};
