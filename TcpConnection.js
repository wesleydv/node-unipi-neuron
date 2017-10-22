"use strict";

let ModbusRTU = require("modbus-serial");

class TcpConnection extends ModbusRTU {

    constructor (ip, port) {
        super();
        this.ip = ip;
        this.port = port;
    }

    connect (callback) {
        this.connectTCP(this.ip, { port: this.port }).then(function () {
            callback();
        });
    }
}

module.exports = TcpConnection;
