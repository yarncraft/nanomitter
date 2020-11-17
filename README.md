<div align="center">
<h1> Nanomitter </h1>

_An example Typescript implementation of a distributed EventEmitter built with the Scalability Protocols._

<img src="https://250bpm.wdfiles.com/local--files/blog:17/bus2.png" width="250">
</div>

The EventEmitter is fully distributed through the use of NanoMSG TCP sockets (Network Layer).
It is designed with performance and flexibility in mind and can be used to unite multiple Node.js processes running on different machines in the same network.
In order to realize this in the cloud, one could opt for an Overlay Network like the one provided by Kubernetes.

The implementation is realized with the _NanoMsg framework_ (also called: Scalability Protocols).
I was inspired by the creator of the framework itself, who described how to realize an efficient broadcasting setup through the use of a **bus socket**: [http://250bpm.com/blog:17](http://250bpm.com/blog:17)

## Quickstart

<a href="https://badge.fury.io/js/nanomitter"><img src="https://badge.fury.io/js/nanomitter.svg" alt="npm version" height="18"></a>

```sh
npm i nanomitter
```

_master.ts_

```ts
import { DistributedEventEmitter, DistributedEvent } from "nanomitter";

(async () => {
	const serviceName = "master";
	const heartbeatInterval = 30000;
	const emitter = await new DistributedEventEmitter(
		serviceName,
		heartbeatInterval
	).connect();
	const logger = ({ topic, data }: DistributedEvent) =>
		console.log(`Broadcasted ${topic} ${JSON.stringify(data)}`);
	emitter.on("*", logger);
})().catch((err) => {
	console.error(err);
});
```

_worker.ts_

```ts
import { DistributedEventEmitter, DistributedEvent } from "nanomitter";

(async () => {
	const emitter = await new DistributedEventEmitter("worker").connect();
	const logger = (msg: DistributedEvent) => console.log(msg);

	emitter.on("stockprice", logger);

	setInterval(
		() =>
			emitter.emit({
				topic: "stockprice",
				data: { ticker: "AAPL", price: 250 + Math.random() * 10 },
			}),
		300
	);
})().catch((err) => {
	console.error(err);
});
```

## API

- **DistributedEventEmitter(serviceName, heartbeatInterval)**

  > The constructor of the EventEmitter that takes an optional service and heartbeatInterval. The emitter will send a heartbeat on topic `<3` with data `{ service: serviceName }` at the given interval (default = 1 minute).

- **async connect(addr)**
  > In order to realise a distributed setup, a developer first has to connect the EventEmitter to a given address (default: 'tcp://127.0.0.1:55555'). _The first Emitter that connects to a given address binds the port and acts as the master, meaning that he is responsible for the broadcasting._ The master itself can send and receive messages just like its clients.

_The remaining API methods are very similar to the conventional EventEmitter methods:_

- **addListener(topic, eventlistener)**

> Adds a listener at the end of the listeners array for the specified topic. No checks are made to see if the listener has already been added. Multiple calls passing the same combination of event and listener will result in the listener being added multiple times. Returns emitter, so calls can be chained.

- **on(topic, eventlistener)**

> Adds a listener at the end of the listeners array for the specified topic. No checks are made to see if the listener has already been added. Multiple calls passing the same combination of event and listener will result in the listener being added multiple times. Returns emitter, so calls can be chained.

- **once(topic, eventlistener)**

> Adds a one time listener to the topic. This listener is invoked only the next time the event is fired, after which it is removed. Returns emitter, so calls can be chained.

- **removeListener(topic, eventlistener)**

> Removes a listener from the listener array for the specified topic. Caution − RemoveListener will remove, at most, one instance of a listener from the listener array. If any single listener has been added multiple times to the listener array for the specified topic, then removeListener must be called multiple times to remove each instance. Returns emitter, so calls can be chained.

- **removeAllListeners(topic?)**

> Removes all listeners, or those of the specified topic. It's not a good idea to remove listeners that were added elsewhere in the code, especially when it's on an emitter that you didn't create (e.g. sockets or file streams). Returns emitter, so calls can be chained.

## Types

_The DistributedEvent type is still under consideration and can be subject to change._

```typescript
export type DistributedEvent = { topic: string; data: any };
export type EventListener = (msg: DistributedEvent) => void;
```
