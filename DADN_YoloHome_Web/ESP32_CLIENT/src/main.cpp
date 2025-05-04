// main.cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
const char* ada_username = "your_adafruit_username";
//#include <WiFiEsp.h>
// Khai báo prototype cho các hàm được sử dụng trước khi định nghĩa
void parseStr(const String& str);
void run_servo(int value);

// Định nghĩa thông tin kết nối WiFi và MQTT
const char *ssid =  "Wokwi-GUEST";
const char *pswrd = "";
const char *mqtt_server = "192.168.26.42";
const char* ada_username = "your_adafruit_username";
const char* ada_key = "your_adafruit_io_key";
// Định nghĩa chân kết nối cho các thiết bị ngoại vi
const int tempPin   = 32;
const int presPin   = 33;
const int airPin    = 12;
const int lightPin  = 14;

Servo myServo; // Tạo đối tượng servo
int servoPin = 13;


// Khởi tạo đối tượng WiFi và MQTT client
WiFiClient espClient;
PubSubClient client(espClient);
WiFiClient espClient2;
PubSubClient adaClient(espClient2);
void setup_wifi() {
  delay(10);
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, pswrd);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
}

void reconnect() {
  // Vòng lặp cho đến khi kết nối MQTT thành công
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Cố gắng kết nối
    if (client.connect("ESP32Client")) {
      Serial.println("connected");
      // Subscribe vào topic từ broker
      client.subscribe("esp/cmd");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000); // Thử kết nối lại sau 5 giây
    }
  }
}

// Hàm callback xử lý tin nhắn đến từ MQTT
void callback(char *topic, byte *payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  // Kiểm tra topic nhận được
  if (String(topic) == "esp/cmd") {
    Serial.println("Received message: " + message);
    // Xử lý lệnh nhận được
    parseStr(message);
  }
}

// Hàm điều khiển servo dựa trên giá trị nhận được
void run_servo(int value) {
  if (value == 0) {
    myServo.write(0);
  } else {
    myServo.write(180);
  }
}

// Hàm xử lý chuỗi lệnh nhận được
void parseStr(const String& str) {
  // Tìm vị trí dấu phẩy
  int commaIndex = str.indexOf(',');

  // Tách tên cảm biến và trạng thái
  String sensorName = str.substring(0, commaIndex);
  int pinState = str.substring(commaIndex + 1).toInt();
  Serial.println("sensorName -> " + sensorName + ", pinState -> " + String(pinState));

  // Xử lý theo tên cảm biến
  if (sensorName == "temperature") {
    digitalWrite(tempPin, pinState);
  } else if (sensorName == "pressure") {
    digitalWrite(presPin, pinState);
  } else if (sensorName == "air") {
    // Nếu nhận lệnh từ cảm biến "air" thì điều khiển servo
    run_servo(pinState);
  } else if (sensorName == "light") {
    digitalWrite(lightPin, pinState);
  } else {
    Serial.println("Unknown sensor name");
  }
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  myServo.attach(servoPin); // Gắn servo vào chân chỉ định

  // Đặt các chân ngoại vi là OUTPUT
  pinMode(tempPin, OUTPUT);
  pinMode(presPin, OUTPUT);
  pinMode(airPin, OUTPUT);
  pinMode(lightPin, OUTPUT);
  adaClient.setServer("io.adafruit.com", 1883);
  adaClient.setCallback(adaCallback);
}
void adaCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  String topicStr = String(topic);
  Serial.print("Ada message arrived [");
  Serial.print(topicStr);
  Serial.print("] ");
  Serial.println(message);
  
  // Kiểm tra nếu đây là feed fan
  if (topicStr.indexOf("/feeds/fan") > 0) {
    // Chuyển đổi message thành trạng thái (0/1)
    int value = message.toInt();
    digitalWrite(fanPin, value);
    Serial.println(value ? "Fan ON" : "Fan OFF");
  }
  // Kiểm tra nếu đây là feed light
  else if (topicStr.indexOf("/feeds/light") > 0) {
    // Chuyển đổi message thành trạng thái (0/1)
    int value = message.toInt();
    digitalWrite(lightPin, value);
    Serial.println(value ? "Light ON" : "Light OFF");
  }
}
void reconnectAda() {
  while (!adaClient.connected()) {
    Serial.print("Attempting Adafruit IO MQTT connection...");
    if (adaClient.connect("ESP32Client", ada_username, ada_key)) {
      Serial.println("connected to Adafruit IO");
      // Subscribe vào các feed cần thiết
      adaClient.subscribe((String(ada_username) + "/feeds/fan").c_str());
      adaClient.subscribe((String(ada_username) + "/feeds/light").c_str());
    } else {
      Serial.print("failed, rc=");
      Serial.print(adaClient.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Lưu ý: Dòng gọi run_servo() không có tham số đã bị xóa vì hàm run_servo yêu cầu 1 tham số.
  // Nếu bạn muốn kiểm tra servo tại đây, hãy gọi run_servo với tham số phù hợp, ví dụ:
  // run_servo(1);

  // Giả lập đọc giá trị cảm biến
  float temperature = random(0, 100) + random(0, 100) / 100.0;
  float pressure = random(0, 1000) + random(0, 100) / 100.0;
  float airQuality = random(0, 500) + random(0, 100) / 100.0;
  float light = random(0, 100) + random(0, 100) / 100.0;

  // Gộp các giá trị cảm biến thành chuỗi, phân tách bằng dấu phẩy
  String payload = String(temperature) + "," +
                   String(pressure) + "," +
                   String(airQuality) + "," +
                   String(light);

  // Publish dữ liệu cảm biến lên MQTT topic
  client.publish("home/sensors/data", payload.c_str());
  Serial.print("Sensor data sent: ");
  Serial.println(payload);

  delay(5000); // Gửi dữ liệu sau mỗi 5 giây
  if (!adaClient.connected()) {
    reconnectAda();
  }
  adaClient.loop();
  static unsigned long lastPublish = 0;
  if (millis() - lastPublish > 30000) { // Cập nhật mỗi 30 giây
    lastPublish = millis();
    
    // Đọc trạng thái fan
    int fanState = digitalRead(fanPin);
    adaClient.publish((String(ada_username) + "/feeds/fan").c_str(), 
                     String(fanState).c_str());
    
    // Đọc trạng thái light
    int lightState = digitalRead(lightPin);
    adaClient.publish((String(ada_username) + "/feeds/light").c_str(), 
                     String(lightState).c_str());
  }
}

