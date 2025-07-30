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
const char* serverURL = "https://smart-home-60xb.onrender.com/api/v1/devices";

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
String applianceIds[4] = {"", "", "", ""};

// Polling intervals
const unsigned long validationInterval = 15000; // 15 seconds
const unsigned long statusUpdateInterval = 60000; // 1 minute
unsigned long lastValidationTime = 0;
unsigned long lastStatusUpdateTime = 0;

// Preferences for storing configuration
Preferences preferences;

WebServer server(80);

void setRelayState(int relayIndex, bool state) {
  relayStates[relayIndex] = state;
  digitalWrite(relayPins[relayIndex], state);
  Serial.printf("Relay %d (%s) set to %s\n", relayIndex + 1, applianceNames[relayIndex].c_str(), state == LOW ? "ON" : "OFF");
  
  // Update backend if configured and appliance ID exists
  if (isConfigured && applianceIds[relayIndex].length() > 0) {
    updateApplianceState(applianceIds[relayIndex], state == LOW); // LOW = ON
  }
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
  html += "<div class=\"control-info\">Simultaneous WiFi Client & Access Point </div>";
  
  // Backend status
  html += "<div class=\"backend-status\">" + String(isConfigured ? "🌐 Connected to Server | Device ID: " + deviceId : "⚠️ Waiting for Backend Configuration") + "</div>";
  
  html += "<div class=\"content\">";

  for (int i = 0; i < 4; i++) {
    bool isOn = (relayStates[i] == LOW);
    html += "<div class=\"appliance-card\"><div class=\"appliance-name\">" + applianceNames[i];
    if (isConfigured && applianceIds[i].length() > 0) {
      html += " <small style=\"color:#666\">(ID: " + applianceIds[i].substring(applianceIds[i].length()-6) + ")</small>";
    }
    html += "</div>";
    html += "<span class=\"status " + String(isOn ? "on" : "off") + "\">" + (isOn ? "ON" : "OFF") + "</span>";
    html += "<form action=\"/toggle_relay_" + String(i) + "\" method=\"GET\" style=\"margin:0\">";
    html += "<button class=\"toggle-btn " + String(isOn ? "on" : "off") + "\" type=\"submit\">";
    html += (isOn ? "🔴 Turn OFF" : "🟢 Turn ON") + String("</button></form></div>");
  }

  html += "<form action=\"/refresh\" method=\"GET\"><button class=\"refresh-btn\" type=\"submit\" onclick=\"manualRefresh()\">🔄 Refresh Status</button></form>";
  html += "</div><div class=\"footer\">Nexus Crew | Appliance Controller<br>Mode: Dual ( STA + AP ) </div></div></body></html>";
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
    json += "],\"deviceId\":\"" + deviceId + "\",\"configured\":" + String(isConfigured ? "true" : "false") + "}";
    server.send(200, "application/json", json);
  });

  server.on("/refresh", HTTP_GET, []() {
    server.send(200, "text/html", generateHTML());
  });

  // API routes for backend control
  server.on("/api/control", HTTP_POST, handleApiControl);
  server.on("/api/status", HTTP_GET, handleApiStatus);

  server.onNotFound([]() {
    server.send(404, "text/plain", "Page not found");
  });
}

void handleApiControl() {
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    DynamicJsonDocument doc(200);
    DeserializationError error = deserializeJson(doc, body);
    
    if (!error) {
      String targetApplianceId = doc["applianceId"].as<String>();
      String stateStr = doc["state"].as<String>();
      bool targetState = (stateStr == "on");
      
      bool success = false;
      
      // Find which relay corresponds to the appliance ID
      for (int i = 0; i < 4; i++) {
        if (targetApplianceId == applianceIds[i]) {
          setRelayState(i, targetState ? LOW : HIGH); // LOW = ON for relay
          success = true;
          break;
        }
      }
      
      if (success) {
        String responseJson = "{\"success\":true,\"applianceId\":\"" + targetApplianceId + "\",\"state\":\"" + stateStr + "\"}";
        server.send(200, "application/json", responseJson);
      } else {
        server.send(404, "application/json", "{\"error\":\"Appliance not found\"}");
      }
    } else {
      server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    }
  } else {
    server.send(400, "application/json", "{\"error\":\"No data provided\"}");
  }
}

