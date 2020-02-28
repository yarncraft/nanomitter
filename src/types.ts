export type DistributedEvent = { topic: string; data: any; }
export type EventListener = (msg: DistributedEvent) => void