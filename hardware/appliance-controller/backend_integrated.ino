#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// Home WiFi credentials used for uploading code in esp32- can be updated from backend based on user data
const char* default_home_ssid = "Primary";
const char* default_home_password = "combat3d";

// Access Point credentials - can be predefined or set by user .. initially plan is to just keep it as predefined 
const char* ap_ssid = "Appliance_Controller";
const char* ap_password = "nexus_hub";

// Backend server URL
const char* serverURL = "https://nexus-hub-vvqm.onrender.com/api/v1/devices";

// Static IP for AP mode - where the AP serves
IPAddress local_IP(192, 168, 4, 1);
IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

// GPIO pins for relays and buttons   
const int relayPins[] = {5, 18, 19, 23};
const int buttonPins[] = {13, 12, 14, 27};
const String applianceNames[] = {"Living Room Light", "Fan", "Kitchen Light", "Air Conditioner"};

// Relay states and button handling
bool relayStates[] = {HIGH, HIGH, HIGH, HIGH}; // HIGH = OFF for relay
bool lastButtonState[] = {HIGH, HIGH, HIGH, HIGH};
bool stableButtonState[] = {HIGH, HIGH, HIGH, HIGH};
unsigned long lastStateChangeTime[] = {0, 0, 0, 0};
unsigned long lastToggleTime[] = {0, 0, 0, 0};

const unsigned long debounceTime = 50;
const unsigned long minToggleInterval = 300;

// Backend integration variables
bool isConfigured = false;
String configuredSSID = "";
String configuredPassword = "";
String deviceId = "";
String deviceName = "";

// Polling intervals
const unsigned long validationInterval = 60000; // 30 seconds for IP updates
unsigned long lastValidationTime = 0;

// Preferences for storing configuration
Preferences preferences;

WebServer server(80);

void setRelayState(int relayIndex, bool state) {
  relayStates[relayIndex] = state;
  digitalWrite(relayPins[relayIndex], state);
  Serial.printf("Relay %d (%s) set to %s\n", relayIndex + 1, applianceNames[relayIndex].c_str(), state == LOW ? "ON" : "OFF");
}

void toggleRelay(int relayIndex) {
  setRelayState(relayIndex, !relayStates[relayIndex]);
}

