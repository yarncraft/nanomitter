type AnyJson = boolean | number | string | null | JsonArray | JsonMap;
export interface JsonMap { [key: string]: AnyJson; }
export interface JsonArray extends Array<AnyJson> { }

export type DistributedEvent = { topic?: string; data?: JsonMap; sender?: string; }
export type EventListener = (msg: DistributedEvent) => void