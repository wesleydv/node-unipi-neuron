"use strict";

let EventEmitter = require('events').EventEmitter;

class Board extends EventEmitter {

    constructor (client, id, groups) {
        super();
        this.client = client;
        this.data = {};
        this.groups = [];

        let self = this;

        // Read board possibilities
        this.client.connect(function () {
            self.client.setID(id);

            for (let i = 0; i < groups; i++) {
                let start = 1001 + (i * 100);
                self.client.readHoldingRegisters(start, 1, function(err, data) {
                    let bin = self.dec2bin(data.data[0]);
                    self.groups[i] = {
                        'id': (i + 1),
                        'di': (parseInt(bin.slice(0, 8), 2)),
                        'do': (parseInt(bin.slice(8, 16), 2)),
                    };
                });
            }
        });
    }

    validate (id) {
        if (this.get(id) === undefined) {
            throw new SyntaxError('Unknown ID: ' +  id);
        }
    }

    get (id) {
        return this.data[id];
    }

    set (id, value, retries = 0) {
        this.validate(id);
        let self = this;

        let arr = id.split('.');
        let group = arr[0].substr(arr[0].length - 1, 1);
        let num = arr[1];
        let coilId = (group - 1) * 100 + (num - 1);

        this.client.writeCoil(coilId, value);

        if (retries < 10) {
            setTimeout(function() {
                if (Boolean(self.get(id)) !== value) {
                    retries++;
                    console.log('Retry (' + retries + ')');
                    self.set(id, value, retries);
                }
            }, (100 * (retries + 1)));
        }
    }

    dec2bin (dec) {
        // Convert decimal string to binary.
        let bin = parseInt(dec, 10).toString(2);
        // Pad to a 16bit binary number.
        return ('0000000000000000' + bin.toString()).slice(-16);
    }

    store (prefix, value, length = 16) {
        let bin = this.dec2bin(value);

        // Convert to an array and reverse the values (first bit -> first value)
        let arr = bin.split('').reverse();

        for (let i = 0; i < length; i++) {
            let id = prefix + '.' + (i + 1);
            let value = parseInt(arr[i]);
            let currentValue = this.get(id);
            if (currentValue !== value) {
                if (currentValue !== undefined) {
                    this.emit('update', id, value.toString());
                }
                this.data[id] = value;
            }
        }
    }

    update () {
        let self = this;

        for (let i = 0; i < this.groups.length; i++) {
            let group = this.groups[i];
            let start = (group.id - 1) * 100;
            this.client.readHoldingRegisters(start, 2, function(err, data) {
                if (err) {
                    console.log(err);
                }
                else {
                    self.store('DI' + group.id, data.data[0], group.di);
                    self.store('DO' + group.id, data.data[1], group.do);
                }
            });
        }
    }

}

module.exports = Board;
