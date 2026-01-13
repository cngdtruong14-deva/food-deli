/**
 * Socket.io Manager
 * 
 * Centralized module to hold and manage the Socket.io instance.
 * This breaks the circular dependency: server.js -> routes -> controllers -> server.js
 * 
 * Usage:
 *   - In server.js: import { initSocket, getIO } from './utils/socket.js'
 *   - In controllers: import { getIO } from '../utils/socket.js'
 */

import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.io with the HTTP server.
 * @param {http.Server} httpServer - The HTTP server instance.
 * @param {Object} corsOptions - CORS configuration for Socket.io.
 * @returns {Server} The initialized Socket.io instance.
 */
export const initSocket = (httpServer, corsOptions = {}) => {
  if (io) {
    console.warn('[Socket.io] Already initialized. Returning existing instance.');
    return io;
  }
  
  io = new Server(httpServer, corsOptions);
  console.log('[Socket.io] Initialized successfully.');
  return io;
};

/**
 * Get the Socket.io instance.
 * Must be called AFTER initSocket has been called in server.js.
 * @returns {Server} The Socket.io instance.
 * @throws {Error} If Socket.io has not been initialized.
 */
export const getIO = () => {
  if (!io) {
    throw new Error('[Socket.io] Not initialized! Call initSocket(httpServer) first in server.js.');
  }
  return io;
};
