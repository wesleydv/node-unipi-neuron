"use strict";

let EventEmitter = require("events").EventEmitter;
let Board        = require("./Board");
let RtuConnection = require("./RtuConnection");
let TcpConnection = require("./TcpConnection");

class BoardManager extends EventEmitter {

    constructor (config) {
        super();
        this.boards = {};

        for (let i = 0; i < config.length; i++) {
            this.init(config[i]);
        }
    }

    init(config) {
        let self = this;
        let name = 'local';
        let id = 0;
        let connection = {};

        if (config.name) {
            name = config.name;
        }
        if (config.id) {
            id = config.id;
        }

        switch (config.type) {
            case 'tcp':
                connection = new TcpConnection(config.ip, config.port);
                break;

            default:
                connection = new RtuConnection(config.socket);
        }

        let board = new Board(connection, id, config.groups);

        board.on('update', function (id, value) {
            self.emit('update', name + '-' + id, value);
        });

        setInterval(function() {
            board.update();
        }, config.interval);

        this.boards[name] = board;
    }

    set (id, value) {
        let arr = id.split('-');
        let name = 'local';

        if (arr.length === 2) {
            name = arr[0];
            id = arr[1];
        }

        this.boards[name].set(id, value);
    }

    getAll () {
        let data = {};
        for (let name in this.boards) {
            if (this.boards.hasOwnProperty(name)) {
                for (let id in this.boards[name].data) {
                    if (this.boards[name].data.hasOwnProperty(id)) {
                        data[name + '-' + id] = this.boards[name].data[id];
                    }
                }
            }
        }
        return data;
    }

}

module.exports = BoardManager;