#include <WiFi.h>
#include <WebServer.h>

// Automatic WiFi mode - tries home WiFi first, falls back to Access Point
#define USE_AUTO_MODE

// Home WiFi credentials (for client mode) // later on can be fetched from user db
const char* home_ssid = "Primary";
const char* home_password = "combat3d";

// Access Point credentials (fallback mode)
const char* ap_ssid = "Appliance_Controller";
const char* ap_password = "nexus_hub";

// Static IP configuration for AP mode
IPAddress local_IP(192, 168, 4, 1);
IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

// Connection mode tracking
bool isAccessPointMode = false;

// GPIO pins for relays (active low)
const int relayPins[] = {5, 18, 19, 23};

// GPIO pins for manual switch
const int buttonPins[] = {13, 12, 14, 27};

// Appliance names // will be used the names set by the respected user
const String applianceNames[] = {"Living Room Light", "Fan", "Kitchen Light", "Air Conditioner"};

// Relay states
bool relayStates[] = {HIGH, HIGH, HIGH, HIGH}; // HIGH = OFF (active low relays)

// Simple button state tracking with better debouncing
bool lastButtonState[] = {HIGH, HIGH, HIGH, HIGH};  
bool stableButtonState[] = {HIGH, HIGH, HIGH, HIGH};
unsigned long lastStateChangeTime[] = {0, 0, 0, 0};
unsigned long lastToggleTime[] = {0, 0, 0, 0};
const unsigned long debounceTime = 50;
const unsigned long minToggleInterval = 300;        // Minimum time between toggles (300ms) for better data tracking

WebServer server(80);

// Function to set relay state
void setRelayState(int relayIndex, bool state) {
  relayStates[relayIndex] = state;
  digitalWrite(relayPins[relayIndex], state);
  
  Serial.print("Relay ");
  Serial.print(relayIndex + 1);
  Serial.print(" (");
  Serial.print(applianceNames[relayIndex]);
  Serial.print(") set to ");
  Serial.println(state == LOW ? "ON" : "OFF");
}

// Function to toggle relay state
void toggleRelay(int relayIndex) {
  setRelayState(relayIndex, !relayStates[relayIndex]);
}

