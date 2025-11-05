#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// Home WiFi credentials (used for first upload)
const char* default_home_ssid = "Primary";
const char* default_home_password = "combat3d";

// Access Point credentials for ap mode
const char* ap_ssid = "DoorLock_Controller";
const char* ap_password = "nexus_hub";

// Backend server URL
const char* serverURL = "https://nexus-hub-vvqm.onrender.com/api/v1/devices";

// Static IP for AP mode
IPAddress local_IP(192, 168, 4, 1);
IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

// Single relay & button pins
const int relayPin = 5;    // relay
const int buttonPin = 13;  // switch
const String applianceName = "Door Lock";

bool relayState = HIGH;     // HIGH = OFF (relay inactive)
bool lastButtonState = HIGH;
bool stableButtonState = HIGH;
unsigned long lastStateChangeTime = 0;
unsigned long lastToggleTime = 0;

const unsigned long debounceTime = 50;
const unsigned long minToggleInterval = 300;

// Backend-related variables
bool isConfigured = false;
String configuredSSID = "";
String configuredPassword = "";
String deviceId = "";
String deviceName = "";

// Polling intervals
const unsigned long validationInterval = 60000;
unsigned long lastValidationTime = 0;

// Preferences
Preferences preferences;
WebServer server(80);

void setRelayState(bool state) {
  relayState = state;
  digitalWrite(relayPin, state);
  Serial.printf("Door Lock set to %s\n", state == LOW ? "UNLOCKED" : "LOCKED");
}

void toggleRelay() {
  setRelayState(!relayState);
}

String generateHTML() {
  bool isOn = (relayState == LOW);
  String html = "<!DOCTYPE html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\">";
  html += "<meta charset=\"UTF-8\"><title>Nexus Hub Door Lock</title><style>";
  html += "*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#6a11cb,#2575fc);min-height:100vh;padding:20px}";
  html += ".container{max-width:450px;margin:auto;background:white;border-radius:15px;box-shadow:0 10px 25px rgba(0,0,0,0.3);overflow:hidden}";
  html += ".header{background:linear-gradient(45deg,#2196F3,#21CBF3);color:white;padding:30px 20px;text-align:center}";
  html += "h1{font-size:24px;margin-bottom:5px}.subtitle{opacity:0.9;font-size:14px}.content{padding:30px 20px}";
  html += ".appliance-card{background:#f8f9fa;border-radius:10px;padding:20px;margin-bottom:15px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}";
  html += ".appliance-name{font-weight:bold;font-size:18px;color:#333;margin-bottom:10px}";
  html += ".status{display:inline-block;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:bold;margin-bottom:15px}";
  html += ".status.on{background:#4CAF50;color:white}.status.off{background:#f44336;color:white}";
  html += ".toggle-btn{width:100%;padding:14px;font-size:16px;border:none;border-radius:8px;cursor:pointer;transition:0.3s;font-weight:bold}";
  html += ".toggle-btn.on{background:#f44336;color:white}.toggle-btn.on:hover{background:#d32f2f}";
  html += ".toggle-btn.off{background:#4CAF50;color:white}.toggle-btn.off:hover{background:#388E3C}";
  html += ".refresh-btn{background:#2196F3;color:white;padding:12px 30px;border:none;border-radius:25px;font-size:16px;cursor:pointer;margin:20px auto;display:block;transition:0.3s}";
  html += ".refresh-btn:hover{background:#1976D2;transform:translateY(-2px)}.footer{text-align:center;color:#666;font-size:12px;padding:15px;border-top:1px solid #eee}";
  html += ".ip-info{background:#e3f2fd;color:#1565c0;padding:10px;text-align:center;font-size:12px}";
  html += ".control-info{background:#f3e5f5;color:#7b1fa2;padding:8px;text-align:center;font-size:11px}";
  html += ".backend-status{background:" + String(isConfigured ? "#e8f5e8" : "#fff3e0") + ";color:" + String(isConfigured ? "#2e7d32" : "#f57c00") + ";padding:8px;text-align:center;font-size:11px}";
  html += "</style><script>function manualRefresh(){location.reload();}</script></head><body>";
  html += "<div class=\"container\"><div class=\"header\"><h1>🔒 Nexus Hub</h1><div class=\"subtitle\">Smart Door Lock Controller</div></div>";
  
  html += "<div class=\"ip-info\">📶 STA IP: " + WiFi.localIP().toString() + "<br>📡 AP IP: " + WiFi.softAPIP().toString() + "<br>Network: " + String(ap_ssid) + "</div>";
  html += "<div class=\"control-info\">Dual Mode (WiFi + AP) | Local Control</div>";
  
  String statusText = isConfigured ? "🌐 Connected to Backend" : "⚠️ Waiting for Backend Configuration";
  if (isConfigured && deviceName.length() > 0) statusText += " | Device: " + deviceName;
  html += "<div class=\"backend-status\">" + statusText + "</div>";
  
  html += "<div class=\"content\">";
  html += "<div class=\"appliance-card\"><div class=\"appliance-name\">" + applianceName + "</div>";
  html += "<span class=\"status " + String(isOn ? "on" : "off") + "\">" + (isOn ? "UNLOCKED" : "LOCKED") + "</span>";
  html += "<form action=\"/toggle_relay\" method=\"GET\" style=\"margin:0\">";
  html += "<button class=\"toggle-btn " + String(isOn ? "on" : "off") + "\" type=\"submit\">";
  html += (isOn ? "🔴 Lock Door" : "🟢 Unlock Door") + String("</button></form></div>");
  html += "<form action=\"/refresh\" method=\"GET\"><button class=\"refresh-btn\" type=\"submit\" onclick=\"manualRefresh()\">🔄 Refresh Status</button></form>";
  html += "</div><div class=\"footer\">Nexus Crew | ESP32 Door Lock<br>Mode: Dual STA + AP</div></div></body></html>";
  return html;
}

