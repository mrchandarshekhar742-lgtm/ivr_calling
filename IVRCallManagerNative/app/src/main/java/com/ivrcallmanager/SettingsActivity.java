package com.ivrcallmanager;

import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.ivrcallmanager.utils.PreferenceManager;

public class SettingsActivity extends AppCompatActivity {
    
    private static final String TAG = "SettingsActivity";
    
    private EditText serverUrlEdit;
    private EditText deviceNameEdit;
    private EditText phoneNumberEdit;
    private Button saveButton;
    private Button testConnectionButton;
    
    private PreferenceManager prefManager;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            setContentView(R.layout.activity_settings);
            
            initViews();
            prefManager = new PreferenceManager(this);
            loadSettings();
            
        } catch (Exception e) {
            Log.e(TAG, "Error in onCreate", e);
            Toast.makeText(this, "Error initializing settings", Toast.LENGTH_LONG).show();
        }
    }
    
    private void initViews() {
        try {
            serverUrlEdit = findViewById(R.id.serverUrlEdit);
            deviceNameEdit = findViewById(R.id.deviceNameEdit);
            phoneNumberEdit = findViewById(R.id.phoneNumberEdit);
            saveButton = findViewById(R.id.saveButton);
            testConnectionButton = findViewById(R.id.testConnectionButton);
            
            saveButton.setOnClickListener(v -> saveSettings());
            testConnectionButton.setOnClickListener(v -> testConnection());
            
        } catch (Exception e) {
            Log.e(TAG, "Error initializing views", e);
        }
    }
    
    private void loadSettings() {
        try {
            serverUrlEdit.setText(prefManager.getServerUrl());
            deviceNameEdit.setText(prefManager.getDeviceName());
            phoneNumberEdit.setText(prefManager.getPhoneNumber());
        } catch (Exception e) {
            Log.e(TAG, "Error loading settings", e);
        }
    }
    
    private void saveSettings() {
        try {
            String serverUrl = serverUrlEdit.getText().toString().trim();
            String deviceName = deviceNameEdit.getText().toString().trim();
            String phoneNumber = phoneNumberEdit.getText().toString().trim();
            
            if (serverUrl.isEmpty()) {
                Toast.makeText(this, "Server URL is required", Toast.LENGTH_SHORT).show();
                return;
            }
            
            if (deviceName.isEmpty()) {
                Toast.makeText(this, "Device name is required", Toast.LENGTH_SHORT).show();
                return;
            }
            
            prefManager.saveSettings(serverUrl, deviceName, phoneNumber);
            Toast.makeText(this, "Settings saved successfully", Toast.LENGTH_SHORT).show();
            finish();
            
        } catch (Exception e) {
            Log.e(TAG, "Error saving settings", e);
            Toast.makeText(this, "Error saving settings", Toast.LENGTH_SHORT).show();
        }
    }
    
    private void testConnection() {
        try {
            String serverUrl = serverUrlEdit.getText().toString().trim();
            
            if (serverUrl.isEmpty()) {
                Toast.makeText(this, "Please enter server URL first", Toast.LENGTH_SHORT).show();
                return;
            }
            
            // Simple test - just show the URL for now
            Toast.makeText(this, "Testing connection to: " + serverUrl, Toast.LENGTH_SHORT).show();
            
        } catch (Exception e) {
            Log.e(TAG, "Error testing connection", e);
            Toast.makeText(this, "Error testing connection", Toast.LENGTH_SHORT).show();
        }
    }
}