String generateHTML() {
  String html = "<!DOCTYPE html><html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">";
  html += "<meta charset=\"UTF-8\">";
  html += "<title>ESP32 Smart Home Control</title>";
  html += "<style>";
  html += "* { box-sizing: border-box; margin: 0; padding: 0; }";
  html += "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }";
  html += ".container { max-width: 500px; margin: auto; background: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); overflow: hidden; }";
  html += ".header { background: linear-gradient(45deg, #2196F3, #21CBF3); color: white; padding: 30px 20px; text-align: center; }";
  html += "h1 { font-size: 24px; margin-bottom: 5px; }";
  html += ".subtitle { opacity: 0.9; font-size: 14px; }";
  html += ".content { padding: 30px 20px; }";
  html += ".appliance-card { background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }";
  html += ".appliance-name { font-weight: bold; font-size: 16px; color: #333; margin-bottom: 10px; }";
  html += ".status { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 15px; }";
  html += ".status.on { background: #4CAF50; color: white; }";
  html += ".status.off { background: #f44336; color: white; }";
  html += ".toggle-btn { width: 100%; padding: 12px; font-size: 16px; border: none; border-radius: 8px; cursor: pointer; transition: all 0.3s; font-weight: bold; }";
  html += ".toggle-btn.on { background: #f44336; color: white; } .toggle-btn.on:hover { background: #d32f2f; }";
  html += ".toggle-btn.off { background: #4CAF50; color: white; } .toggle-btn.off:hover { background: #388E3C; }";
  html += ".refresh-btn { background: #2196F3; color: white; padding: 12px 30px; border: none; border-radius: 25px; font-size: 16px; cursor: pointer; margin: 20px auto; display: block; transition: all 0.3s; }";
  html += ".refresh-btn:hover { background: #1976D2; transform: translateY(-2px); }";
  html += ".footer { text-align: center; color: #666; font-size: 12px; padding: 15px; border-top: 1px solid #eee; }";
  html += ".ip-info { background: #e3f2fd; color: #1565c0; padding: 10px; text-align: center; font-size: 12px; }";
  html += ".control-info { background: #f3e5f5; color: #7b1fa2; padding: 8px; text-align: center; font-size: 11px; }";
  html += "</style>";
  
  // manual refresh script
  html += "<script>";
  html += "function manualRefresh() {";
  html += "  location.reload();";
  html += "}";
  html += "</script>";
  
  html += "</head><body>";
  html += "<div class=\"container\">";
  html += "<div class=\"header\">";
  html += "<h1>🏠 Smart Home Control</h1>";
  html += "<div class=\"subtitle\">ESP32 Appliance Controller</div>";
  html += "</div>";
  
  // Show current connection info based on mode
  if (!isAccessPointMode) {
    html += "<div class=\"ip-info\">📶 Connected to Home WiFi | IP: " + WiFi.localIP().toString() + "</div>";
  } else {
    html += "<div class=\"ip-info\">📡 Access Point Mode | IP: " + WiFi.softAPIP().toString() + " | Network: " + String(ap_ssid) + "</div>";
  }
  
  html += "<div class=\"control-info\">🔄 Auto-mode: WiFi Client → Access Point fallback | Manual switches ready</div>";
  html += "<div class=\"content\">";
  
  // Appliance control cards
  for (int i = 0; i < 4; i++) {
    bool isOn = (relayStates[i] == LOW);
    html += "<div class=\"appliance-card\">";
    html += "<div class=\"appliance-name\">" + applianceNames[i] + "</div>";
    html += "<span class=\"status " + String(isOn ? "on" : "off") + "\">" + String(isOn ? "ON" : "OFF") + "</span>";
    html += "<form action=\"/toggle_relay_" + String(i) + "\" method=\"GET\" style=\"margin: 0;\">";
    html += "<button class=\"toggle-btn " + String(isOn ? "on" : "off") + "\" type=\"submit\">";
    html += String(isOn ? "🔴 Turn OFF" : "🟢 Turn ON");
    html += "</button></form>";
    html += "</div>";
  }

  html += "<form action=\"/refresh\" method=\"GET\" style=\"margin: 0;\">";
  html += "<button class=\"refresh-btn\" type=\"submit\" onclick=\"manualRefresh()\">🔄 Refresh Status</button>";
  html += "</form>";
  
  html += "</div>";
  html += "<div class=\"footer\">";
  html += "Tech StudyCell | ESP32 Controller<br>";
  html +=     "Current Mode: " + String(isAccessPointMode ? "Access Point" : "WiFi Client");
  html += "</div>";
  html += "</div></body></html>";
  return html;
}

