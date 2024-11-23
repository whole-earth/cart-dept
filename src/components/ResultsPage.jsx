// src/components/ResultsPage.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { Card, CardTitle } from "./ui/card";
import { useSwipeable } from 'react-swipeable';
import { fetchRelatedThemes } from '../api';
import { Loader2, Plus, ChevronLeft, ChevronRight } from "lucide-react";

export const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [swipeState, setSwipeState] = useState({
    isPressed: false,
    direction: null
  });
  const [currentState, setCurrentState] = useState({
    currentTopic: location.state?.currentTopic,
    relatedTopics: location.state?.relatedTopics,
    currentDescription: location.state?.currentDescription,
    currentImages: location.state?.mainTopicImages || []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getBorderStyles = (direction) => {
    const baseStyle = swipeState.isPressed ? '10px' : '1px';
    const activeStyle = '40px';
    
    return {
      borderTopWidth: direction === 'up' ? activeStyle : baseStyle,
      borderRightWidth: direction === 'right' ? activeStyle : baseStyle,
      borderBottomWidth: direction === 'down' ? activeStyle : baseStyle,
      borderLeftWidth: direction === 'left' ? activeStyle : baseStyle,
      borderStyle: 'solid',
      borderColor: 'rgb(229 231 235)', // gray-200
      borderRadius: '9999px',
      transition: 'all 0.2s ease'
    };
  };

  const handleTopicChange = async (newTopic) => {
    if (isLoading || isTransitioning) return;
    
    setIsLoading(true);
    setIsTransitioning(true);

    try {
      const newRelatedData = await fetchRelatedThemes(newTopic);
      console.log('newRelatedData:', newRelatedData);
      
      // Find the selected topic's existing images if it was a related topic
      const existingTopic = currentState.relatedTopics?.find(t => t.title === newTopic);
      console.log('existingTopic:', existingTopic);
      
      const topicImages = existingTopic?.images || newRelatedData.mainTopicImages;
      console.log('topicImages:', topicImages);

      setCurrentState({
        currentTopic: newTopic,
        relatedTopics: newRelatedData.related_topics,
        currentDescription: newRelatedData.related_topics.find(t => t.title === newTopic)?.description || '',
        currentImages: topicImages
      });
    } catch (error) {
      console.error('Error fetching new topics:', error);
    } finally {
      setIsLoading(false);
      setIsTransitioning(false);
    }
  };

  const handlers = useSwipeable({
    onSwipedRight: () => {
      console.log("Swiped RIGHT!");
      const targetTopic = currentState.relatedTopics[0];
      if (targetTopic?.title) {
        handleTopicChange(targetTopic.title);
      }
    },
    onSwipedDown: () => {
      console.log("Swiped DOWN!");
      const targetTopic = currentState.relatedTopics[1];
      if (targetTopic?.title) {
        handleTopicChange(targetTopic.title);
      }
    },
    onSwipedLeft: () => {
      console.log("Swiped LEFT!");
      const targetTopic = currentState.relatedTopics[2];
      if (targetTopic?.title) {
        handleTopicChange(targetTopic.title);
      }
    },
    onSwipedUp: () => {
      console.log("Swiped UP!");
      const targetTopic = currentState.relatedTopics[3];
      if (targetTopic?.title) {
        handleTopicChange(targetTopic.title);
      }
    },
    onSwiping: (e) => {
      setSwipeState({
        isPressed: true,
        direction: e.dir.toLowerCase()
      });
    },
    onSwiped: () => {
      setSwipeState({ isPressed: false, direction: null });
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
    trackTouch: true,
    delta: 50,
    swipeDuration: 500,
  });

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === (currentState.currentImages?.length - 1) ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? (currentState.currentImages?.length - 1) : prev - 1
    );
  };

  const handleImageError = (e) => {
    console.log('Image failed to load:', e.target.src);
    //e.target.src = '/cart-dept/fallback-image.png'; // Replace with your fallback image
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <img 
        src="/logo.png" 
        alt="Logo" 
        className="w-[200px] my-[10px] object-contain"
      />
      <div className="flex-1 w-full flex items-center justify-center">
        <motion.div 
          key={currentState.currentTopic}
          className="relative w-[90vw] h-[90vw] max-w-[500px] max-h-[500px] -mt-[50px]"
          style={{ 
            touchAction: 'none', 
            userSelect: 'none',
            pointerEvents: isLoading ? 'none' : 'auto' 
          }}
          {...handlers}
        >
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-full">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-gray-800" />
                <p className="text-sm font-medium text-gray-800">
                  Loading new topic...
                </p>
              </div>
            </div>
          )}

          {/* Perimeter Ring - Remove transition animation */}
          <div 
            className="absolute inset-0" 
            style={getBorderStyles(swipeState.direction)}
          />
          
          {/* Center Topic - Update the card content */}
          <motion.div 
            className="absolute w-[40%]"
            style={{
              top: '50%',
              left: '50%',
              x: '-50%',
              y: '-50%'
            }}
          >
            <Card className="p-3 text-center">
              <div className="w-full h-full relative">
                {/* Loading skeleton */}
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                
                <img 
                  src={currentState.currentImages?.[currentImageIndex]?.url}
                  alt=""
                  className="w-full h-full object-contain relative z-10"
                  onError={handleImageError}
                  loading="lazy"
                  crossOrigin="anonymous"
                  onLoad={(e) => {
                    // Remove loading skeleton when image loads
                    e.target.previousSibling?.remove();
                  }}
                />
              </div>
              <CardTitle className="text-sm font-medium truncate">
                {currentState.currentTopic}
                {isLoading && " ..."}
              </CardTitle>
            </Card>
          </motion.div>

          {/* Related Topics - Update the image source */}
          {currentState.relatedTopics?.map((topic, index) => {
            const angle = (index * (360 / 4)) * (Math.PI / 180);
            // Different radii for vertical and horizontal positions
            const baseRadius = window.innerWidth >= 768 ? '55%' : '45%';
            let radius = baseRadius;
            
            // Reduce radius for left and right positions (indices 1 and 3)
            if (index === 0 || index === 2) {
              // Convert percentage to pixels, subtract 25px, convert back to percentage
              const radiusInPx = (parseFloat(baseRadius) / 100) * (window.innerWidth >= 768 ? 500 : window.innerWidth * 0.9);
              const adjustedRadiusInPx = radiusInPx - 20;
              radius = `${(adjustedRadiusInPx / (window.innerWidth >= 768 ? 500 : window.innerWidth * 0.9)) * 100}%`;
            }
            
            return (
              <motion.div
                key={`${topic.title}-${index}`}
                className="absolute w-[25%]"
                style={{
                  top: `calc(50% + ${Math.sin(angle) * parseFloat(radius)}%)`,
                  left: `calc(50% + ${Math.cos(angle) * parseFloat(radius)}%)`,
                  x: '-50%',
                  y: '-50%'
                }}
              >
                <Card className="p-2 text-center">
                  <div className="w-full aspect-square rounded-lg mb-1 overflow-hidden">
                    <img 
                      src={topic.images?.[0]?.url} 
                      alt=""
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                      loading="lazy"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <CardTitle className="text-xs line-clamp-2">
                    {topic.title}
                    {isLoading && " ..."}
                  </CardTitle>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Updated Sliding Panel */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-white shadow-lg mx-[-20px]"
        style={{
          height: '90vh',
          maxWidth: '600px',
          margin: '0 auto',
          transform: `translateY(${isPanelExpanded ? '0' : 'calc(90vh - 60px)'})`
        }}
        animate={{
          y: isPanelExpanded ? 0 : 'calc(90vh - 60px)'
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 1.25
        }}
      >
        <button
          onClick={() => setIsPanelExpanded(!isPanelExpanded)}
          className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-2 shadow-md"
        >
          <Plus 
            className={`w-6 h-6 transition-transform ${isPanelExpanded ? 'rotate-45' : ''}`}
          />
        </button>
        
        <div className="p-6 h-full overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">
            {currentState.currentTopic}
          </h2>
          <p className="text-gray-700 mb-6">
            {currentState.currentDescription}
          </p>
          
          {/* Image Carousel */}
          <div className="relative px-8 mb-6">
            <div className="relative w-full h-[40vh]">
              {currentState.currentImages?.length > 0 && (
                <img 
                  src={currentState.currentImages[currentImageIndex]?.url}
                  alt=""
                  className="w-full h-full object-contain"
                  onError={handleImageError}
                  loading="lazy"
                  crossOrigin="anonymous"
                />
              )}
              
              {/* Navigation Arrows */}
              {currentState.currentImages?.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-[-2rem] top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-[-2rem] top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
              
              {/* Image Counter */}
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm">
                {currentImageIndex + 1} / {currentState.currentImages?.length}
              </div>
            </div>
          </div>

          {/* Source Attribution */}
          <div className="text-sm text-gray-500 text-center">
            Source: {currentState.currentImages?.[currentImageIndex]?.source}
          </div>
        </div>
      </motion.div>
    </div>
  );
};