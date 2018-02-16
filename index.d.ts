import { IModbusRTU } from "modbus-serial";
import { EventEmitter } from "events";

declare namespace UnipiNeuron {
    interface IRtuConnection extends IModbusRTU {
        new(socket?: any): IModbusRTU;
        connect(callback: Function): void;
    }
    interface ITcpConnection extends IModbusRTU {
        new(ip?: any, port?: any): IModbusRTU;
        connect(callback: Function): void;
    }
    interface IBoard extends EventEmitter {
        new(client: IModbusRTU, id: string, groups: number): IBoard;
        validate(id: string): void;
        getState(id: string): string | number | boolean;
        getCount(id: string): number;
        set(id: string, value: string | number | boolean, retries?: number): void;
        dec2bin(dec: number | string): string;
        storeState(prefix: string, value: string | number | boolean, length?: number): void;
        updateState(): void;
        updateCount(): void;
        state: { [id: string]: string | number | boolean };
        counter: { [id: string]: number };
    }
    interface IBoardManager extends EventEmitter {
        new(config: any): IBoardManager;
        init(config: any): void;
        id(id: string): { board: string, id: string };
        set(id: string, value: string | number | boolean): void;
        getState(id: string): string | number | boolean;
        getCount(id: string): number;
        getAllStates(): { [id: string]: string | number | boolean };
        getAllCounts(): { [id: string]: number };
        boards: { [id: string]: IBoard };
    }
}
declare var UnipiNeuron: UnipiNeuron.IBoardManager;
export = UnipiNeuron;
