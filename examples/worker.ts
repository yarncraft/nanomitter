import { DistributedEventEmitter } from "../src/index";
import { DistributedEvent } from '../src/types';

(async () => {
	const emitter = await new DistributedEventEmitter().connect();
	const logger = (msg: DistributedEvent) => console.log(msg);

	emitter.on("stockprice", logger);

	setInterval(
		() =>
			emitter.emit({
				topic: "stockprice",
				data: { ticker: "AAPL", price: 250 + Math.random() * 10 }
			}),
		300
	);

})().catch(err => {
	console.error(err);
});



