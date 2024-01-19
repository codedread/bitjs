/*
 * parsers.js
 *
 * Common functionality for all image parsers.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2024 Google Inc.
 */

/**
 * Creates a new event of the given type with the specified data.
 * @template T
 * @param {string} type The event type.
 * @param {T} data The event data.
 * @returns {CustomEvent<T>} The new event.
 */
export function createEvent(type, data) {
  return new CustomEvent(type, { detail: data });
}
