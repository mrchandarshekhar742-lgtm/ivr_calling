package com.ivrcallmanager.utils;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.UUID;

public class PreferenceManager {
    
    private static final String PREF_NAME = "IVRCallManager";
    private static final String KEY_AUTH_TOKEN = "auth_token";
    private static final String KEY_USER_ID = "user_id";
    private static final String KEY_USER_EMAIL = "user_email";
    private static final String KEY_DEVICE_ID = "device_id";
    private static final String KEY_DEVICE_NAME = "device_name";
    private static final String KEY_PHONE_NUMBER = "phone_number";
    private static final String KEY_SERVER_URL = "server_url";
    
    private SharedPreferences preferences;
    
    public PreferenceManager(Context context) {
        preferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        
        // Generate device ID if not exists
        if (getDeviceId() == null) {
            String deviceId = "device_" + UUID.randomUUID().toString().substring(0, 8);
            preferences.edit().putString(KEY_DEVICE_ID, deviceId).apply();
        }
        
        // Set default server URL if not exists
        if (getServerUrl() == null) {
            preferences.edit().putString(KEY_SERVER_URL, "https://ivr.wxon.in").apply();
        }
        
        // Set default device name if not exists
        if (getDeviceName() == null) {
            preferences.edit().putString(KEY_DEVICE_NAME, "Android Device").apply();
        }
    }
    
    public void saveAuthData(String token, String userId, String email) {
        SharedPreferences.Editor editor = preferences.edit();
        editor.putString(KEY_AUTH_TOKEN, token);
        editor.putString(KEY_USER_ID, userId);
        editor.putString(KEY_USER_EMAIL, email);
        editor.apply();
    }
    
    public void clearAuthData() {
        SharedPreferences.Editor editor = preferences.edit();
        editor.remove(KEY_AUTH_TOKEN);
        editor.remove(KEY_USER_ID);
        editor.remove(KEY_USER_EMAIL);
        editor.apply();
    }
    
    public void generateNewDeviceId() {
        String deviceId = "device_" + UUID.randomUUID().toString().substring(0, 8);
        preferences.edit().putString(KEY_DEVICE_ID, deviceId).apply();
    }
    
    public void saveSettings(String serverUrl, String deviceName, String phoneNumber) {
        SharedPreferences.Editor editor = preferences.edit();
        editor.putString(KEY_SERVER_URL, serverUrl);
        editor.putString(KEY_DEVICE_NAME, deviceName);
        editor.putString(KEY_PHONE_NUMBER, phoneNumber);
        editor.apply();
    }

    public void saveServerUrl(String serverUrl) {
        preferences.edit().putString(KEY_SERVER_URL, serverUrl).apply();
    }
    
    public String getAuthToken() {
        return preferences.getString(KEY_AUTH_TOKEN, null);
    }
    
    public String getUserId() {
        return preferences.getString(KEY_USER_ID, null);
    }
    
    public String getUserEmail() {
        return preferences.getString(KEY_USER_EMAIL, null);
    }
    
    public String getDeviceId() {
        return preferences.getString(KEY_DEVICE_ID, null);
    }
    
    public String getDeviceName() {
        return preferences.getString(KEY_DEVICE_NAME, "Android Device");
    }
    
    public String getPhoneNumber() {
        return preferences.getString(KEY_PHONE_NUMBER, "");
    }
    
    public String getServerUrl() {
        return preferences.getString(KEY_SERVER_URL, "https://ivr.wxon.in");
    }
}