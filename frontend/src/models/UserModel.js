class UserModel {
    constructor(userData) {
      this.id = userData.id || null;
      this.username = userData.username || '';
      this.email = userData.email || '';
      this.firstName = userData.firstName || '';
      this.lastName = userData.lastName || '';
      this.role = userData.role || 'user';
    }
    
    getFullName() {
      if (this.firstName && this.lastName) {
        return `${this.firstName} ${this.lastName}`;
      } else if (this.firstName) {
        return this.firstName;
      } else if (this.lastName) {
        return this.lastName;
      } else {
        return this.username;
      }
    }
    
    isAdmin() {
      return this.role === 'admin';
    }
  }
  
  export default UserModel;