void handleApiStatus() {
  DynamicJsonDocument statusDoc(512);
  statusDoc["deviceId"] = deviceId;
  statusDoc["isOnline"] = true;
  statusDoc["ipAddress"] = WiFi.localIP().toString();
  statusDoc["configured"] = isConfigured;
  
  JsonArray applianceStates = statusDoc.createNestedArray("applianceStates");
  
  for (int i = 0; i < 4; i++) {
    JsonObject appliance = applianceStates.createNestedObject();
    appliance["index"] = i;
    appliance["name"] = applianceNames[i];
    appliance["state"] = (relayStates[i] == LOW) ? "on" : "off";
    if (applianceIds[i].length() > 0) {
      appliance["id"] = applianceIds[i];
    }
  }
  
  String json;
  serializeJson(statusDoc, json);
  server.send(200, "application/json", json);
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

void validateDevice() {
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
  
  Serial.println("=== DEVICE VALIDATION ===");
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

    DynamicJsonDocument responseDoc(2048); // Increased buffer size
    DeserializationError error = deserializeJson(responseDoc, response);

    if (!error) {
      // Print all fields in response for debugging
      Serial.println("=== PARSING RESPONSE ===");
      
      if (responseDoc.containsKey("device")) {
        JsonObject device = responseDoc["device"];
        String newDeviceId = device["_id"].as<String>();
        Serial.println("Found device ID: " + newDeviceId);
        
        if (device.containsKey("appliances") && device["appliances"].is<JsonArray>()) {
          JsonArray appliances = device["appliances"].as<JsonArray>();
          Serial.print("Found ");
          Serial.print(appliances.size());
          Serial.println(" appliances");
          
          for (int i = 0; i < appliances.size() && i < 4; i++) {
            if (appliances[i].containsKey("_id")) {
              applianceIds[i] = appliances[i]["_id"].as<String>();
              Serial.print("Appliance ");
              Serial.print(i);
              Serial.print(" ID: ");
              Serial.println(applianceIds[i]);
            }
          }
        } else {
          Serial.println("No appliances found in device object");
        }
        
        // Check for WiFi credentials in device object
        String newSSID = device["ssid"] | "";
        String newPassword = device["password"] | "";
        
        Serial.println("SSID from device: " + newSSID);
        Serial.println("Password length: " + String(newPassword.length()));
        
        if (newDeviceId.length() > 0) {
          // Save configuration
          preferences.putBool("configured", true);
          preferences.putString("deviceId", newDeviceId);
          
          // Save WiFi credentials if provided, otherwise keep current
          if (newSSID.length() > 0 && newPassword.length() > 0) {
            preferences.putString("ssid", newSSID);
            preferences.putString("password", newPassword);
            configuredSSID = newSSID;
            configuredPassword = newPassword;
            Serial.println("Updated WiFi credentials");
          } else {
            Serial.println("No new WiFi credentials, keeping current");
          }
          
          // Save appliance IDs
          preferences.putString("appliance0", applianceIds[0]);
          preferences.putString("appliance1", applianceIds[1]);
          preferences.putString("appliance2", applianceIds[2]);
          preferences.putString("appliance3", applianceIds[3]);

          Serial.println("✅ Device configuration saved successfully!");
          Serial.println("Device ID: " + newDeviceId);
          
          // Update local variables
          deviceId = newDeviceId;
          isConfigured = true;

          // Reconnect WiFi if credentials changed
          if (newSSID.length() > 0 && newPassword.length() > 0) {
            Serial.println("Reconnecting to new WiFi...");
            setupWiFiDualMode();
            delay(2000);
          }
          
          // Send initial status update
          sendStatusUpdate();
        } else {
          Serial.println("❌ Error: No device ID found in response");
        }
      } else {
        // Try alternative response format
        String newDeviceId = responseDoc["deviceId"] | responseDoc["_id"] | "";
        String newSSID = responseDoc["ssid"] | "";
        String newPassword = responseDoc["password"] | "";
        
        Serial.println("Alternative format - Device ID: " + newDeviceId);
        Serial.println("Alternative format - SSID: " + newSSID);
        
        if (responseDoc.containsKey("appliances") && responseDoc["appliances"].is<JsonArray>()) {
          JsonArray appliances = responseDoc["appliances"].as<JsonArray>();
          Serial.print("Found ");
          Serial.print(appliances.size());
          Serial.println(" appliances in root");
          
          for (int i = 0; i < appliances.size() && i < 4; i++) {
            if (appliances[i].containsKey("_id")) {
              applianceIds[i] = appliances[i]["_id"].as<String>();
              Serial.print("Appliance ");
              Serial.print(i);
              Serial.print(" ID: ");
              Serial.println(applianceIds[i]);
            }
          }
        }
        
        if (newDeviceId.length() > 0) {
          preferences.putBool("configured", true);
          preferences.putString("deviceId", newDeviceId);
          
          if (newSSID.length() > 0 && newPassword.length() > 0) {
            preferences.putString("ssid", newSSID);
            preferences.putString("password", newPassword);
            configuredSSID = newSSID;
            configuredPassword = newPassword;
          }
          
          preferences.putString("appliance0", applianceIds[0]);
          preferences.putString("appliance1", applianceIds[1]);
          preferences.putString("appliance2", applianceIds[2]);
          preferences.putString("appliance3", applianceIds[3]);
          
          deviceId = newDeviceId;
          isConfigured = true;
          
          Serial.println("✅ Device configured with alternative format!");
          sendStatusUpdate();
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

void sendStatusUpdate() {
  if (!isConfigured || WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  String url = String(serverURL) + "/updatestatus/" + deviceId;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);
  
  DynamicJsonDocument statusDoc(512);
  statusDoc["deviceId"] = deviceId;
  statusDoc["ipAddress"] = WiFi.localIP().toString();
  statusDoc["isOnline"] = true;
  
  JsonArray applianceStates = statusDoc.createNestedArray("applianceStates");
  
  for (int i = 0; i < 4; i++) {
    if (applianceIds[i].length() > 0) {
      JsonObject appliance = applianceStates.createNestedObject();
      appliance["id"] = applianceIds[i];
      appliance["state"] = (relayStates[i] == LOW) ? "on" : "off";
    }
  }
  
  String json;
  serializeJson(statusDoc, json);
  
  Serial.print("Sending status update to URL: ");
  Serial.println(url);
  Serial.print("Payload: ");
  Serial.println(json);
  
  int httpResponseCode = http.POST(json);
  Serial.print("Status update response code: ");
  Serial.println(httpResponseCode);
  
  if (httpResponseCode == 200 || httpResponseCode == 201) {
    Serial.println("Status update successful");
  } else {
    Serial.print("Status update failed with code: ");
    Serial.println(httpResponseCode);
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("Error response: ");
      Serial.println(response);
    }
  }
  
  http.end();
}

void updateApplianceState(String applianceId, bool state) {
  if (!isConfigured || WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  String url = String(serverURL) + "/updateappliance";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);
  
  DynamicJsonDocument requestDoc(200);
  requestDoc["applianceId"] = applianceId;
  requestDoc["state"] = state ? "on" : "off";
  String json;
  serializeJson(requestDoc, json);
  
  Serial.print("Sending appliance update to URL: ");
  Serial.println(url);
  Serial.print("Payload: ");
  Serial.println(json);
  
  int httpResponseCode = http.POST(json);
  Serial.print("Appliance update response code: ");
  Serial.println(httpResponseCode);
  
  if (httpResponseCode == 200 || httpResponseCode == 201) {
    Serial.println("Appliance state update successful");
  } else {
    Serial.print("Appliance state update failed with code: ");
    Serial.println(httpResponseCode);
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("Error response: ");
      Serial.println(response);
    }
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
  
  if (isConfigured) {
    configuredSSID = preferences.getString("ssid", "");
    configuredPassword = preferences.getString("password", "");
    
    // Load appliance IDs
    applianceIds[0] = preferences.getString("appliance0", "");
    applianceIds[1] = preferences.getString("appliance1", "");
    applianceIds[2] = preferences.getString("appliance2", "");
    applianceIds[3] = preferences.getString("appliance3", "");
    
    Serial.println("Device configured. Device ID: " + deviceId);
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
  
  // Backend validation (only if not configured)
  if (!isConfigured && currentTime - lastValidationTime >= validationInterval) {
    lastValidationTime = currentTime;
    validateDevice();
  }

  // Periodic status updates (only if configured)
  if (isConfigured && currentTime - lastStatusUpdateTime >= statusUpdateInterval) {
    lastStatusUpdateTime = currentTime;
    sendStatusUpdate();
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
