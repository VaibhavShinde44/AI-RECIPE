import db from '../db/index.js';
import bcrypt from 'bcrypt';

class User {
  static async createUser(username, email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );
    return result.rows[0];
    }   

    

    static async findByEmail(email) {
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await db.query(
            'SELECT id, username, email FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async updateUser(id, username, email) {
        const result = await db.query(
            'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email',
            [username, email, id]
        );
        return result.rows[0];
    }

    static async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedPassword, id]
        );
    }

    /**verify password */
    static async verifyPassword(email, password) {
        const user = await this.findByEmail(email);
        if (!user) {
            return false;
        }
        const isMatch = await bcrypt.compare(password, user.password);
        return isMatch ? user : false;
    }

    static async deleteUser(id) {
        await db.query(
            'DELETE FROM users WHERE id = $1',
            [id]
        );
    }
}
export default User;