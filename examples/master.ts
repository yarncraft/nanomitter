import { DistributedEventEmitter } from "../src/index";
import { DistributedEvent } from '../src/types';

(async () => {
  const emitter = await new DistributedEventEmitter().connect();
  const logger = (msg: DistributedEvent) => console.log("Broadcasted message from: " + msg.sender);
  emitter.on("*", logger);
})().catch(err => {
  console.error(err);
});