void setupServerRoutes() {
  // Main page
  server.on("/", HTTP_GET, []() {
    server.send(200, "text/html", generateHTML());
  });

  // Relay toggle routes
  for (int i = 0; i < 4; i++) {
    int relayIndex = i;
    server.on(("/toggle_relay_" + String(i)).c_str(), HTTP_GET, [relayIndex]() {
      toggleRelay(relayIndex);
      Serial.println("Web toggle: Relay " + String(relayIndex + 1));
      server.send(200, "text/html", generateHTML());
    });
  }

  // Status API for real-time updates
  server.on("/status", HTTP_GET, []() {
    String json = "{\"relays\":[";
    for (int i = 0; i < 4; i++) {
      json += (relayStates[i] == LOW) ? "true" : "false";
      if (i < 3) json += ",";
    }
    json += "]}";
    server.send(200, "application/json", json);
  });

  // Manual refresh route
  server.on("/refresh", HTTP_GET, []() {
    server.send(200, "text/html", generateHTML());
  });

  // 404 handler
  server.onNotFound([]() {
    server.send(404, "text/plain", "Page not found");
  });
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== ESP32 Dual-Control Smart Home System ===");

  // Initialize relay pins
  for (int i = 0; i < 4; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], HIGH); // Start with relays OFF initially
    Serial.println("Relay " + String(i+1) + " (" + applianceNames[i] + ") initialized - OFF");
  }

  // Initialize button pins and states
  for (int i = 0; i < 4; i++) {
    pinMode(buttonPins[i], INPUT_PULLUP);
    delay(10);
    lastButtonState[i] = digitalRead(buttonPins[i]);
    stableButtonState[i] = lastButtonState[i];
    Serial.println("Button " + String(i+1) + " (GPIO " + String(buttonPins[i]) + ") initial state: " + String(lastButtonState[i] == HIGH ? "HIGH" : "LOW"));
  }
  Serial.println("Physical switches initialized on GPIO: 13, 12, 14, 27");

  // Smart WiFi Connection - Try home WiFi first, fallback to Access Point
  Serial.println("\n=== Smart WiFi Setup ===");
  Serial.println("Attempting to connect to home WiFi first...");
  
  WiFi.begin(home_ssid, home_password);
  
  // Try to connect for 15 seconds
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    // Successfully connected to home WiFi
    isAccessPointMode = false;
    Serial.println("\n✅ Connected to home WiFi successfully!");
    Serial.println("SSID: " + String(home_ssid));
    Serial.println("IP Address: " + WiFi.localIP().toString());
    Serial.println("Access via: http://" + WiFi.localIP().toString());
    Serial.println("Mode: WiFi Client (Internet available)");
  } else {
    // Failed to connect, switch to Access Point mode
    Serial.println("\n❌ Failed to connect to home WiFi");
    Serial.println("🔄 Switching to Access Point mode...");
    
    WiFi.disconnect();
    delay(1000);
    
    WiFi.softAPConfig(local_IP, gateway, subnet);
    if (WiFi.softAP(ap_ssid, ap_password)) {
      isAccessPointMode = true;
      Serial.println("✅ Access Point created successfully!");
      Serial.println("SSID: " + String(ap_ssid));
      Serial.println("Password: " + String(ap_password));
      Serial.println("IP Address: " + WiFi.softAPIP().toString());
      Serial.println("Connect to '" + String(ap_ssid) + "' and visit: http://" + WiFi.softAPIP().toString());
      Serial.println("Mode: Access Point (No internet, local control only)");
    } else {
      Serial.println("❌ Failed to create Access Point!");
      Serial.println("⚠  Manual intervention required");
      return;
    }
  }

  setupServerRoutes();
  server.begin();
  Serial.println("✓ Web server started in auto-mode!");
  Serial.println("=== Smart Dual-Mode System Ready ===\n");
  Serial.println("🧠 Automatically chose best connection method!");
}

void loop() {
  server.handleClient();

  // Improved button handling with proper debouncing
  for (int i = 0; i < 4; i++) {
    int currentReading = digitalRead(buttonPins[i]);
    
    
    // Check if button state has changed
    if (currentReading != lastButtonState[i]) {
      // State changed, reset debounce timer
      lastStateChangeTime[i] = millis();
      lastButtonState[i] = currentReading;
      
    }
    
    // Check if state has been stable for debounce time
    if ((millis() - lastStateChangeTime[i]) > debounceTime) {
      // State is stable, check if it's different from our stable state
      if (currentReading != stableButtonState[i]) {
        stableButtonState[i] = currentReading;
        
        // If button was pressed (HIGH to LOW transition)
        if (stableButtonState[i] == LOW) {
          // Check minimum time between toggles
          if (millis() - lastToggleTime[i] > minToggleInterval) {
            toggleRelay(i);
            lastToggleTime[i] = millis();
            Serial.println("Button " + String(i+1) + " (GPIO " + String(buttonPins[i]) + ") - STABLE PRESS - Toggle executed");
          } else {
            Serial.println("Button " + String(i+1) + " - Press too soon after last toggle");
          }
        }
      }
    }
  }
}