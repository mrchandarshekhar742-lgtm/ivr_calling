import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import io from 'socket.io-client';

interface ConnectionStatus {
  isConnected: boolean;
  serverUrl: string;
  deviceId: string;
  deviceName: string;
  phoneNumber: string;
  userId?: string;
  token?: string;
}

const App = (): React.JSX.Element => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    serverUrl: 'https://ivr.wxon.in',
    deviceId: '',
    deviceName: '',
    phoneNumber: '',
  });
  const [socket, setSocket] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [urlInput, setUrlInput] = useState('');
  const [deviceNameInput, setDeviceNameInput] = useState('');
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const [loginData, setLoginData] = useState({
    email: 'demo@example.com',
    password: 'password123'
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    initializeApp();
    checkNetworkStatus();
  }, []);

  const initializeApp = async () => {
    try {
      await requestPermissions();
      const savedUrl = await AsyncStorage.getItem('serverUrl');
      const savedDeviceId = await AsyncStorage.getItem('deviceId');
      const savedDeviceName = await AsyncStorage.getItem('deviceName');
      const savedPhoneNumber = await AsyncStorage.getItem('phoneNumber');
      const savedToken = await AsyncStorage.getItem('authToken');
      const savedUserId = await AsyncStorage.getItem('userId');

      let deviceId = savedDeviceId;
      if (!deviceId) {
        deviceId = generateDeviceId();
        await AsyncStorage.setItem('deviceId', deviceId);
      }

      const url = savedUrl || connectionStatus.serverUrl;
      const deviceName = savedDeviceName || 'Android Device';
      const phoneNumber = savedPhoneNumber || '';
      
      setConnectionStatus({ 
        serverUrl: url, 
        deviceId, 
        deviceName,
        phoneNumber,
        isConnected: false,
        token: savedToken || undefined,
        userId: savedUserId || undefined
      });
      setUrlInput(url);
      setDeviceNameInput(deviceName);
      setPhoneNumberInput(phoneNumber);

      if (savedToken && savedUserId) {
        setIsLoggedIn(true);
      }

    } catch (error) {
      console.error('Initialization error:', error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        ];
        await PermissionsAndroid.requestMultiple(permissions);
      } catch (error) {
        console.error('Permission error:', error);
      }
    }
  };

  const generateDeviceId = (): string => {
    return 'device_' + Math.random().toString(36).substr(2, 9);
  };

  const checkNetworkStatus = () => {
    return NetInfo.addEventListener(state => {
      setNetworkInfo(state);
    });
  };

  const login = async () => {
    try {
      const response = await fetch(`${connectionStatus.serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      
      if (data.success) {
        await AsyncStorage.setItem('authToken', data.data.token);
        await AsyncStorage.setItem('userId', data.data.user.id.toString());
        
        setConnectionStatus(prev => ({
          ...prev,
          token: data.data.token,
          userId: data.data.user.id.toString()
        }));
        
        setIsLoggedIn(true);
        Alert.alert('Success', 'Logged in successfully!');
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to connect to server for login');
    }
  };

  const logout = async () => {
    try {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userId');
      
      setConnectionStatus(prev => ({
        ...prev,
        token: undefined,
        userId: undefined,
        isConnected: false
      }));
      
      setIsLoggedIn(false);
      Alert.alert('Success', 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('serverUrl', urlInput);
      await AsyncStorage.setItem('deviceName', deviceNameInput);
      await AsyncStorage.setItem('phoneNumber', phoneNumberInput);
      
      setConnectionStatus(prev => ({
        ...prev, 
        serverUrl: urlInput,
        deviceName: deviceNameInput,
        phoneNumber: phoneNumberInput
      }));
      
      Alert.alert('Saved', 'Settings have been updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  const connectToServer = async () => {
    if (!isLoggedIn) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    if (socket) {
      socket.disconnect();
    }
    
    try {
      console.log('Attempting to connect to:', connectionStatus.serverUrl);
      
      const newSocket = io(connectionStatus.serverUrl, {
        auth: {
          token: connectionStatus.token
        },
        transports: ['websocket']
      });
      
      newSocket.on('connect', () => {
        console.log('Socket.IO connected successfully');
        setConnectionStatus(prev => ({...prev, isConnected: true}));
        
        // Authenticate with server
        newSocket.emit('authenticate', {
          userId: connectionStatus.userId,
          userType: 'device',
          deviceId: connectionStatus.deviceId
        });
        
        Alert.alert('Success', 'Connected to server successfully!');
      });

      newSocket.on('authenticated', (data) => {
        if (data.success) {
          console.log('Device authenticated successfully');
          
          // Register device with server
          registerDevice();
        } else {
          Alert.alert('Authentication Failed', data.error || 'Failed to authenticate');
        }
      });

      newSocket.on('campaign:start', (data) => {
        console.log('Campaign start received:', data);
        Alert.alert('Campaign Started', `Campaign ${data.campaignId} has been assigned to this device`);
      });

      newSocket.on('campaign:pause', (data) => {
        console.log('Campaign pause received:', data);
        Alert.alert('Campaign Paused', `Campaign ${data.campaignId} has been paused`);
      });

      newSocket.on('campaign:stop', (data) => {
        console.log('Campaign stop received:', data);
        Alert.alert('Campaign Stopped', `Campaign ${data.campaignId} has been stopped`);
      });

      newSocket.on('campaign:assigned', (data) => {
        console.log('Campaign assigned:', data);
        handleCampaignAssignment(data);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        setConnectionStatus(prev => ({...prev, isConnected: false}));
        
        if (reason !== 'io client disconnect') {
          Alert.alert('Connection Lost', `Disconnected: ${reason}`);
        }
      });

      newSocket.on('error', (error) => {
        console.error('Socket.IO error:', error);
        Alert.alert('Connection Error', 'Failed to connect to server');
        setConnectionStatus(prev => ({...prev, isConnected: false}));
      });

      setSocket(newSocket);
      
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Error', 'Failed to create socket connection');
    }
  };

  const registerDevice = async () => {
    try {
      const response = await fetch(`${connectionStatus.serverUrl}/api/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${connectionStatus.token}`
        },
        body: JSON.stringify({
          deviceId: connectionStatus.deviceId,
          deviceName: connectionStatus.deviceName,
          deviceModel: 'Android Device',
          androidVersion: Platform.Version.toString(),
          appVersion: '1.0.0',
          capabilities: ['voice_call', 'dtmf_input']
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Device registered successfully');
      } else {
        console.error('Device registration failed:', data.message);
      }
    } catch (error) {
      console.error('Device registration error:', error);
    }
  };

  const handleCampaignAssignment = (data: any) => {
    Alert.alert(
      'Campaign Assigned',
      `You have been assigned to campaign: ${data.campaign.name}\n\nType: ${data.campaign.type}\nDescription: ${data.campaign.description}`,
      [
        {
          text: 'Accept',
          onPress: () => {
            Alert.alert('Campaign Accepted', 'You are now ready to receive calls for this campaign');
          }
        }
      ]
    );
  };

  const sendHeartbeat = () => {
    if (socket && socket.connected) {
      socket.emit('heartbeat', {
        deviceId: connectionStatus.deviceId
      });
    }
  };

  // Send heartbeat every 30 seconds
  useEffect(() => {
    if (connectionStatus.isConnected) {
      const interval = setInterval(sendHeartbeat, 30000);
      return () => clearInterval(interval);
    }
  }, [connectionStatus.isConnected]);

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnectionStatus(prev => ({...prev, isConnected: false}));
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch(`${connectionStatus.serverUrl}/health`);
      if (response.ok) {
        Alert.alert('Success', 'Server is reachable');
      } else {
        Alert.alert('Error', `Server responded with status: ${response.status}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Cannot reach server. Check the URL and if the server is running.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <Text style={styles.title}>IVR Call Manager</Text>
          <Text style={styles.subtitle}>Android Device Controller v2.0</Text>
        </View>

        {/* Login Section */}
        {!isLoggedIn && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Login</Text>
            <Text style={styles.label}>Email:</Text>
            <TextInput
              style={styles.input}
              value={loginData.email}
              onChangeText={(text) => setLoginData(prev => ({...prev, email: text}))}
              placeholder="demo@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.label}>Password:</Text>
            <TextInput
              style={styles.input}
              value={loginData.password}
              onChangeText={(text) => setLoginData(prev => ({...prev, password: text}))}
              placeholder="password123"
              secureTextEntry
            />
            
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={login}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings Section */}
        {isLoggedIn && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Server Settings</Text>
            <Text style={styles.label}>Server URL:</Text>
            <TextInput
              style={styles.input}
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="https://ivr.wxon.in"
            />
            
            <Text style={styles.label}>Device Name:</Text>
            <TextInput
              style={styles.input}
              value={deviceNameInput}
              onChangeText={setDeviceNameInput}
              placeholder="My Android Device"
            />
            
            <Text style={styles.label}>Phone Number:</Text>
            <TextInput
              style={styles.input}
              value={phoneNumberInput}
              onChangeText={setPhoneNumberInput}
              placeholder="+91-9876543210"
              keyboardType="phone-pad"
            />
            
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={saveSettings}>
              <Text style={styles.buttonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Connection Status */}
        {isLoggedIn && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connection Status</Text>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusIndicator, 
                {backgroundColor: connectionStatus.isConnected ? '#28a745' : '#dc3545'}
              ]} />
              <Text style={styles.statusText}>
                {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
            <Text style={styles.infoText}>Server: {connectionStatus.serverUrl}</Text>
            <Text style={styles.infoText}>Device ID: {connectionStatus.deviceId}</Text>
            <Text style={styles.infoText}>Device Name: {connectionStatus.deviceName}</Text>
            <Text style={styles.infoText}>Phone Number: {connectionStatus.phoneNumber}</Text>
            {networkInfo && (
              <Text style={styles.infoText}>
                Network: {networkInfo.type} ({networkInfo.isConnected ? 'Connected' : 'Disconnected'})
              </Text>
            )}
          </View>
        )}

        {/* Controls */}
        {isLoggedIn && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Controls</Text>
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.primaryButton, 
                connectionStatus.isConnected && styles.disabledButton
              ]} 
              onPress={connectToServer} 
              disabled={connectionStatus.isConnected}
            >
              <Text style={styles.buttonText}>Connect to Server</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.secondaryButton, 
                !connectionStatus.isConnected && styles.disabledButton
              ]} 
              onPress={disconnect} 
              disabled={!connectionStatus.isConnected}
            >
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.button, styles.testButton]} onPress={testConnection}>
              <Text style={styles.buttonText}>Test Server Connection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={logout}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Setup Instructions</Text>
          <Text style={styles.instructionText}>
            1. Make sure your device has internet connection{'\n'}
            2. Use the server URL: https://ivr.wxon.in{'\n'}
            3. Login with your registered credentials{'\n'}
            4. Enter your device name and phone number{'\n'}
            5. Save settings and connect to server{'\n'}
            6. Grant all permissions when prompted{'\n'}
            7. Device will appear in the web dashboard when connected{'\n'}
            8. You can now receive IVR campaign assignments
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  header: { 
    padding: 20, 
    alignItems: 'center', 
    backgroundColor: '#007bff' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: 'white' 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#e3f2fd', 
    marginTop: 5 
  },
  section: { 
    marginHorizontal: 20, 
    marginVertical: 10, 
    padding: 15, 
    backgroundColor: 'white', 
    borderRadius: 8, 
    elevation: 2 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    color: '#333' 
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
    marginTop: 10
  },
  statusContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  statusIndicator: { 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    marginRight: 8 
  },
  statusText: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  infoText: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 5, 
    flexShrink: 1 
  },
  instructionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#fff'
  },
  button: { 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 10 
  },
  saveButton: { 
    backgroundColor: '#ffc107' 
  },
  primaryButton: { 
    backgroundColor: '#007bff' 
  },
  secondaryButton: { 
    backgroundColor: '#6c757d' 
  },
  testButton: { 
    backgroundColor: '#28a745' 
  },
  logoutButton: { 
    backgroundColor: '#dc3545' 
  },
  disabledButton: { 
    backgroundColor: '#e9ecef' 
  },
  buttonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600' 
  },
});

export default App;