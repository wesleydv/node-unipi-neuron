"use strict";

let EventEmitter = require('events').EventEmitter;

/**
 * Represents a single board.
 */
class Board extends EventEmitter {

    /**
     * Create a single board.
     *
     * @param client
     *   A TCP or RTU connection object.
     * @param id
     *   The board id to connect to.
     * @param groups
     *   The number of groups.
     */
    constructor (client, id, groups) {
        super();
        this.client = client;
        this.state = {};
        this.counter = {};
        this.groups = [];

        let self = this;

        // Connect to the board.
        this.client.connect(function () {
            self.client.setID(id);

            // Read board possibilities
            for (let i = 0; i < groups; i++) {
                // We can read the input and output capabilities of group one on register 1001, for group two on 1101
                // and so on.
                let start = 1001 + (i * 100);
                self.client.readHoldingRegisters(start, 1, function(err, data) {
                    let bin = self.dec2bin(data.data[0]);
                    // First eight bits are for the input number, second eight bits are for the output number.
                    self.groups[i] = {
                        'id': (i + 1),
                        'di': (parseInt(bin.slice(0, 8), 2)),
                        'do': (parseInt(bin.slice(8, 16), 2)),
                    };
                });
            }
        });
    }

    /**
     * Validate that the given id is known to this board.
     *
     * @param id
     *   e.g. local-DO1.1
     */
    validate (id) {
        if (this.get(id) === undefined) {
            throw new SyntaxError('Unknown ID: ' +  id);
        }
    }

    /**
     * Get the value of the given io id.
     *
     * @param id
     *   e.g. DO1.1
     */
    getState (id) {
        return this.state[id];
    }

    /**
     * Get the value of the given DI id.
     *
     * @param id
     *   e.g. DI1.1
     */
    getCount (id) {
        return this.counter[id];
    }

    /**
     * Set an io to the given value
     *
     * @param id
     *   e.g. local-DO1.1
     * @param {boolean} value
     * @param {int} retries
     *   Used internally to check how many retries have been tried.
     */
    set (id, value, retries = 0) {
        this.validate(id);
        let self = this;

        let arr = id.split('.');
        let group = arr[0].substr(arr[0].length - 1, 1);
        let num = arr[1];
        let coilId = (group - 1) * 100 + (num - 1);

        // Actual write to the board.
        this.client.writeCoil(coilId, value);

        // Writing can sometimes fail, especially on boards connected over a (bad) UART connection. Validating the write
        // and retrying the write after a small delay mitigates the problem.
        if (retries < 5) {
            setTimeout(function() {
                if (Boolean(self.get(id)) !== value) {
                    retries++;
                    console.log('Retry (' + retries + ')');
                    self.set(id, value, retries);
                }
            }, (100 * (retries + 1)));
        }
    }

    /**
     * Convert the given decimal value to a 16bit binary string.
     *
     * @param dec
     * @returns {string}
     */
    dec2bin (dec) {
        // Convert decimal string to binary.
        let bin = parseInt(dec, 10).toString(2);
        // Pad to a 16bit binary number.
        return ('0000000000000000' + bin.toString()).slice(-16);
    }

    /**
     * Convert and store the given group array data in the data variable.
     *
     * @param prefix
     *   The io prefix (e.g. DO, DI ...)
     * @param value
     *   The value array from readHoldingRegisters
     * @param length
     *   The length of the io group, defaults to 16.
     */
    storeState (prefix, value, length = 16) {
        let bin = this.dec2bin(value);

        // Convert to an array and reverse the values (first bit -> first value)
        let arr = bin.split('').reverse();

        for (let i = 0; i < length; i++) {
            let id = prefix + '.' + (i + 1);
            let value = parseInt(arr[i]);
            let currentValue = this.getState(id);
            if (currentValue !== value) {
                if (currentValue !== undefined) {
                    this.emit('update', id, value.toString());
                }
                this.state[id] = value;
            }
        }
    }

    /**
     * Update the board io states by reading the holding registers.
     */
    updateState () {
        let self = this;

        for (let i = 0; i < this.groups.length; i++) {
            let group = this.groups[i];
            let start = (group.id - 1) * 100;
            // Read DI and DO states
            this.client.readHoldingRegisters(start, 2, function (err, data) {
                if (err) {
                    console.log(err);
                }
                else {
                    self.storeState('DI' + group.id, data.data[0], group.di);
                    self.storeState('DO' + group.id, data.data[1], group.do);
                }
            });
        }
    }

    /**
     * Update the board io states by reading the holding registers.
     */
    updateCount () {
        let self = this;
        // Look for a better way of determining these.
        let countStart = [8, 103, 203];

        for (let i = 0; i < this.groups.length; i++) {
            let group = this.groups[i];
            // Read DI counters
            this.client.readHoldingRegisters(countStart[i], (group.di * 2), function(err, data) {
                for (let j = 0; j < group.di; j++) {
                    let id = 'DI' + group.id + '.' + (j + 1);
                    // Counters are stored over two words.
                    self.counter[id] = data.data[j * 2] + data.data[j * 2 + 1];
                }
            });
        }
    }

}

module.exports = Board;