String generateHTML() {
  String html = "<!DOCTYPE html><html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">";
  html += "<meta charset=\"UTF-8\"><title>Nexus Hub Smart Home Control</title><style>";
  html += "*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;padding:20px}";
  html += ".container{max-width:500px;margin:auto;background:white;border-radius:15px;box-shadow:0 10px 30px rgba(0,0,0,0.3);overflow:hidden}";
  html += ".header{background:linear-gradient(45deg,#2196F3,#21CBF3);color:white;padding:30px 20px;text-align:center}";
  html += "h1{font-size:24px;margin-bottom:5px}.subtitle{opacity:0.9;font-size:14px}.content{padding:30px 20px}";
  html += ".appliance-card{background:#f8f9fa;border-radius:10px;padding:20px;margin-bottom:15px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}";
  html += ".appliance-name{font-weight:bold;font-size:16px;color:#333;margin-bottom:10px}.status{display:inline-block;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:bold;margin-bottom:15px}";
  html += ".status.on{background:#4CAF50;color:white}.status.off{background:#f44336;color:white}";
  html += ".toggle-btn{width:100%;padding:12px;font-size:16px;border:none;border-radius:8px;cursor:pointer;transition:0.3s;font-weight:bold}";
  html += ".toggle-btn.on{background:#f44336;color:white}.toggle-btn.on:hover{background:#d32f2f}";
  html += ".toggle-btn.off{background:#4CAF50;color:white}.toggle-btn.off:hover{background:#388E3C}";
  html += ".refresh-btn{background:#2196F3;color:white;padding:12px 30px;border:none;border-radius:25px;font-size:16px;cursor:pointer;margin:20px auto;display:block;transition:0.3s}";
  html += ".refresh-btn:hover{background:#1976D2;transform:translateY(-2px)}.footer{text-align:center;color:#666;font-size:12px;padding:15px;border-top:1px solid #eee}";
  html += ".ip-info{background:#e3f2fd;color:#1565c0;padding:10px;text-align:center;font-size:12px}";
  html += ".control-info{background:#f3e5f5;color:#7b1fa2;padding:8px;text-align:center;font-size:11px}";
  html += ".backend-status{background:" + String(isConfigured ? "#e8f5e8" : "#fff3e0") + ";color:" + String(isConfigured ? "#2e7d32" : "#f57c00") + ";padding:8px;text-align:center;font-size:11px}";
  html += "</style><script>function manualRefresh(){location.reload();}</script></head><body>";
  html += "<div class=\"container\"><div class=\"header\"><h1>🏠 Welcome to Nexus Hub</h1><div class=\"subtitle\">Remote Appliance Controller</div></div>";
  
  // Network information
  html += "<div class=\"ip-info\">📶 STA IP: " + WiFi.localIP().toString() + "<br>📡 AP IP: " + WiFi.softAPIP().toString() + "<br>Network: " + String(ap_ssid) + "</div>";
  html += "<div class=\"control-info\">Simultaneous WiFi Client & Access Point | Local Control</div>";
  
  // Backend status
  String statusText = isConfigured ? "🌐 Connected to Backend" : "⚠️ Waiting for Backend Configuration";
  if (isConfigured && deviceName.length() > 0) {
    statusText += " | Device: " + deviceName;
  } else if (isConfigured && deviceId.length() > 0) {
    statusText += " | ID: " + deviceId.substring(deviceId.length()-6);
  }
  html += "<div class=\"backend-status\">" + statusText + "</div>";
  
  html += "<div class=\"content\">";

  for (int i = 0; i < 4; i++) {
    bool isOn = (relayStates[i] == LOW);
    html += "<div class=\"appliance-card\"><div class=\"appliance-name\">" + applianceNames[i] + "</div>";
    html += "<span class=\"status " + String(isOn ? "on" : "off") + "\">" + (isOn ? "ON" : "OFF") + "</span>";
    html += "<form action=\"/toggle_relay_" + String(i) + "\" method=\"GET\" style=\"margin:0\">";
    html += "<button class=\"toggle-btn " + String(isOn ? "on" : "off") + "\" type=\"submit\">";
    html += (isOn ? "🔴 Turn OFF" : "🟢 Turn ON") + String("</button></form></div>");
  }

  html += "<form action=\"/refresh\" method=\"GET\"><button class=\"refresh-btn\" type=\"submit\" onclick=\"manualRefresh()\">🔄 Refresh Status</button></form>";
  html += "</div><div class=\"footer\">Nexus Crew | ESP32 Controller<br>Mode: Dual STA + AP | Local Control</div></div></body></html>";
  return html;
}

void setupServerRoutes() {
  // Local web interface routes
  server.on("/", HTTP_GET, []() {
    server.send(200, "text/html", generateHTML());
  });

  for (int i = 0; i < 4; i++) {
    int relayIndex = i;
    server.on(("/toggle_relay_" + String(i)).c_str(), HTTP_GET, [relayIndex]() {
      toggleRelay(relayIndex);
      server.send(200, "text/html", generateHTML());
    });
  }

  server.on("/status", HTTP_GET, []() {
    String json = "{\"relays\":[";
    for (int i = 0; i < 4; i++) {
      json += (relayStates[i] == LOW ? "true" : "false");
      if (i < 3) json += ",";
    }
    json += "],\"deviceId\":\"" + deviceId + "\",\"configured\":" + String(isConfigured ? "true" : "false");
    json += ",\"ipAddress\":\"" + WiFi.localIP().toString() + "\"}";
    server.send(200, "application/json", json);
  });

  server.on("/refresh", HTTP_GET, []() {
    server.send(200, "text/html", generateHTML());
  });

  server.onNotFound([]() {
    server.send(404, "text/plain", "Page not found");
  });
}

