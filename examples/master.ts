import { DistributedEventEmitter } from "../src/index";
import { DistributedEvent } from '../src/types';

(async () => {
  const emitter = await new DistributedEventEmitter().connect();
  const logger = ({ topic, data }: DistributedEvent) => console.log(`Broadcasted ${topic} ${JSON.stringify(data)}`);
  emitter.on("*", logger);
})().catch(err => {
  console.error(err);
});
