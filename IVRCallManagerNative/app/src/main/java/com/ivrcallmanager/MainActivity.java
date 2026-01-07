package com.ivrcallmanager;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.ivrcallmanager.utils.PreferenceManager;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.json.JSONObject;

public class MainActivity extends AppCompatActivity {
    
    private static final String TAG = "MainActivity";
    
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
    private ExecutorService executor;
    private Handler mainHandler;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            setContentView(R.layout.activity_main);
            
            initViews();
            prefManager = new PreferenceManager(this);
            executor = Executors.newSingleThreadExecutor();
            mainHandler = new Handler(Looper.getMainLooper());
            
            checkLoginStatus();
            updateUI();
            
        } catch (Exception e) {
            Log.e(TAG, "Error in onCreate", e);
            Toast.makeText(this, "Error initializing app", Toast.LENGTH_LONG).show();
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
                
                statusText.setText(isConnected ? "Connected" : "Disconnected");
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
            prefManager.clearAuthData();
            isLoggedIn = false;
            isConnected = false;
            
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
                
                Toast.makeText(this, "Device registered and connected!", Toast.LENGTH_SHORT).show();
                
            } else {
                String message = json.optString("message", "Device registration failed");
                Toast.makeText(this, message, Toast.LENGTH_LONG).show();
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error parsing device registration response", e);
            Toast.makeText(this, "Error parsing server response", Toast.LENGTH_LONG).show();
        }
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
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        
        // Update status to offline when app closes
        if (isConnected) {
            updateDeviceStatus("offline");
        }
        
        if (executor != null) {
            executor.shutdown();
        }
    }
}