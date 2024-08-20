// // pages/index.js
// "use client"
// import React, { useState, useRef } from 'react';

// export default function VoiceNoteApp() {
//   const [isRecording, setIsRecording] = useState(false);
//   const [audioChunks, setAudioChunks] = useState([]);
//   const mediaRecorderRef = useRef(null);

//   const startRecording = () => {
//     setIsRecording(true);
//     navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
//       mediaRecorderRef.current = new MediaRecorder(stream);
//       mediaRecorderRef.current.ondataavailable = (event) => {
//         setAudioChunks((prev) => [...prev, event.data]);
//       };
//       mediaRecorderRef.current.start();
//     });
//   };

//   const stopRecording = () => {
//     setIsRecording(false);
//     mediaRecorderRef.current.stop();

//     mediaRecorderRef.current.onstop = () => {
//       // Combine all audio chunks into one Blob
//       const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

//       // Convert Blob to ArrayBuffer (raw bytes)
//       const reader = new FileReader();
//       reader.onload = () => {
//         const audioBytes = reader.result;

//         // Save the raw bytes as a binary file
//         const byteArray = new Uint8Array(audioBytes);
//         const binaryBlob = new Blob([byteArray]);

//         // Creating a download link for the binary file
//         const binaryUrl = URL.createObjectURL(binaryBlob);
//         const downloadLink = document.createElement('a');
//         downloadLink.href = binaryUrl;
//         downloadLink.download = 'recording.bin'; // Filename with .bin extension for raw bytes
//         downloadLink.click();
//       };

//       // Read the Blob as an ArrayBuffer (which contains the raw bytes)
//       reader.readAsArrayBuffer(audioBlob);
//     };
//   };

//   return (
//     <div>
//       <button onClick={isRecording ? stopRecording : startRecording}>
//         {isRecording ? 'Stop Recording' : 'Start Recording'}
//       </button>
//     </div>
//   );
// }
