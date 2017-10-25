"use strict";

let ModbusRTU = require("modbus-serial");

/**
 * A RTU connection.
 */
class RtuConnection extends ModbusRTU {

    /**
     * Constructor
     *
     * @param {string} socket
     */
    constructor (socket) {
        super();
        this.socket = socket;
    }

    /**
     * Connect to the socket.
     *
     * @param callback
     */
    connect (callback) {
        this.connectRTUBuffered(this.socket, { baudRate: 19200 }).then(function () {
            callback();
        });
    }
}

module.exports = RtuConnection;
