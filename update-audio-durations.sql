-- Update audio files with estimated durations based on file size
-- Rough estimation: 1 minute of MP3 audio ≈ 1MB at 128kbps
-- This is just a temporary fix until proper duration calculation is implemented

UPDATE audio_files 
SET duration = CASE 
    WHEN size < 100000 THEN 10.0  -- Files < 100KB = ~10 seconds
    WHEN size < 500000 THEN 30.0  -- Files < 500KB = ~30 seconds  
    WHEN size < 1000000 THEN 60.0 -- Files < 1MB = ~1 minute
    WHEN size < 2000000 THEN 120.0 -- Files < 2MB = ~2 minutes
    WHEN size < 5000000 THEN 300.0 -- Files < 5MB = ~5 minutes
    ELSE 600.0 -- Larger files = ~10 minutes
END
WHERE duration IS NULL;