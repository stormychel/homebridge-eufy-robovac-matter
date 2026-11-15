"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogRing = void 0;
class LogRing {
    capacity;
    buffer = [];
    /**
     * @param capacity Maximum entries retained. Older entries fall off the front
     *   when the ring is full. Default 50 covers the most common "what happened
     *   in the last few minutes" question without unbounded memory growth.
     */
    constructor(capacity = 50) {
        this.capacity = capacity;
        if (capacity <= 0)
            throw new Error('LogRing capacity must be positive');
    }
    push(level, msg) {
        // Squash multiline messages — the UI renders one line per entry.
        const safe = msg.replace(/\s+/g, ' ').trim();
        this.buffer.push({ ts: Date.now(), level, msg: safe });
        if (this.buffer.length > this.capacity) {
            this.buffer.splice(0, this.buffer.length - this.capacity);
        }
    }
    /** Returns a stable snapshot — callers may serialise it to JSON without
     *  worrying about race conditions with subsequent push() calls. */
    snapshot() {
        return this.buffer.map((e) => ({ ...e }));
    }
    /** Returns the current entry count (≤ capacity). */
    get size() {
        return this.buffer.length;
    }
    /** Empties the ring. Used by tests for isolation. */
    clear() {
        this.buffer.length = 0;
    }
}
exports.LogRing = LogRing;
