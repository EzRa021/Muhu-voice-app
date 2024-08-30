"use client"
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const VoiceRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [duration, setDuration] = useState(0);
  const [audioSize, setAudioSize] = useState(0);
  const mediaRecorderRef = useRef(null);
  const intervalRef = useRef(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.start();

    const audioChunks = [];
    mediaRecorderRef.current.addEventListener('dataavailable', (event) => {
      audioChunks.push(event.data);
    });

    mediaRecorderRef.current.addEventListener('stop', () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const url = URL.createObjectURL(audioBlob);
      setAudioURL(url);
      setAudioSize(audioBlob.size);
    });

    intervalRef.current = setInterval(() => {
      setDuration((prevDuration) => prevDuration + 1);
    }, 1000);

    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    clearInterval(intervalRef.current);
    setRecording(false);
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      {/* Neon Circle with Rotation and Shake */}
      <motion.div
        initial={{ scale: 1 }}
        animate={{
          rotate: recording ? 360 : 0,
          scale: recording ? 1.1 : 1,
          x: recording ? [0, -5, 5, 0] : 0,
        }}
        transition={{
          duration: 2,
          ease: 'linear',
          repeat: Infinity,
          repeatType: 'loop',
          x: { type: 'spring', stiffness: 300, damping: 20 },
        }}
        className="w-48 h-48 rounded-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 neon-border flex items-center justify-center"
      >
        <span className="text-white text-xl">AI Circle</span>
      </motion.div>

      {/* Recording Info */}
      <div className="mt-10 text-white">
        <div>Duration: {formatDuration(duration)}</div>
        {audioSize > 0 && <div>Size: {audioSize} bytes</div>}
      </div>

      {/* Control Buttons */}
      <div className="mt-5">
        <button
          onClick={startRecording}
          disabled={recording}
          className="px-4 py-2 mr-4 bg-green-500 text-white rounded hover:bg-green-400 disabled:opacity-50"
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          disabled={!recording}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-400 disabled:opacity-50"
        >
          Stop Recording
        </button>
      </div>

      {/* Audio Playback and Download */}
      {audioURL && (
        <div className="mt-10">
          <audio controls src={audioURL} className="w-full max-w-md mb-4" />
          <a
            href={audioURL}
            download="recorded-audio.wav"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-400"
          >
            Download Audio
          </a>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
