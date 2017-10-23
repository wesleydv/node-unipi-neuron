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

    id (id) {
        let result = {};
        let arr = id.split('-');
        result.board = arr[0];
        result.id = arr[1];
        return result;
    }

    set (id, value) {
        id = this.id(id);
        this.boards[id.board].set(id.id, value);
    }

    get (id) {
        id = this.id(id);
        return this.boards[id.board].get(id.id);
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