class DeviceModel {
    constructor(deviceData) {
      this.id = deviceData.id || null;
      this.name = deviceData.name || '';
      this.type = deviceData.type || '';
      this.location = deviceData.location || '';
      this.status = deviceData.status || 'inactive';
      this.lastUpdated = deviceData.lastUpdated || new Date().toISOString();
    }
    
    isActive() {
      return this.status === 'active';
    }
    
    getStatusText() {
      return this.isActive() ? 'ON' : 'OFF';
    }
    
    getIcon() {
      switch (this.type) {
        case 'light':
          return 'fas fa-lightbulb';
        case 'fan':
          return 'fas fa-fan';
        case 'lock':
          return 'fas fa-lock';
        default:
          return 'fas fa-plug';
      }
    }
    
    toggle() {
      this.status = this.isActive() ? 'inactive' : 'active';
      this.lastUpdated = new Date().toISOString();
      return this;
    }
  }
  
  export default DeviceModel;