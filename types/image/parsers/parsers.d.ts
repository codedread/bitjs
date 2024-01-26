/**
 * Creates a new event of the given type with the specified data.
 * @template T
 * @param {string} type The event type.
 * @param {T} data The event data.
 * @returns {CustomEvent<T>} The new event.
 */
export function createEvent<T>(type: string, data: T): CustomEvent<T>;
//# sourceMappingURL=parsers.d.ts.map