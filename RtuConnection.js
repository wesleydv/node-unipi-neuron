"use strict";

let ModbusRTU = require("modbus-serial");

class RtuConnection extends ModbusRTU {

    constructor (socket) {
        super();
        this.socket = socket;

    }

    connect (callback) {
        this.connectRTUBuffered(this.socket, { baudRate: 19200 }).then(function () {
            callback();
        });
    }
}

module.exports = RtuConnection;
