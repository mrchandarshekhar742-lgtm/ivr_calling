package com.ivrcallmanager;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
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

public class LoginActivity extends AppCompatActivity {
    
    private static final String TAG = "LoginActivity";
    
    private EditText emailEdit;
    private EditText passwordEdit;
    private Button loginButton;
    private ProgressBar progressBar;
    
    private PreferenceManager prefManager;
    private ExecutorService executor;
    private Handler mainHandler;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            setContentView(R.layout.activity_login);
            
            initViews();
            prefManager = new PreferenceManager(this);
            executor = Executors.newSingleThreadExecutor();
            mainHandler = new Handler(Looper.getMainLooper());
            
            // Pre-fill with default credentials
            emailEdit.setText("admin@ivr.com");
            passwordEdit.setText("admin123");
            
        } catch (Exception e) {
            Log.e(TAG, "Error in onCreate", e);
            Toast.makeText(this, "Error initializing login screen", Toast.LENGTH_LONG).show();
        }
    }
    
    private void initViews() {
        try {
            emailEdit = findViewById(R.id.emailEdit);
            passwordEdit = findViewById(R.id.passwordEdit);
            loginButton = findViewById(R.id.loginButton);
            progressBar = findViewById(R.id.progressBar);
            
            loginButton.setOnClickListener(v -> performLogin());
        } catch (Exception e) {
            Log.e(TAG, "Error initializing views", e);
        }
    }
    
    private void performLogin() {
        try {
            String email = emailEdit.getText().toString().trim();
            String password = passwordEdit.getText().toString().trim();
            
            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please enter email and password", Toast.LENGTH_SHORT).show();
                return;
            }
            
            setLoading(true);
            
            // Use simple HTTP request instead of Retrofit
            executor.execute(() -> {
                try {
                    String result = makeLoginRequest(email, password);
                    
                    mainHandler.post(() -> {
                        try {
                            setLoading(false);
                            handleLoginResponse(result);
                        } catch (Exception e) {
                            Log.e(TAG, "Error handling response", e);
                            Toast.makeText(this, "Error processing response", Toast.LENGTH_LONG).show();
                        }
                    });
                    
                } catch (Exception e) {
                    Log.e(TAG, "Login request failed", e);
                    mainHandler.post(() -> {
                        setLoading(false);
                        Toast.makeText(this, "Network error: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    });
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Error in performLogin", e);
            setLoading(false);
            Toast.makeText(this, "Login error: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }
    
    private String makeLoginRequest(String email, String password) throws Exception {
        URL url = new URL("https://ivr.wxon.in/api/auth/login");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        
        try {
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(30000);
            conn.setReadTimeout(30000);
            
            // Create JSON payload
            JSONObject json = new JSONObject();
            json.put("email", email);
            json.put("password", password);
            
            // Send request
            OutputStream os = conn.getOutputStream();
            os.write(json.toString().getBytes("UTF-8"));
            os.close();
            
            // Read response
            int responseCode = conn.getResponseCode();
            Log.d(TAG, "Response Code: " + responseCode);
            
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
            
            Log.d(TAG, "Response: " + response.toString());
            return response.toString();
            
        } finally {
            conn.disconnect();
        }
    }
    
    private void handleLoginResponse(String response) {
        try {
            JSONObject json = new JSONObject(response);
            boolean success = json.optBoolean("success", false);
            
            if (success) {
                JSONObject data = json.getJSONObject("data");
                JSONObject user = data.getJSONObject("user");
                String token = data.getString("token");
                String userId = String.valueOf(user.getInt("id"));
                String userEmail = user.getString("email");
                
                // Save auth data
                prefManager.saveAuthData(token, userId, userEmail);
                
                Toast.makeText(this, "Login successful!", Toast.LENGTH_SHORT).show();
                setResult(RESULT_OK);
                finish();
                
            } else {
                String message = json.optString("message", "Login failed");
                Toast.makeText(this, message, Toast.LENGTH_LONG).show();
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error parsing response", e);
            Toast.makeText(this, "Error parsing server response", Toast.LENGTH_LONG).show();
        }
    }
    
    private void setLoading(boolean loading) {
        try {
            if (progressBar != null) {
                progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
            }
            if (loginButton != null) {
                loginButton.setEnabled(!loading);
            }
            if (emailEdit != null) {
                emailEdit.setEnabled(!loading);
            }
            if (passwordEdit != null) {
                passwordEdit.setEnabled(!loading);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in setLoading", e);
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (executor != null) {
            executor.shutdown();
        }
    }
}
