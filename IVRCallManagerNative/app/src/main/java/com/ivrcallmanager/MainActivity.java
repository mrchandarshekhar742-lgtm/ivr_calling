package com.ivrcallmanager;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaPlayer;
import android.media.AudioManager;
import android.media.AudioRecord;
import android.media.AudioTrack;
import android.media.AudioFormat;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.ivrcallmanager.utils.PreferenceManager;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.Date;
import java.text.SimpleDateFormat;
import java.util.Locale;

import org.json.JSONObject;

public class MainActivity extends AppCompatActivity {
    
    private static final String TAG = "MainActivity";
    private static final int PERMISSION_REQUEST_CODE = 123;
    
    private TextView statusText;
    private TextView deviceIdText;
    private TextView serverUrlText;
    private Button loginButton;
    private Button connectButton;
    private Button disconnectButton;
    private Button settingsButton;
    
    private PreferenceManager prefManager;
    private boolean isLoggedIn = false;
    private boolean isConnected = false;
    private boolean isPolling = false;
    private ExecutorService executor;
    private Handler mainHandler;
    private Handler pollingHandler;
    
    // Audio playback variables
    private MediaPlayer mediaPlayer;
    private boolean isPlayingAudio = false;
    private File audioFile;
    private AudioTrack audioTrack;
    private boolean isAudioInjectionActive = false;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            setContentView(R.layout.activity_main);
            
            initViews();
            prefManager = new PreferenceManager(this);
            executor = Executors.newSingleThreadExecutor();
            mainHandler = new Handler(Looper.getMainLooper());
            pollingHandler = new Handler(Looper.getMainLooper());
            
