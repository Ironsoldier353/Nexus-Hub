#include <WiFi.h>
#include <WebServer.h>

// Home WiFi credentials (for STA mode) // later on fetch from user database
const char* home_ssid = "Primary";
const char* home_password = "combat3d";

// Access Point credentials  // can be predefined or set by user 
const char* ap_ssid = "Appliance_Controller";
const char* ap_password = "nexus_hub";

// Static IP for AP mode    // where the ap serves
IPAddress local_IP(192, 168, 4, 1);
IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

// GPIO pins for relays and buttons   
const int relayPins[] = {5, 18, 19, 23};
const int buttonPins[] = {13, 12, 14, 27};
const String applianceNames[] = {"Living Room Light", "Fan", "Kitchen Light", "Air Conditioner"};

bool relayStates[] = {HIGH, HIGH, HIGH, HIGH};
bool lastButtonState[] = {HIGH, HIGH, HIGH, HIGH};
bool stableButtonState[] = {HIGH, HIGH, HIGH, HIGH};
unsigned long lastStateChangeTime[] = {0, 0, 0, 0};
unsigned long lastToggleTime[] = {0, 0, 0, 0};

const unsigned long debounceTime = 50;
const unsigned long minToggleInterval = 300;

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
  html += "<meta charset=\"UTF-8\"><title>ESP32 Smart Home Control</title><style>";
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
  html += ".control-info{background:#f3e5f5;color:#7b1fa2;padding:8px;text-align:center;font-size:11px}</style><script>function manualRefresh(){location.reload();}</script></head><body>";
  html += "<div class=\"container\"><div class=\"header\"><h1>🏠 Smart Home Control</h1><div class=\"subtitle\">ESP32 Appliance Controller</div></div>";
  html += "<div class=\"ip-info\">📶 STA IP: " + WiFi.localIP().toString() + "<br>📡 AP IP: " + WiFi.softAPIP().toString() + "<br>Network: " + String(ap_ssid) + "</div>";
  html += "<div class=\"control-info\">Simultaneous WiFi Client & Access Point | Local and Remote Control</div><div class=\"content\">";

  for (int i = 0; i < 4; i++) {
    bool isOn = (relayStates[i] == LOW);
    html += "<div class=\"appliance-card\"><div class=\"appliance-name\">" + applianceNames[i] + "</div>";
    html += "<span class=\"status " + String(isOn ? "on" : "off") + "\">" + (isOn ? "ON" : "OFF") + "</span>";
    html += "<form action=\"/toggle_relay_" + String(i) + "\" method=\"GET\" style=\"margin:0\">";
    html += "<button class=\"toggle-btn " + String(isOn ? "on" : "off") + "\" type=\"submit\">";
    html += (isOn ? "🔴 Turn OFF" : "🟢 Turn ON") + String("</button></form></div>");
  }

  html += "<form action=\"/refresh\" method=\"GET\"><button class=\"refresh-btn\" type=\"submit\" onclick=\"manualRefresh()\">🔄 Refresh Status</button></form>";
  html += "</div><div class=\"footer\">Tech StudyCell | ESP32 Controller<br>Mode: Dual STA + AP</div></div></body></html>";
  return html;
}

void setupServerRoutes() {
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
    json += "]}";
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
  WiFi.begin(home_ssid, home_password);
  Serial.println("Connecting to Home WiFi...");

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

  WiFi.softAPConfig(local_IP, gateway, subnet);
  if (WiFi.softAP(ap_ssid, ap_password)) {
    Serial.println("✅ AP Mode Enabled");
    Serial.println("AP IP: " + WiFi.softAPIP().toString());
  } else {
    Serial.println("❌ Failed to start AP mode");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  for (int i = 0; i < 4; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], HIGH);
    pinMode(buttonPins[i], INPUT_PULLUP);
    lastButtonState[i] = digitalRead(buttonPins[i]);
    stableButtonState[i] = lastButtonState[i];
  }

  setupWiFiDualMode();
  setupServerRoutes();
  server.begin();
  Serial.println("🌐 Web server running on both STA and AP mode!");
}

void loop() {
  server.handleClient();
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
