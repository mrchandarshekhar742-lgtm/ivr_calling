# Create Test Audio File

## Quick Test Audio Creation

Since you need to test audio functionality, here are ways to create a test audio file:

### Method 1: Online Text-to-Speech
1. Go to https://ttsmp3.com/
2. Type: "Hello, this is a test audio for IVR Call Management System"
3. Select language: English
4. Click "Create MP3"
5. Download the MP3 file

### Method 2: Record with Windows Voice Recorder
1. Press Windows + R
2. Type "ms-windows-store://pdp/?productid=9WZDNCRFHWKL"
3. Install Voice Recorder if not installed
4. Open Voice Recorder
5. Record: "Hello, this is a test audio for IVR system"
6. Save as MP3

### Method 3: Use Audacity (Free)
1. Download Audacity from https://www.audacityteam.org/
2. Generate → Tone → Sine wave, 440 Hz, 5 seconds
3. Export as MP3

### Method 4: Command Line (if you have ffmpeg)
```bash
# Generate a 5-second test tone
ffmpeg -f lavfi -i "sine=frequency=440:duration=5" -c:a mp3 test-audio.mp3
```

### Test File Requirements:
- **Format**: MP3, WAV, AAC, or OGG
- **Size**: Less than 50MB
- **Duration**: 5-30 seconds for testing
- **Quality**: Any quality is fine for testing

### Upload Test:
1. Go to Audio Files page
2. Click "Upload Audio"
3. Select your test file
4. Name: "Test Audio"
5. Category: "General"
6. Click Upload
7. Click "Play" to test playback

This will help verify that the audio upload and playback system is working correctly.