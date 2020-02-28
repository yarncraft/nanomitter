<div align="center">
<h1> DistributedEventEmitter </h1>

_An example Typescript implementation of a distributed EventEmitter built with the Scalability Protocols._

<img src="https://250bpm.wdfiles.com/local--files/blog:17/bus2.png" width="250">
</div>

The EventEmitter is fully distributed through the use of NanoMsg Sockets on the TCP transport (Network Layer).
It is designed with performance and flexibility in mind and can be used to unite multiple Node.js processes running on different machines in the same network.
In order to realize this in the cloud, one could opt for a Docker Overlay Network.

The implementation is realized with the _NanoMsg framework_ (also called: Scalability Protocols).
I was inspired by the creator of the framework itself, who described how to realize an efficient broadcasting setup through the use of a **bus socket**: [http://250bpm.com/blog:17](http://250bpm.com/blog:17)

## API

_The API method naming is very similar to the conventional EventEmitter methods:_

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
