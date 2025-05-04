class SensorModel {
    constructor(sensorData) {
      this.id = sensorData.id || null;
      this.type = sensorData.type || '';
      this.value = sensorData.value || 0;
      this.unit = sensorData.unit || '';
      this.timestamp = sensorData.timestamp || new Date().toISOString();
    }
    
    getFormattedValue() {
      switch (this.type) {
        case 'temperature':
          return `${this.value}°C`;
        case 'humidity':
          return `${this.value}%`;
        case 'motion':
          return this.value ? 'Detected' : 'None';
        default:
          return `${this.value}${this.unit}`;
      }
    }
    
    getIcon() {
      switch (this.type) {
        case 'temperature':
          return 'fas fa-thermometer-half';
        case 'humidity':
          return 'fas fa-tint';
        case 'motion':
          return 'fas fa-running';
        default:
          return 'fas fa-chart-line';
      }
    }
    
    isAboveThreshold(threshold) {
      return this.value > threshold;
    }
    
    isBelowThreshold(threshold) {
      return this.value < threshold;
    }
  }
  
  export default SensorModel;