/**
 * Bounded, process-local memory cache implementing Time-To-Live (TTL) expiration.
 * Note: Cache is process-local and will be lost on application restart.
 */
class TtlCache {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key, value, ttlSeconds = 3600) {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  clear() {
    this.cache.clear();
  }
}

module.exports = new TtlCache();
