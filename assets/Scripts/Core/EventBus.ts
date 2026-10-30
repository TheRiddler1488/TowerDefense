export enum EventType {
    GAME_START = 0,
    GAME_PAUSE = 1,
    GAME_RESUME = 2,
    TOWER_BUILT = 3,
    TOWER_MERGED = 4,
    PLAY_SFX = 5
}

export enum SFXType {
    COIN = 0,
    BUILD = 1,
    MERGE = 2,
    SHOOT_NORMAL = 3,
    SHOOT_ICE = 4,
    SHOOT_FIRE = 5,
    HIT_NORMAL = 6,
    HIT_ICE = 7,
    HIT_FIRE = 8
}

type EventHandler = (...args: any[]) => void;

export class EventBus {
    private static events: Map<EventType, EventHandler[]> = new Map();

    public static on(event: EventType, handler: EventHandler, target: any) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)!.push(handler.bind(target));
    }

    public static emit(event: EventType, ...args: any[]) {
        const handlers = this.events.get(event);
        if (handlers) {
            for (let i = 0; i < handlers.length; i++) {
                handlers[i](...args);
            }
        }
    }
}
