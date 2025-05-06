**YoloHome Smart Home System**

**Overview** :YoloHome is a comprehensive smart home monitoring and control system built with a modern tech stack. The system features real-time sensor monitoring, intelligent alerts, device control, and AI-powered temperature prediction to create a responsive and efficient home environment.

**Key Features**
- Real-time monitoring of temperature, humidity, and motion sensors
- Smart device control for lights, fans, and other connected appliances
- Intelligent alert system with customizable thresholds and notifications
- AI prediction module that forecasts temperature trends and automates cooling
- Responsive dashboard with comprehensive visualization of home environment
- Secure user authentication and device management
  
**Technical Stack**
- Frontend: React, Recharts, Axios
- Backend: Node.js, PostgreSQL
- AI Module: Python, scikit-learn, pandas, NumPy
- IoT Communication: MQTT protocol for device control

**Run the application**
1. **Create the Database**  
   Make sure you have PostgreSQL installed. Create a new database using `psql` or your preferred database GUI.

2. **Install Dependencies**  
   Navigate into both the `backend` and `frontend` folders and install the necessary libraries:
   ```bash
   cd backend
   npm install

   cd ../frontend
   npm install
3. **Run the application**
      ```bash
   cd backend
   npm start

   cd ../frontend
   npm start
4. **Connect to adafruit**
   Create a `.env`  in the `backend/config` and `ESP_MQTT_SERVER`directory and add the following environment variables:
   ```env
   ADA_USERNAME=your_adafruit_username
   ADAFRUIT_IO_KEY=your_adafruit_io_key

   Navigate to the ESP_MQTT_SERVER directory and start the server:
   ''bash 
  cd ESP_MQTT_SERVER
  npm start
   
