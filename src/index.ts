import msgpack from "msgpack-lite";
import nanoid from "nanoid";
import nano from "nanomsg";

import { DistributedEvent, EventListener } from './types'

type InternalDistributedEvent = { topic: string; data: any; sender: string; fromLeader: boolean, bus: number }

const delay = (ms: number) => new Promise(_ => setTimeout(_, ms));

export class DistributedEventEmitter {
	id: string;
	bus: nano.Socket;
	leader: boolean;
	partitions: Array<nano.Socket>;
	partitionsAmount: number;
	listeners: Map<string, { cont: Array<EventListener>, once: Array<EventListener> }>;
	addr: string;

	constructor() {
		this.id = nanoid();
		this.partitions = [];
		this.partitionsAmount = 0
		this.leader = false;
		this.listeners = new Map();
	}

	addBus() {
		let newAddr = `tcp://127.0.0.1:55556`
		let newBus = nano.socket("bus");
		newBus.bind(newAddr)
		this.partitionsAmount = this.partitions.push(newBus)

		delay(300).then(_ => {
			this.leader = true;
			this._startBroadcast();
			const msg: InternalDistributedEvent = { topic: "DEE-BusAdded", data: { addr: newAddr }, sender: this.id, fromLeader: true, bus: 0 }
			var buffer = msgpack.encode(msg);
			this.bus.send(buffer)
		})
	}

	async connect(addr: string = 'tcp://127.0.0.1:55555') {
		this.addr = addr
		this.bus = nano.socket("bus");
		try {
			this.bus.bind(addr)
			this.partitionsAmount = this.partitions.push(this.bus)
			await delay(300)
			this.leader = true;
			this._startBroadcast();
		} catch (error) {
			this.bus.connect(addr)
			this.partitionsAmount = this.partitions.push(this.bus)
			await delay(300)
		}
		this._startListening();
		return this
	}

	private _startBroadcast() {
		this.bus.on("data", (buffer: Buffer) => {
			const msg: InternalDistributedEvent = msgpack.decode(buffer);
			if (msg.fromLeader === false) this.bus.send(buffer)
		}
		);
	}

	private _startListening() {
		this.bus.on("data", async (buffer: Buffer) => {
			const { topic, data, sender }: InternalDistributedEvent = msgpack.decode(buffer);
			if (sender === this.id) return;
			else if (topic === "DEE-BusAdded" && this.leader === false) { await this.connect(data.addr) }
			else {
				if (topic !== "*" && this.listeners.has(topic)) {
					this._getContListeners(topic).map((f: EventListener) => f({ topic, data }));
					this._getOnceListeners(topic).map((f: EventListener) => f({ topic, data }));
					this._removeAllOnceListeners(topic);
				}
				if (this.listeners.has("*")) {
					this.listeners.get("*").cont.map((f: EventListener) => f({ topic, data }));
					this.listeners.get("*").once.map((f: EventListener) => f({ topic, data }));
					this._removeAllOnceListeners("*");
				}
			}
		});
	}

	private _addContListener(topic: string, f: EventListener) {
		if (!this.listeners.has(topic))
			this.listeners.set(topic, { cont: [f], once: [] });
		else {
			this.listeners.set(topic, {
				cont: this._getContListeners(topic).concat(f),
				once: this._getOnceListeners(topic)
			});
		}
	}

	private _addOnceListener(topic: string, f: EventListener) {
		if (!this.listeners.has(topic))
			this.listeners.set(topic, { cont: [], once: [f] });
		else {
			this.listeners.set(topic, {
				cont: this._getContListeners(topic),
				once: this._getOnceListeners(topic).concat(f)
			});
		}
	}

	private _getOnceListeners(topic: string) {
		return this.listeners.get(topic).once;
	}

	private _getContListeners(topic: string) {
		return this.listeners.get(topic).cont;
	}

	private _removeAllOnceListeners(topic: string) {
		if (this.listeners.has(topic)) {
			this.listeners.set(topic, {
				cont: this._getContListeners(topic),
				once: []
			});
		}
	}

	emit(msg: DistributedEvent) {
		let randomBusIdx = Math.floor(Math.random() * this.partitionsAmount)
		let bus = this.partitions[randomBusIdx]

		let internalMsg: InternalDistributedEvent = { ...msg, fromLeader: this.leader, sender: this.id, bus: randomBusIdx }
		var buffer = msgpack.encode(internalMsg);
		bus.send(buffer)
	}

	addListener(topic: string, f: EventListener) {
		this._addContListener(topic, f);
		return this;
	}

	once(topic: string, f: EventListener) {
		this._addOnceListener(topic, f);
		return this;
	}

	on(topic: string, f: EventListener) {
		this.addListener(topic, f);
		return this;
	}

	off(topic: string, f: EventListener) {
		this.removeListener(topic, f);
		return this;
	}

	/* WARNING: don't use anonymous functions as listener, always bind them to a const first:
	 * https://www.broken-links.com/2013/05/22/removing-event-listeners-with-anonymous-functions/
	 */
	removeListener(topic: string, f: EventListener) {
		if (this.listeners.has(topic)) {
			let contListeners = this._getContListeners(topic);
			let onceListeners = this._getOnceListeners(topic);
			if (contListeners.indexOf(f) !== -1) {
				contListeners.splice(contListeners.indexOf(f), 1);
				this.listeners.set(topic, { cont: contListeners, once: onceListeners });
			} else if (onceListeners.indexOf(f) !== -1) {
				onceListeners.splice(onceListeners.indexOf(f), 1);
				this.listeners.set(topic, {
					cont: contListeners,
					once: onceListeners
				});
			}
		}
		return this;
	}

	removeAllListeners(topic?: string) {
		if (topic === undefined) {
			this.listeners = new Map();
		} else this.listeners.set(topic, { cont: [], once: [] });
		return this;
	}
}
