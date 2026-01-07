package com.ivrcallmanager.models;

import java.util.Arrays;
import java.util.List;

public class DeviceRegistrationRequest {
    private String deviceId;
    private String deviceName;
    private String deviceModel;
    private String androidVersion;
    private String appVersion;
    private List<String> capabilities;
    
    public DeviceRegistrationRequest(String deviceId, String deviceName, String deviceModel, String androidVersion, String appVersion) {
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.deviceModel = deviceModel;
        this.androidVersion = androidVersion;
        this.appVersion = appVersion;
        this.capabilities = Arrays.asList("voice_call", "dtmf_input");
    }
    
    public String getDeviceId() {
        return deviceId;
    }
    
    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }
    
    public String getDeviceName() {
        return deviceName;
    }
    
    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }
    
    public String getDeviceModel() {
        return deviceModel;
    }
    
    public void setDeviceModel(String deviceModel) {
        this.deviceModel = deviceModel;
    }
    
    public String getAndroidVersion() {
        return androidVersion;
    }
    
    public void setAndroidVersion(String androidVersion) {
        this.androidVersion = androidVersion;
    }
    
    public String getAppVersion() {
        return appVersion;
    }
    
    public void setAppVersion(String appVersion) {
        this.appVersion = appVersion;
    }
    
    public List<String> getCapabilities() {
        return capabilities;
    }
    
    public void setCapabilities(List<String> capabilities) {
        this.capabilities = capabilities;
    }
}