void setupWiFiDualMode() {
  WiFi.mode(WIFI_AP_STA);
  
  // Try to connect to home WiFi (STA mode)
  const char* sta_ssid = isConfigured ? configuredSSID.c_str() : default_home_ssid;
  const char* sta_password = isConfigured ? configuredPassword.c_str() : default_home_password;
  
  WiFi.begin(sta_ssid, sta_password);
  Serial.print("Connecting to WiFi: ");
  Serial.println(sta_ssid);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Connected to Home WiFi");
    Serial.println("STA IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n❌ Failed to connect to Home WiFi");
  }

  // Setup Access Point mode
  WiFi.softAPConfig(local_IP, gateway, subnet);
  if (WiFi.softAP(ap_ssid, ap_password)) {
    Serial.println("✅ AP Mode Enabled");
    Serial.println("AP IP: " + WiFi.softAPIP().toString());
  } else {
    Serial.println("❌ Failed to start AP mode");
  }
}

void validateDeviceAndUpdateIP() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Not connected to WiFi. Cannot validate device.");
    return;
  }
  
  HTTPClient http;
  http.begin(String(serverURL) + "/validatedevice");
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10 second timeout

  String macAddress = WiFi.macAddress();
  String ipAddress = WiFi.localIP().toString();
  
  Serial.println("=== DEVICE VALIDATION & IP UPDATE ===");
  Serial.print("Device MAC Address: ");
  Serial.println(macAddress);
  Serial.print("Device IP Address: ");
  Serial.println(ipAddress);

  DynamicJsonDocument requestDoc(300);
  requestDoc["macAddress"] = macAddress;
  requestDoc["ipAddress"] = ipAddress;
  String json;
  serializeJson(requestDoc, json);

  Serial.print("Sending validation request to: ");
  Serial.println(String(serverURL) + "/validatedevice");
  Serial.print("Payload: ");
  Serial.println(json);

  int httpResponseCode = http.POST(json);
  Serial.print("Validation response code: ");
  Serial.println(httpResponseCode);

  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("=== VALIDATION RESPONSE ===");
    Serial.println(response);
    Serial.println("=========================");

    DynamicJsonDocument responseDoc(1024);
    DeserializationError error = deserializeJson(responseDoc, response);

    if (!error) {
      // Check if device object exists in response
      if (responseDoc.containsKey("device")) {
        JsonObject device = responseDoc["device"];
        String newDeviceId = device["_id"].as<String>();
        String newDeviceName = device["deviceName"] | device["name"] | "";
        String newSSID = device["ssid"] | "";
        String newPassword = device["password"] | "";
        
        Serial.println("Found device ID: " + newDeviceId);
        Serial.println("Found device name: " + newDeviceName);
        Serial.println("SSID from device: " + newSSID);
        Serial.println("Password length: " + String(newPassword.length()));
        
        if (newDeviceId.length() > 0) {
          // Save configuration
          preferences.putBool("configured", true);
          preferences.putString("deviceId", newDeviceId);
          
          if (newDeviceName.length() > 0) {
            preferences.putString("deviceName", newDeviceName);
            deviceName = newDeviceName;
          }
          
          // Save WiFi credentials if provided
          if (newSSID.length() > 0 && newPassword.length() > 0) {
            preferences.putString("ssid", newSSID);
            preferences.putString("password", newPassword);
            configuredSSID = newSSID;
            configuredPassword = newPassword;
            Serial.println("Updated WiFi credentials");
            
            // Reconnect WiFi with new credentials
            Serial.println("Reconnecting to new WiFi...");
            setupWiFiDualMode();
            delay(2000);
          } else {
            Serial.println("No new WiFi credentials, keeping current");
          }

          Serial.println("✅ Device configuration saved successfully!");
          Serial.println("Device ID: " + newDeviceId);
          Serial.println("Device Name: " + newDeviceName);
          
          // Update local variables
          deviceId = newDeviceId;
          isConfigured = true;
        } else {
          Serial.println("❌ Error: No device ID found in response");
        }
      } else {
        // Try alternative response format
        String newDeviceId = responseDoc["deviceId"] | responseDoc["_id"] | "";
        String newDeviceName = responseDoc["deviceName"] | responseDoc["name"] | "";
        String newSSID = responseDoc["ssid"] | "";
        String newPassword = responseDoc["password"] | "";
        
        Serial.println("Alternative format - Device ID: " + newDeviceId);
        Serial.println("Alternative format - Device Name: " + newDeviceName);
        Serial.println("Alternative format - SSID: " + newSSID);
        
        if (newDeviceId.length() > 0) {
          preferences.putBool("configured", true);
          preferences.putString("deviceId", newDeviceId);
          
          if (newDeviceName.length() > 0) {
            preferences.putString("deviceName", newDeviceName);
            deviceName = newDeviceName;
          }
          
          if (newSSID.length() > 0 && newPassword.length() > 0) {
            preferences.putString("ssid", newSSID);
            preferences.putString("password", newPassword);
            configuredSSID = newSSID;
            configuredPassword = newPassword;
            
            Serial.println("Reconnecting to new WiFi...");
            setupWiFiDualMode();
            delay(2000);
          }
          
          deviceId = newDeviceId;
          isConfigured = true;
          
          Serial.println("✅ Device configured with alternative format!");
        }
      }
    } else {
      Serial.print("❌ JSON parsing error: ");
      Serial.println(error.c_str());
    }
  } else if (httpResponseCode == 400) {
    String response = http.getString();
    Serial.println("❌ Validation failed (400): " + response);
  } else if (httpResponseCode == 404) {
    String response = http.getString();
    Serial.println("⚠️ Device not found (404): " + response);
    Serial.println("💡 MAC Address: " + macAddress);
    Serial.println("💡 Please register this device in your web application!");
  } else {
    String response = http.getString();
    Serial.printf("❌ Validation error: HTTP response code %d\n", httpResponseCode);
    Serial.println("Response: " + response);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\nESP32 Smart Home Device - Dual Mode with Backend Integration");

  // Initialize preferences
  preferences.begin("device-config", false);

  // Load configuration
  isConfigured = preferences.getBool("configured", false);
  deviceId = preferences.getString("deviceId", "");
  deviceName = preferences.getString("deviceName", "");
  
  if (isConfigured) {
    configuredSSID = preferences.getString("ssid", "");
    configuredPassword = preferences.getString("password", "");
    
    Serial.println("Device configured:");
    Serial.println("- Device ID: " + deviceId);
    Serial.println("- Device Name: " + deviceName);
    Serial.println("- SSID: " + configuredSSID);
  } else {
    Serial.println("Device not configured. Using default WiFi credentials.");
  }

  // Initialize GPIO pins
  for (int i = 0; i < 4; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], HIGH); // Initialize to OFF
    pinMode(buttonPins[i], INPUT_PULLUP);
    lastButtonState[i] = digitalRead(buttonPins[i]);
    stableButtonState[i] = lastButtonState[i];
  }

  // Setup dual WiFi mode
  setupWiFiDualMode();
  
  // Setup web server
  setupServerRoutes();
  server.begin();
  Serial.println("🌐 Web server running on both STA and AP mode!");
  Serial.println("Local Access: http://" + WiFi.localIP().toString());
  Serial.println("AP Access: http://" + WiFi.softAPIP().toString());
}

void loop() {
  unsigned long currentTime = millis();
  
  // Handle web server requests
  server.handleClient();
  
  // Ensure WiFi STA connection is maintained
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi STA connection lost. Attempting to reconnect...");
    setupWiFiDualMode();
    delay(2000);
  }
  
  // Periodic device validation and IP updates
  if (currentTime - lastValidationTime >= validationInterval) {
    lastValidationTime = currentTime;
    validateDeviceAndUpdateIP();
  }

  // Handle physical button presses with debouncing
  for (int i = 0; i < 4; i++) {
    int reading = digitalRead(buttonPins[i]);
    if (reading != lastButtonState[i]) {
      lastStateChangeTime[i] = millis();
      lastButtonState[i] = reading;
    }
    if ((millis() - lastStateChangeTime[i]) > debounceTime) {
      if (reading != stableButtonState[i]) {
        stableButtonState[i] = reading;
        if (reading == LOW && (millis() - lastToggleTime[i] > minToggleInterval)) {
          toggleRelay(i);
          lastToggleTime[i] = millis();
        }
      }
    }
  }
}