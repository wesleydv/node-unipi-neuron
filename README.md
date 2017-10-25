# Neuron

Integrates the UniPi Neuron product line.

Neuron integrates the [Unipi](https://www.unipi.technology) Neuron product line in Node.js over Modbus
It uses [Modbus Serial](https://github.com/yaacov/node-modbus-serial) to
connect to the [TCP Modbus server](https://github.com/UniPiTechnology/neuron_tcp_modbus_overlay)
It can be seen as a lightweight alternative to [EVOK](https://github.com/UniPiTechnology/evok).

### Install

Install the TCP Modbus server as described on their [README.md](https://github.com/UniPiTechnology/neuron_tcp_modbus_overlay)

You can install this package via npm directly in a folder on the Raspberry Pi in your
Neuron device or install it on an other computer and connect to it remotely.

    npm install neuron

### Compatibility

Neuron can run on all types of Neuron devices (e.g. S103, L203 ...)
and connected to any number of extension modules (e.g. xS10, xS40 ...)

**The current implementation is limited to digital inputs and digital outputs/relays.**  
However I'm looking to support the following:
- Digital inputs
- Digital outputs
- ULEDs
- 1-Wire sensors (1-Wire sensors are not available on the Modbus server so this will require the most extra work.)

### Config

An array of config objects should be send to the BoardManager.  
Each object should contain these properties:
- name: 'local' (Defaults to local, but should be something different if there is more than one board)
- type: 'tcp' or 'rtu'
- ip: '127.0.0.1' (if type is tcp)
- port: '502' (if type is tcp)
- socket: '/dev/extcomm/0/0' (if type is socket)
- id: 15 (if type is socket)
- groups: 3 (Normally 1 for S type and extension boards, 2 for M type boards and 3 for L type boards)
- interval: 100 (The interval in milliseconds at which to update the board values)

### Example

###### Connect to a local Neuron (S type) 
``` javascript
let BoardManager = require('neuron');

let config = [{
  name: 'local',
  type: 'tcp',
  ip: '127.0.0.1',
  port: 502,
  groups: 1,
  interval: 100
}];

let boardManager = new BoardManager(config);

boardManager.on('update', function (id, value) {
  console.log(id + ' changed to ' + value);
});

setTimeout(function() {
  console.log(boardManager.getAll());
}, 1000);

setTimeout(function() {
  let id = 'local-DO1.1';
  let value = boardManager.get(id);
  console.log(value);
  boardManager.set(id, !value);
}, 2000);
