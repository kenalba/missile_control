// Main utils export file - provides clean imports for utility functions

export * from './math';
export * from './collision';

// Re-export commonly used functions with shorter names for convenience
export { 
  distance as dist,
  clamp,
  lerp,
  randomBetween as random,
  randomIntBetween as randomInt
} from './math';

export {
  isWithinRadius as withinRadius,
  checkCollisions
} from './collision';