// src/components/ResultsPage.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { Card, CardTitle } from "./ui/card";

export const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentTopic, relatedTopics } = location.state || {};

  const bind = useGesture({
    onDrag: ({ movement: [mx, my], down }) => {
      // Gesture handling will be added later
    }
  });

  return (
    <div className="min-h-screen flex flex-col items-center">
      <img 
        src="/cart-dept/logo.png" 
        alt="Logo" 
        className="w-[200px] md:h-[200px] my-[10px] object-contain"
      />
      <div className="flex-1 w-full flex items-center justify-center">
        <motion.div 
          className="relative w-[90vw] h-[90vw] max-w-[500px] max-h-[500px]"
          style={{ touchAction: 'none' }}
          {...bind()}
        >
          {/* Perimeter Ring */}
          <div className="absolute inset-0 border border-gray-200 rounded-full" />
          
          {/* Center Topic */}
          <motion.div 
            className="absolute w-[40%]"
            initial={{ 
              x: '-50%',
              y: '-50%',
              scale: 0.8, 
              opacity: 0 
            }}
            animate={{ 
              x: '-50%',
              y: '-50%',
              scale: 1, 
              opacity: 1 
            }}
            style={{
              top: '50%',
              left: '50%'
            }}
          >
            <Card className="p-3 text-center">
              <div className="w-full aspect-square bg-gray-200 rounded-lg mb-2" />
              <CardTitle className="text-sm font-medium truncate">
                {currentTopic}
              </CardTitle>
            </Card>
          </motion.div>

          {/* Related Topics */}
          {relatedTopics?.map((topic, index) => {
            const angle = (index * (360 / (relatedTopics?.length || 1))) * (Math.PI / 180);
            const radius = window.innerWidth >= 768 ? '55%' : '45%';
            
            return (
              <motion.div
                key={index}
                className="absolute w-[25%]"
                initial={{ 
                  x: '-50%',
                  y: '-50%',
                  opacity: 0 
                }}
                animate={{ 
                  x: '-50%',
                  y: '-50%',
                  opacity: 1 
                }}
                style={{
                  top: `calc(50% + ${Math.sin(angle) * parseFloat(radius)}%)`,
                  left: `calc(50% + ${Math.cos(angle) * parseFloat(radius)}%)`
                }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-2 text-center">
                  <div className="w-full aspect-square bg-gray-200 rounded-lg mb-1" />
                  <CardTitle className="text-xs line-clamp-2">
                    {topic.title}
                  </CardTitle>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};