void setupServerRoutes() {
  server.on("/", HTTP_GET, []() {
    server.send(200, "text/html", generateHTML());
  });

  server.on("/toggle_relay", HTTP_GET, []() {
    toggleRelay();
    server.send(200, "text/html", generateHTML());
  });

  server.on("/status", HTTP_GET, []() {
    String json = "{\"doorLock\":" + String(relayState == LOW ? "true" : "false");
    json += ",\"deviceId\":\"" + deviceId + "\",\"configured\":" + String(isConfigured ? "true" : "false");
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
    Serial.println("\n Connected to WiFi");
    Serial.println("STA IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n WiFi connection failed");
  }

  WiFi.softAPConfig(local_IP, gateway, subnet);
  if (WiFi.softAP(ap_ssid, ap_password)) {
    Serial.println(" AP Mode Active: " + WiFi.softAPIP().toString());
  } else {
    Serial.println(" AP Mode Failed");
  }
}

// Backend Validation 
void validateDeviceAndUpdateIP() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Skipping validation.");
    return;
  }

  HTTPClient http;
  http.begin(String(serverURL) + "/validatedevice");
  http.addHeader("Content-Type", "application/json");

  String mac = WiFi.macAddress();
  String ip = WiFi.localIP().toString();

  DynamicJsonDocument doc(300);
  doc["macAddress"] = mac;
  doc["ipAddress"] = ip;
  String payload;
  serializeJson(doc, payload);

  Serial.println("Sending validation request...");
  int code = http.POST(payload);
  Serial.println("Response Code: " + String(code));

  if (code == 200) {
    String res = http.getString();
    DynamicJsonDocument resDoc(1024);
    if (!deserializeJson(resDoc, res)) {
      String newDeviceId = resDoc["device"]["_id"] | resDoc["_id"] | "";
      String newDeviceName = resDoc["device"]["deviceName"] | resDoc["deviceName"] | "";
      String newSSID = resDoc["device"]["ssid"] | "";
      String newPass = resDoc["device"]["password"] | "";

      if (newDeviceId.length()) {
        preferences.putBool("configured", true);
        preferences.putString("deviceId", newDeviceId);
        preferences.putString("deviceName", newDeviceName);
        if (newSSID.length()) {
          preferences.putString("ssid", newSSID);
          preferences.putString("password", newPass);
        }
        deviceId = newDeviceId;
        deviceName = newDeviceName;
        configuredSSID = newSSID;
        configuredPassword = newPass;
        isConfigured = true;
        Serial.println("✅ Device validated and configuration saved");
      }
    }
  } else {
    Serial.println("Validation failed: " + http.getString());
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("🚪 ESP32 Door Lock Controller Starting...");

  preferences.begin("doorlock-config", false);
  isConfigured = preferences.getBool("configured", false);
  deviceId = preferences.getString("deviceId", "");
  deviceName = preferences.getString("deviceName", "");
  configuredSSID = preferences.getString("ssid", "");
  configuredPassword = preferences.getString("password", "");

  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, HIGH); // Locked initially
  pinMode(buttonPin, INPUT_PULLUP);

  setupWiFiDualMode();
  setupServerRoutes();
  server.begin();
  Serial.println("🌐 Web server running at:");
  Serial.println("STA: http://" + WiFi.localIP().toString());
  Serial.println("AP : http://" + WiFi.softAPIP().toString());
}

void loop() {
  server.handleClient();

  unsigned long now = millis();
  if (WiFi.status() != WL_CONNECTED && now % 10000 < 50) {
    setupWiFiDualMode();
  }

  if (now - lastValidationTime >= validationInterval) {
    lastValidationTime = now;
    validateDeviceAndUpdateIP();
  }

  // Button debounce
  int reading = digitalRead(buttonPin);
  if (reading != lastButtonState) {
    lastStateChangeTime = now;
    lastButtonState = reading;
  }
  if ((now - lastStateChangeTime) > debounceTime) {
    if (reading != stableButtonState) {
      stableButtonState = reading;
      if (reading == LOW && (now - lastToggleTime > minToggleInterval)) {
        toggleRelay();
        lastToggleTime = now;
      }
    }
  }
}
