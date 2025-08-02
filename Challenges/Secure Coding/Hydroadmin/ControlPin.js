/**
 * PATCHED FILE models/ControlPin.js
 *
 * Vulnerability: Insecure PIN Generation
 *
 * The original code used `Math.random()` to generate the 4-digit security PIN.
 * `Math.random()` is a pseudo-random number generator that is not
 * cryptographically secure. An attacker who could predict the output of this
 * function would be able to determine the correct PIN with minimal effort,
 * bypassing the security check entirely.
 *
 * Fix:
 *
 * The `Math.random()` function has been replaced with `crypto.randomInt()`.
 * The `crypto` module provides cryptographically strong random data
 * generation, making the PIN unpredictable and secure against prediction attacks.
 */
import crypto from 'crypto';

export class ControlPin {
  static async getAll(db) {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, system_id, description FROM control_pins ORDER BY system_id', (err, pins) => {
        if (err) reject(err);
        else resolve(pins.map(pin => ({
          id: pin.id,
          systemId: pin.system_id,
          description: pin.description
        })));
      });
    });
  }

  static async generateNewPin(db) {
    const pin = crypto.randomInt(1000, 10000).toString();
    const currentTime = new Date();
    const expirationTime = new Date(currentTime.getTime() + 3 * 60 * 1000); // 3 minutes from now
    
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM control_pins', [], (err) => {
        if (err) {
          resolve({ success: false, message: 'Failed to reset old PIN.' });
        } else {
          db.run('INSERT INTO control_pins (pin_code, expires_at) VALUES (?, ?)', [pin, expirationTime.toISOString()], (err2) => {
            if (err2) {
              resolve({ success: false, message: 'Failed to generate new PIN.' });
            } else {
              resolve({ success: true, message: 'PIN generated successfully.' });
            }
          });
        }
      });
    });
  }

  static async verifyPin(db, pin) {
    return new Promise((resolve, reject) => {
      db.get('SELECT pin_code, expires_at FROM control_pins LIMIT 1', (err, row) => {
        if (err) {
          resolve({
            success: false,
            message: 'Database error',
            systemId: null,
            authorized: false
          });
        } else if (!row) {
          resolve({
            success: true,
            message: 'No PIN found',
            systemId: null,
            authorized: false
          });
        } else {
          const currentTime = new Date();
          const expirationTime = new Date(row.expires_at);
          
          // Check if PIN is expired
          if (currentTime > expirationTime) {
            resolve({
              success: true,
              message: 'expired',
              systemId: null,
              authorized: false
            });
          } else if (pin === row.pin_code) {
            resolve({
              success: true,
              message: 'Access granted',
              systemId: null,
              authorized: true
            });
          } else {
            resolve({
              success: true,
              message: 'Invalid PIN',
              systemId: null,
              authorized: false
            });
          }
        }
      });
    });
  }
}