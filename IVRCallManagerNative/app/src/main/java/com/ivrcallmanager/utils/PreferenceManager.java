package com.ivrcallmanager.utils;

import android.content.Context;
import android.content.SharedPreferences;
import android.provider.Settings;

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
    
    // Current call tracking keys
    private static final String KEY_CURRENT_CALL_ID = "current_call_id";
    private static final String KEY_CURRENT_PHONE_NUMBER = "current_phone_number";
    private static final String KEY_CURRENT_AUDIO_FILE_ID = "current_audio_file_id";
    
    private SharedPreferences preferences;
    private Context context;
    
    public PreferenceManager(Context context) {
        this.context = context;
        preferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        
        // Generate device ID if not exists - use consistent Android ID
        if (getDeviceId() == null) {
            String androidId = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
            String deviceId = "DEVICE_" + androidId;
            preferences.edit().putString(KEY_DEVICE_ID, deviceId).apply();
        }
        
        // Set default server URL if not exists
        if (getServerUrl() == null) {
            preferences.edit().putString(KEY_SERVER_URL, "http://10.0.2.2:8090").apply(); // Android emulator localhost
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
    
    public String getToken() {
        return preferences.getString(KEY_AUTH_TOKEN, null);
    }
    
    public void clearAuthData() {
        SharedPreferences.Editor editor = preferences.edit();
        editor.remove(KEY_AUTH_TOKEN);
        editor.remove(KEY_USER_ID);
        editor.remove(KEY_USER_EMAIL);
        editor.apply();
    }
    
    public void generateNewDeviceId() {
        // Use consistent Android ID instead of random UUID
        String androidId = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
        String deviceId = "DEVICE_" + androidId;
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
    
    public void saveDeviceData(String deviceId, String deviceName) {
        SharedPreferences.Editor editor = preferences.edit();
        editor.putString(KEY_DEVICE_ID, deviceId);
        editor.putString(KEY_DEVICE_NAME, deviceName);
        editor.apply();
    }
    
    // Current call tracking methods
    public void setCurrentCallId(String callId) {
        preferences.edit().putString(KEY_CURRENT_CALL_ID, callId).apply();
    }
    
    public void setCurrentPhoneNumber(String phoneNumber) {
        preferences.edit().putString(KEY_CURRENT_PHONE_NUMBER, phoneNumber).apply();
    }
    
    public void setCurrentAudioFileId(int audioFileId) {
        preferences.edit().putInt(KEY_CURRENT_AUDIO_FILE_ID, audioFileId).apply();
    }
    
    public String getCurrentCallId() {
        return preferences.getString(KEY_CURRENT_CALL_ID, null);
    }
    
    public String getCurrentPhoneNumber() {
        return preferences.getString(KEY_CURRENT_PHONE_NUMBER, null);
    }
    
    public int getCurrentAudioFileId() {
        return preferences.getInt(KEY_CURRENT_AUDIO_FILE_ID, 0);
    }
    
    public void clearCurrentCall() {
        SharedPreferences.Editor editor = preferences.edit();
        editor.remove(KEY_CURRENT_CALL_ID);
        editor.remove(KEY_CURRENT_PHONE_NUMBER);
        editor.remove(KEY_CURRENT_AUDIO_FILE_ID);
        editor.apply();
    }
    
    // Static methods for backward compatibility
    public static void saveLoginData(Context context, String email, String token) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(KEY_AUTH_TOKEN, token);
        editor.putString(KEY_USER_EMAIL, email);
        editor.apply();
    }
    
    public static void saveDeviceData(Context context, String deviceId, String deviceName) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(KEY_DEVICE_ID, deviceId);
        editor.putString(KEY_DEVICE_NAME, deviceName);
        editor.apply();
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