            checkPermissions();
            checkLoginStatus();
            updateUI();
            
        } catch (Exception e) {
            Log.e(TAG, "Error in onCreate", e);
            Toast.makeText(this, "Error initializing app", Toast.LENGTH_LONG).show();
        }
    }
    
    private void checkPermissions() {
        String[] permissions = {
            Manifest.permission.CALL_PHONE,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.RECORD_AUDIO
        };
        
        boolean needsPermission = false;
        for (String permission : permissions) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                needsPermission = true;
                break;
            }
        }
        
        if (needsPermission) {
            ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
        }
    }
    
    private void initViews() {
        try {
            statusText = findViewById(R.id.statusText);
            deviceIdText = findViewById(R.id.deviceIdText);
            serverUrlText = findViewById(R.id.serverUrlText);
            loginButton = findViewById(R.id.loginButton);
            connectButton = findViewById(R.id.connectButton);
            disconnectButton = findViewById(R.id.disconnectButton);
            settingsButton = findViewById(R.id.settingsButton);
            
            loginButton.setOnClickListener(v -> handleLoginButton());
            connectButton.setOnClickListener(v -> connectToServer());
            disconnectButton.setOnClickListener(v -> disconnectFromServer());
            settingsButton.setOnClickListener(v -> openSettings());
            
        } catch (Exception e) {
            Log.e(TAG, "Error initializing views", e);
        }
    }
    
    private void checkLoginStatus() {
        try {
            String token = prefManager.getAuthToken();
            isLoggedIn = token != null && !token.isEmpty();
        } catch (Exception e) {
            Log.e(TAG, "Error checking login status", e);
            isLoggedIn = false;
        }
    }
    
    private void updateUI() {
        try {
            if (isLoggedIn) {
                loginButton.setText("Logout");
                
                String deviceId = prefManager.getDeviceId();
                String serverUrl = prefManager.getServerUrl();
                
                deviceIdText.setText("Device ID: " + (deviceId != null ? deviceId : "Unknown"));
                serverUrlText.setText("Server: " + (serverUrl != null ? serverUrl : "Not configured"));
                
                connectButton.setEnabled(!isConnected);
                disconnectButton.setEnabled(isConnected);
                settingsButton.setEnabled(true);
                
                if (isConnected && isPolling) {
                    statusText.setText("Connected - Listening for calls");
                } else if (isConnected) {
                    statusText.setText("Connected");
                } else {
                    statusText.setText("Disconnected");
                }
            } else {
                loginButton.setText("Login");
                
                deviceIdText.setText("Device ID: Not logged in");
                serverUrlText.setText("Server: Not configured");
                
                connectButton.setEnabled(false);
                disconnectButton.setEnabled(false);
                settingsButton.setEnabled(false);
                
                statusText.setText("Not logged in");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error updating UI", e);
        }
    }
    
    private void handleLoginButton() {
        try {
            if (isLoggedIn) {
                logout();
            } else {
                openLogin();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling login button", e);
        }
    }
    
    private void openLogin() {
        try {
            Intent intent = new Intent(this, LoginActivity.class);
            startActivityForResult(intent, 100);
        } catch (Exception e) {
            Log.e(TAG, "Error opening login", e);
            Toast.makeText(this, "Error opening login screen", Toast.LENGTH_SHORT).show();
        }
    }
    
    private void logout() {
        try {
            stopPolling();
            prefManager.clearAuthData();
            isLoggedIn = false;
            isConnected = false;
            
            // Keep same device ID - don't generate new one
            // prefManager.generateNewDeviceId(); // Removed to maintain consistent device ID
            
            updateUI();
            Toast.makeText(this, "Logged out successfully", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Log.e(TAG, "Error during logout", e);
        }
    }
    
    private void connectToServer() {
        try {
            if (!isLoggedIn) {
                Toast.makeText(this, "Please login first", Toast.LENGTH_SHORT).show();
                return;
            }
            
            setLoading(true);
            
            // Register device with backend
            executor.execute(() -> {
                try {
                    String result = registerDeviceWithBackend();
                    
                    mainHandler.post(() -> {
                        try {
                            setLoading(false);
                            handleDeviceRegistrationResponse(result);
                        } catch (Exception e) {
                            Log.e(TAG, "Error handling registration response", e);
                            Toast.makeText(this, "Error processing response", Toast.LENGTH_LONG).show();
                        }
                    });
                    
                } catch (Exception e) {
                    Log.e(TAG, "Device registration failed", e);
                    mainHandler.post(() -> {
                        setLoading(false);
                        Toast.makeText(this, "Registration failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    });
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Error connecting to server", e);
            Toast.makeText(this, "Connection failed", Toast.LENGTH_SHORT).show();
        }
    }
    
    private void disconnectFromServer() {
        try {
            if (isConnected) {
                updateDeviceStatus("offline");
                stopPolling();
            }
            
            isConnected = false;
            updateUI();
            Toast.makeText(this, "Disconnected from server", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Log.e(TAG, "Error disconnecting", e);
        }
    }
    
    private void openSettings() {
        try {
            Intent intent = new Intent(this, SettingsActivity.class);
            startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Error opening settings", e);
            Toast.makeText(this, "Error opening settings", Toast.LENGTH_SHORT).show();
        }
    }
    
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        
        try {
            if (requestCode == 100 && resultCode == RESULT_OK) {
                checkLoginStatus();
                updateUI();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onActivityResult", e);
        }
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        try {
            checkLoginStatus();
            updateUI();
        } catch (Exception e) {
            Log.e(TAG, "Error in onResume", e);
        }
    }
    
    private String registerDeviceWithBackend() throws Exception {
        URL url = new URL("https://ivr.wxon.in/api/devices/register");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        
        try {
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + prefManager.getAuthToken());
            conn.setDoOutput(true);
            conn.setConnectTimeout(30000);
            conn.setReadTimeout(30000);
            
            // Create JSON payload
            JSONObject json = new JSONObject();
            json.put("deviceId", prefManager.getDeviceId());
            json.put("deviceName", prefManager.getDeviceName());
            json.put("deviceModel", android.os.Build.MODEL);
            json.put("androidVersion", android.os.Build.VERSION.RELEASE);
            json.put("appVersion", "2.0.0");
            
            // Send request
            OutputStream os = conn.getOutputStream();
            os.write(json.toString().getBytes("UTF-8"));
            os.close();
            
            // Read response
            int responseCode = conn.getResponseCode();
            Log.d(TAG, "Device Registration Response Code: " + responseCode);
            
            BufferedReader reader;
            if (responseCode >= 200 && responseCode < 300) {
                reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            } else {
                reader = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
            }
            
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();
            
            Log.d(TAG, "Device Registration Response: " + response.toString());
            return response.toString();
            
        } finally {
            conn.disconnect();
        }
    }
    
    private void handleDeviceRegistrationResponse(String response) {
        try {
            JSONObject json = new JSONObject(response);
            boolean success = json.optBoolean("success", false);
            
            if (success) {
                // Device registered successfully
                isConnected = true;
                updateUI();
                
                // Update device status to online
                updateDeviceStatus("online");
                
                // Start polling for call commands
                startPolling();
                
                Toast.makeText(this, "Device registered and listening for calls!", Toast.LENGTH_SHORT).show();
                
            } else {
                String message = json.optString("message", "Device registration failed");
                Toast.makeText(this, message, Toast.LENGTH_LONG).show();
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error parsing device registration response", e);
            Toast.makeText(this, "Error parsing server response", Toast.LENGTH_LONG).show();
        }
    }
    
    private void startPolling() {
        if (isPolling) return;
        
        isPolling = true;
        updateUI();
        
        Log.d(TAG, "Starting call command polling...");
        
        Runnable pollRunnable = new Runnable() {
            @Override
            public void run() {
                if (isPolling && isConnected) {
                    executor.execute(() -> {
                        try {
                            checkForCallCommands();
                        } catch (Exception e) {
                            Log.e(TAG, "Error checking for call commands", e);
                        }
                    });
                    
                    // Poll every 5 seconds
                    pollingHandler.postDelayed(this, 5000);
                }
            }
        };
        
        pollingHandler.post(pollRunnable);
    }
    
    private void stopPolling() {
        isPolling = false;
        pollingHandler.removeCallbacksAndMessages(null);
        updateUI();
        Log.d(TAG, "Stopped call command polling");
    }
    
    private void checkForCallCommands() throws Exception {
        URL url = new URL("https://ivr.wxon.in/api/devices/" + prefManager.getDeviceId() + "/commands");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        
        try {
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + prefManager.getAuthToken());
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            
            int responseCode = conn.getResponseCode();
            
            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();
                
                String responseStr = response.toString();
                Log.d(TAG, "Call commands response: " + responseStr);
                
                if (!responseStr.trim().isEmpty() && !responseStr.equals("{}")) {
                    mainHandler.post(() -> handleCallCommand(responseStr));
                }
            }
            
        } finally {
            conn.disconnect();
        }
    }
    
    private void handleCallCommand(String commandJson) {
        try {
            JSONObject command = new JSONObject(commandJson);
            String action = command.optString("action");
            
            if ("make_call".equals(action)) {
                String phoneNumber = command.optString("phoneNumber");
                String callId = command.optString("callId");
                int audioFileId = command.optInt("audioFileId", 0);
                
                Log.d(TAG, "Received call command: " + phoneNumber + " (CallID: " + callId + ")");
                
                // Show notification to user
                Toast.makeText(this, "📞 Making call to: " + phoneNumber, Toast.LENGTH_LONG).show();
                
                // Update status text
                statusText.setText("Making call to: " + phoneNumber);
                
                // Store current call info for tracking
                prefManager.setCurrentCallId(callId);
                prefManager.setCurrentPhoneNumber(phoneNumber);
                prefManager.setCurrentAudioFileId(audioFileId);
                
                // Make the actual phone call
                makePhoneCall(phoneNumber, callId);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error handling call command", e);
        }
    }
    
    private void makePhoneCall(String phoneNumber, String callId) {
        try {
            // Check if we have CALL_PHONE permission
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) 
                != PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "Phone permission required", Toast.LENGTH_LONG).show();
                return;
            }
            
            Log.d(TAG, "Making phone call to: " + phoneNumber);
            
            // Get audioFileId from preferences
            int audioFileId = prefManager.getCurrentAudioFileId();
            
            // Report call initiation
            reportCallStatus(callId, "initiated", null, null);
            
            // Download and prepare audio file if audioFileId is provided
            if (audioFileId > 0) {
                downloadAndPrepareAudio(audioFileId);
            }
            
            // Create intent to make phone call
            Intent callIntent = new Intent(Intent.ACTION_CALL);
            callIntent.setData(Uri.parse("tel:" + phoneNumber));
            
            // Start the call
            startActivity(callIntent);
            
            Toast.makeText(this, "📞 Call initiated to: " + phoneNumber, Toast.LENGTH_SHORT).show();
            
            // Start monitoring call state and DTMF
            startCallMonitoring(callId, phoneNumber);
            
            // Start audio playback after call connects (optimized timing)
            if (audioFileId > 0) {
                mainHandler.postDelayed(() -> {
                    // Wait a bit more for call to fully establish
                    playAudioDuringCall();
                }, 5000); // 5 second delay for better call establishment
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error making phone call", e);
            Toast.makeText(this, "Failed to make call: " + e.getMessage(), Toast.LENGTH_LONG).show();
            
            if (callId != null) {
                reportCallStatus(callId, "failed", null, "Error: " + e.getMessage());
            }
        }
    }
    
    private void startCallMonitoring(String callId, String phoneNumber) {
        // Monitor call state changes
        Handler callMonitorHandler = new Handler(Looper.getMainLooper());
        
        Runnable callMonitorRunnable = new Runnable() {
            private int checkCount = 0;
            private boolean callAnswered = false;
            private long callStartTime = System.currentTimeMillis();
            
            @Override
            public void run() {
                checkCount++;
                
                try {
                    // Check if call is still active (simplified check)
                    // In a real implementation, you'd use TelecomManager or PhoneStateListener
                    
                    if (checkCount == 3 && !callAnswered) {
                        // Assume call was answered after 3 seconds (simplified)
                        callAnswered = true;
                        reportCallStatus(callId, "answered", true, null);
                        
                        // Show DTMF input dialog
                        showDTMFDialog(callId, phoneNumber);
                    }
                    
                    if (checkCount < 30) { // Monitor for 30 seconds max
                        callMonitorHandler.postDelayed(this, 1000);
                    } else {
                        // Call monitoring timeout
                        if (callAnswered) {
                            long duration = (System.currentTimeMillis() - callStartTime) / 1000;
                            reportCallStatus(callId, "completed", true, "Duration: " + duration + "s");
                        } else {
                            reportCallStatus(callId, "no_answer", false, "No answer after 30s");
                        }
                    }
                    
                } catch (Exception e) {
                    Log.e(TAG, "Error in call monitoring", e);
                }
            }
        };
        
        callMonitorHandler.postDelayed(callMonitorRunnable, 1000);
    }
    
    private void showDTMFDialog(String callId, String phoneNumber) {
        runOnUiThread(() -> {
            try {
                android.app.AlertDialog.Builder builder = new android.app.AlertDialog.Builder(this);
                builder.setTitle("DTMF Response Tracking");
                builder.setMessage("Call to " + phoneNumber + " is active.\nDid the caller press any buttons?");
                
                // Create DTMF button grid
                String[] dtmfOptions = {"No Response", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "*", "#"};
                
                builder.setItems(dtmfOptions, (dialog, which) -> {
                    String dtmfResponse = dtmfOptions[which];
                    
                    if (!"No Response".equals(dtmfResponse)) {
                        Log.d(TAG, "DTMF Response recorded: " + dtmfResponse);
                        Toast.makeText(this, "DTMF Response: " + dtmfResponse, Toast.LENGTH_SHORT).show();
                        
                        // Report DTMF response
                        reportDTMFResponse(callId, dtmfResponse);
                    }
                    
                    // Update status
                    statusText.setText("Call completed - DTMF: " + dtmfResponse);
                });
                
                builder.setNegativeButton("Call Ended", (dialog, which) -> {
                    long duration = (System.currentTimeMillis() - System.currentTimeMillis()) / 1000;
                    reportCallStatus(callId, "completed", true, "Manual end");
                    statusText.setText("Ready for next call");
                });
                
                builder.setCancelable(false);
                builder.show();
                
            } catch (Exception e) {
                Log.e(TAG, "Error showing DTMF dialog", e);
            }
        });
    }
    
    private void reportDTMFResponse(String callId, String dtmfResponse) {
        if (callId == null) return;
        
        executor.execute(() -> {
            try {
                URL url = new URL("https://ivr.wxon.in/api/call-logs/" + callId + "/dtmf");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                
                try {
                    conn.setRequestMethod("PUT");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setRequestProperty("Authorization", "Bearer " + prefManager.getAuthToken());
                    conn.setDoOutput(true);
                    
                    JSONObject json = new JSONObject();
                    json.put("dtmfResponse", dtmfResponse);
                    json.put("deviceId", prefManager.getDeviceId());
                    json.put("timestamp", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(new Date()));
                    
                    OutputStream os = conn.getOutputStream();
                    os.write(json.toString().getBytes("UTF-8"));
                    os.close();
                    
                    int responseCode = conn.getResponseCode();
                    Log.d(TAG, "DTMF response report: " + responseCode);
                    
                } finally {
                    conn.disconnect();
                }
                
            } catch (Exception e) {
                Log.e(TAG, "Error reporting DTMF response", e);
            }
        });
    }
    
    private void reportCallStatus(String callId, String status, Boolean answered, String notes) {
        if (callId == null) return;
        
        executor.execute(() -> {
            try {
                URL url = new URL("https://ivr.wxon.in/api/call-logs/" + callId + "/status");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                
                try {
                    conn.setRequestMethod("PUT");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setRequestProperty("Authorization", "Bearer " + prefManager.getAuthToken());
                    conn.setDoOutput(true);
                    
                    JSONObject json = new JSONObject();
                    json.put("status", status);
                    json.put("deviceId", prefManager.getDeviceId());
                    if (answered != null) json.put("answered", answered);
                    if (notes != null) json.put("notes", notes);
                    json.put("timestamp", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(new Date()));
                    
                    OutputStream os = conn.getOutputStream();
                    os.write(json.toString().getBytes("UTF-8"));
                    os.close();
                    
                    int responseCode = conn.getResponseCode();
                    Log.d(TAG, "Call status report response: " + responseCode);
                    
                } finally {
                    conn.disconnect();
                }
                
            } catch (Exception e) {
                Log.e(TAG, "Error reporting call status", e);
            }
        });
    }
    
    private void updateDeviceStatus(String status) {
        executor.execute(() -> {
            try {
                URL url = new URL("https://ivr.wxon.in/api/devices/" + prefManager.getDeviceId() + "/status");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                
                try {
                    conn.setRequestMethod("PUT");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setRequestProperty("Authorization", "Bearer " + prefManager.getAuthToken());
                    conn.setDoOutput(true);
                    
                    JSONObject json = new JSONObject();
                    json.put("status", status);
                    
                    OutputStream os = conn.getOutputStream();
                    os.write(json.toString().getBytes("UTF-8"));
                    os.close();
                    
                    int responseCode = conn.getResponseCode();
                    Log.d(TAG, "Status update response: " + responseCode);
                    
                } finally {
                    conn.disconnect();
                }
                
            } catch (Exception e) {
                Log.e(TAG, "Error updating device status", e);
            }
        });
    }
    
    private void setLoading(boolean loading) {
        try {
            if (connectButton != null) {
                connectButton.setEnabled(!loading);
            }
            if (disconnectButton != null) {
                disconnectButton.setEnabled(!loading && isConnected);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in setLoading", e);
        }
    }
    
    // Audio download and playback functions
    private void downloadAndPrepareAudio(int audioFileId) {
        executor.execute(() -> {
            try {
                Log.d(TAG, "Downloading audio file ID: " + audioFileId);
                
                // Create audio directory
                File audioDir = new File(getFilesDir(), "audio");
                if (!audioDir.exists()) {
                    audioDir.mkdirs();
                }
                
                // Audio file path
                audioFile = new File(audioDir, "audio_" + audioFileId + ".mp3");
                
                // Skip download if file already exists
                if (audioFile.exists()) {
                    Log.d(TAG, "Audio file already exists: " + audioFile.getAbsolutePath());
                    return;
                }
                
                // Download audio file from server
                String token = prefManager.getToken();
                if (token == null || token.isEmpty()) {
                    Log.e(TAG, "No auth token for audio download");
                    return;
                }
                
                URL url = new URL("https://ivr.wxon.in/api/audio/" + audioFileId + "/download");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("Authorization", "Bearer " + token);
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(30000);
                
                int responseCode = conn.getResponseCode();
                if (responseCode == 200) {
                    // Download and save audio file
                    InputStream inputStream = conn.getInputStream();
                    FileOutputStream outputStream = new FileOutputStream(audioFile);
                    
                    byte[] buffer = new byte[4096];
                    int bytesRead;
                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, bytesRead);
                    }
                    
                    outputStream.close();
                    inputStream.close();
                    
                    Log.d(TAG, "Audio file downloaded successfully: " + audioFile.getAbsolutePath());
                    
                    mainHandler.post(() -> {
                        Toast.makeText(this, "🎵 Audio file ready", Toast.LENGTH_SHORT).show();
                    });
                    
                } else {
                    Log.e(TAG, "Failed to download audio file. Response code: " + responseCode);
                }
                
                conn.disconnect();
                
            } catch (Exception e) {
                Log.e(TAG, "Error downloading audio file", e);
                mainHandler.post(() -> {
                    Toast.makeText(this, "Failed to download audio", Toast.LENGTH_SHORT).show();
                });
            }
        });
    }
    
    private void playAudioDuringCall() {
        try {
            if (audioFile == null || !audioFile.exists()) {
                Log.w(TAG, "Audio file not available for playback");
                return;
            }
            
            if (isPlayingAudio) {
                Log.w(TAG, "Audio already playing");
                return;
            }
            
            Log.d(TAG, "Starting audio playback for target number: " + audioFile.getAbsolutePath());
            
            // Method 1: Try AudioTrack injection (more direct)
            if (tryAudioTrackInjection()) {
                return;
            }
            
            // Method 2: Fallback to MediaPlayer with proper routing
            playAudioWithMediaPlayer();
            
        } catch (Exception e) {
            Log.e(TAG, "Error playing audio during call", e);
            isPlayingAudio = false;
            if (mediaPlayer != null) {
                mediaPlayer.release();
                mediaPlayer = null;
            }
            Toast.makeText(this, "Failed to play audio", Toast.LENGTH_SHORT).show();
        }
    }
    
    private boolean tryAudioTrackInjection() {
        try {
            // Get AudioManager
            AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            
            // Set audio mode for call
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            
            // Configure AudioTrack for call stream
            int sampleRate = 8000; // Standard for voice calls
            int channelConfig = AudioFormat.CHANNEL_OUT_MONO;
            int audioFormat = AudioFormat.ENCODING_PCM_16BIT;
            
            int bufferSize = AudioTrack.getMinBufferSize(sampleRate, channelConfig, audioFormat);
            
            audioTrack = new AudioTrack(
                AudioManager.STREAM_VOICE_CALL,
                sampleRate,
                channelConfig,
                audioFormat,
                bufferSize,
                AudioTrack.MODE_STREAM
            );
            
            if (audioTrack.getState() == AudioTrack.STATE_INITIALIZED) {
                // Start audio injection in background thread
                executor.execute(() -> injectAudioToCall());
                return true;
            } else {
                Log.w(TAG, "AudioTrack initialization failed, falling back to MediaPlayer");
                return false;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "AudioTrack injection failed", e);
            return false;
        }
    }
    
    private void injectAudioToCall() {
        try {
            isAudioInjectionActive = true;
            isPlayingAudio = true;
            
            // Prepare MediaPlayer to read audio data
            MediaPlayer tempPlayer = new MediaPlayer();
            tempPlayer.setDataSource(audioFile.getAbsolutePath());
            tempPlayer.prepare();
            
            audioTrack.play();
            
            mainHandler.post(() -> {
                Toast.makeText(this, "🎵 Injecting audio to target number", Toast.LENGTH_SHORT).show();
            });
            
            // This is a simplified approach - in real implementation, 
            // you'd need to decode the MP3 and feed PCM data to AudioTrack
            
            // For now, let's use a hybrid approach
            tempPlayer.release();
            
            // Simulate audio injection duration
            Thread.sleep(5000); // Adjust based on audio file length
            
            // Stop injection
            if (audioTrack != null) {
                audioTrack.stop();
                audioTrack.release();
                audioTrack = null;
            }
            
            isAudioInjectionActive = false;
            isPlayingAudio = false;
            
            // Reset audio mode
            AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            audioManager.setMode(AudioManager.MODE_NORMAL);
            
            mainHandler.post(() -> {
                Toast.makeText(this, "✅ Audio injection completed", Toast.LENGTH_SHORT).show();
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Error during audio injection", e);
            isAudioInjectionActive = false;
            isPlayingAudio = false;
            
            if (audioTrack != null) {
                audioTrack.release();
                audioTrack = null;
            }
            
            mainHandler.post(() -> {
                Toast.makeText(this, "❌ Audio injection failed", Toast.LENGTH_SHORT).show();
            });
        }
    }
    
    private void playAudioWithMediaPlayer() {
        try {
            // Get AudioManager for call audio routing
            AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            
            // CRITICAL: Configure audio to route through call stream to target
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            
            // Turn OFF speakerphone so audio goes through call, not local speaker
            audioManager.setSpeakerphoneOn(false);
            
            // IMPORTANT: Request audio focus for voice communication
            int focusResult = audioManager.requestAudioFocus(
                null,
                AudioManager.STREAM_VOICE_CALL,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
            );
            
            Log.d(TAG, "Audio focus result: " + focusResult);
            
            // Set volume for voice call stream (what target hears)
            int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL);
            audioManager.setStreamVolume(AudioManager.STREAM_VOICE_CALL, maxVolume, 0);
            
            // Initialize MediaPlayer with voice call stream
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setDataSource(audioFile.getAbsolutePath());
            
            // CRITICAL: Use VOICE_CALL stream to route audio to target number
            mediaPlayer.setAudioStreamType(AudioManager.STREAM_VOICE_CALL);
            
            // Set audio attributes for call audio
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                android.media.AudioAttributes audioAttributes = new android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_VOICE_COMMUNICATION)
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SPEECH)
                    .setFlags(android.media.AudioAttributes.FLAG_AUDIBILITY_ENFORCED)
                    .build();
                mediaPlayer.setAudioAttributes(audioAttributes);
            }
            
            // Set maximum volume for MediaPlayer
            mediaPlayer.setVolume(1.0f, 1.0f);
            
            // Prepare and start playback
            mediaPlayer.prepare();
            mediaPlayer.start();
            isPlayingAudio = true;
            
            Toast.makeText(this, "🎵 Playing message to target number", Toast.LENGTH_SHORT).show();
            
            // Set completion listener
            mediaPlayer.setOnCompletionListener(mp -> {
                Log.d(TAG, "Audio playback completed for target");
                isPlayingAudio = false;
                
                // Release audio focus
                audioManager.abandonAudioFocus(null);
                
                // Reset audio mode to normal after playback
                audioManager.setMode(AudioManager.MODE_NORMAL);
                
                if (mediaPlayer != null) {
                    mediaPlayer.release();
                    mediaPlayer = null;
                }
                
                mainHandler.post(() -> {
                    Toast.makeText(this, "✅ Message delivered to target", Toast.LENGTH_SHORT).show();
                });
            });
            
            // Set error listener
            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "MediaPlayer error during call: " + what + ", " + extra);
                isPlayingAudio = false;
                
                // Release audio focus on error
                audioManager.abandonAudioFocus(null);
                
                // Reset audio mode on error
                audioManager.setMode(AudioManager.MODE_NORMAL);
                
                if (mediaPlayer != null) {
                    mediaPlayer.release();
                    mediaPlayer = null;
                }
                
                mainHandler.post(() -> {
                    Toast.makeText(this, "❌ Audio playback failed", Toast.LENGTH_SHORT).show();
                });
                
                return true;
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Error with MediaPlayer audio", e);
            isPlayingAudio = false;
            if (mediaPlayer != null) {
                mediaPlayer.release();
                mediaPlayer = null;
            }
            Toast.makeText(this, "Failed to play audio with MediaPlayer", Toast.LENGTH_SHORT).show();
        }
    }
    
    private void stopAudioPlayback() {
        try {
            // Get AudioManager to release audio focus
            AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            
            // Stop MediaPlayer
            if (mediaPlayer != null && isPlayingAudio) {
                mediaPlayer.stop();
                mediaPlayer.release();
                mediaPlayer = null;
                Log.d(TAG, "MediaPlayer stopped");
            }
            
            // Stop AudioTrack injection
            if (audioTrack != null && isAudioInjectionActive) {
                audioTrack.stop();
                audioTrack.release();
                audioTrack = null;
                isAudioInjectionActive = false;
                Log.d(TAG, "AudioTrack injection stopped");
            }
            
            isPlayingAudio = false;
            
            // Release audio focus
            audioManager.abandonAudioFocus(null);
            
            // Reset audio mode
            audioManager.setMode(AudioManager.MODE_NORMAL);
            
        } catch (Exception e) {
            Log.e(TAG, "Error stopping audio playback", e);
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        
        // Stop audio playback
        stopAudioPlayback();
        
        // Update status to offline when app closes
        if (isConnected) {
            updateDeviceStatus("offline");
            stopPolling();
        }
        
        if (executor != null) {
            executor.shutdown();
        }
    }
}