import React, { useState, useRef, useEffect } from 'react';

const AudioPlayer = ({ audioFile, onError }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);

  // Use the new streaming endpoint
  const audioUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/audio/${audioFile.id}/stream`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set crossOrigin to handle CORS
    audio.crossOrigin = 'anonymous';

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadStart = () => setLoading(true);
    const handleCanPlay = () => setLoading(false);
    const handleError = (e) => {
      console.error('Audio error details:', {
        error: e,
        audioUrl,
        readyState: audio.readyState,
        networkState: audio.networkState
      });
      setLoading(false);
      setIsPlaying(false);
      if (onError) {
        onError(`Failed to load audio: ${audioFile.name}. Check if backend server is running on port 5000.`);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [audioFile, onError, audioUrl]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Play error:', error);
      if (onError) {
        onError(`Failed to play audio: ${error.message}`);
      }
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        crossOrigin="anonymous"
      />
      
      <div className="flex items-center space-x-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={loading}
          className={`flex items-center justify-center w-10 h-10 rounded-full ${
            loading 
              ? 'bg-gray-300 cursor-not-allowed' 
              : isPlaying 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
          } text-white transition-colors`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 w-12">
              {formatTime(currentTime)}
            </span>
            <div 
              className="flex-1 h-2 bg-gray-200 rounded-full cursor-pointer"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-100"
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-sm text-gray-500 w-12">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* File Info */}
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">{audioFile.name}</div>
          <div className="text-xs text-gray-500">
            {audioFile.originalName} • {(audioFile.size / 1024 / 1024).toFixed(1)} MB
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-2 text-xs text-gray-400">
        <div>URL: {audioUrl}</div>
        <div>Status: {loading ? 'Loading...' : isPlaying ? 'Playing' : 'Paused'}</div>
      </div>
    </div>
  );
};

export default AudioPlayer;