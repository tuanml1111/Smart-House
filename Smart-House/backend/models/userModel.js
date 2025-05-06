const db = require('../config/db');
const bcrypt = require('bcryptjs');

class UserModel {
  static async createUser(userData) {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Insert user into database
      const query = `
        INSERT INTO users (username, user_password, email)
        VALUES ($1, $2, $3)
        RETURNING user_id, username, email
      `;
      
      const values = [
        userData.username,
        hashedPassword,
        userData.email
      ];
      
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }
  
  static async getUserById(id) {
    try {
      const query = 'SELECT user_id, username, email FROM users WHERE user_id = $1';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error getting user by ID: ${error.message}`);
    }
  }
  
  static async getUserByUsername(username) {
    try {
      const query = 'SELECT user_id, username, email, user_password FROM users WHERE username = $1';
      const result = await db.query(query, [username]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error getting user by username: ${error.message}`);
    }
  }
  
  static async updateUser(id, userData) {
    try {
      // Check if password is being updated
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }
      
      // Build the SET clause dynamically
      const setClause = Object.keys(userData)
        .map((key, index) => {
          // Map the JS property names to DB column names
          const columnMapping = {
            username: 'username',
            password: 'user_password',
            email: 'email'
          };
          
          return `${columnMapping[key]} = $${index + 1}`;
        })
        .join(', ');
      
      // Build the query
      const query = `
        UPDATE users
        SET ${setClause}
        WHERE user_id = $${Object.keys(userData).length + 1}
        RETURNING user_id, username, email
      `;
      
      // Build the values array
      const values = [...Object.values(userData), id];
      
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }
  
  static async deleteUser(id) {
    try {
      const query = 'DELETE FROM users WHERE user_id = $1 RETURNING user_id';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return false;
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }
}

module.exports = UserModel;