// Mathematical utility functions with TypeScript typing

import type { Position, Velocity } from '@/types/gameTypes';

// Clamp a value between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Linear interpolation between two values
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

// Calculate distance between two points
export function distance(p1: Position, p2: Position): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// Calculate squared distance (faster when you don't need exact distance)
export function distanceSquared(p1: Position, p2: Position): number {
  return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
}

// Calculate angle between two points in radians
export function angleBetween(from: Position, to: Position): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

// Convert radians to degrees
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

// Convert degrees to radians
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Normalize angle to be between 0 and 2π
export function normalizeAngle(angle: number): number {
  while (angle < 0) angle += 2 * Math.PI;
  while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
  return angle;
}

// Calculate velocity components from angle and speed
export function velocityFromAngle(angle: number, speed: number): Velocity {
  return {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed
  };
}

// Calculate magnitude of a velocity vector
export function velocityMagnitude(velocity: Velocity): number {
  return Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
}

// Normalize a velocity vector to unit length
export function normalizeVelocity(velocity: Velocity): Velocity {
  const magnitude = velocityMagnitude(velocity);
  if (magnitude === 0) return { x: 0, y: 0 };
  
  return {
    x: velocity.x / magnitude,
    y: velocity.y / magnitude
  };
}

// Scale a velocity vector by a factor
export function scaleVelocity(velocity: Velocity, scale: number): Velocity {
  return {
    x: velocity.x * scale,
    y: velocity.y * scale
  };
}

// Add two velocity vectors
export function addVelocity(v1: Velocity, v2: Velocity): Velocity {
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y
  };
}

// Random number between min and max (inclusive)
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Random integer between min and max (inclusive)
export function randomIntBetween(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

// Check if a number is approximately equal to another (within epsilon)
export function approximately(a: number, b: number, epsilon: number = 0.001): boolean {
  return Math.abs(a - b) < epsilon;
}

// Smooth step function (useful for animations)
export function smoothStep(t: number): number {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

// Ease in/out cubic function
export function easeInOutCubic(t: number): number {
  t = clamp(t, 0, 1);
  return t < 0.5 ? 4 * t ** 3 : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Check if point is inside a rectangle
export function pointInRect(
  point: Position, 
  rectPos: Position, 
  rectWidth: number, 
  rectHeight: number
): boolean {
  return point.x >= rectPos.x && 
         point.x <= rectPos.x + rectWidth &&
         point.y >= rectPos.y && 
         point.y <= rectPos.y + rectHeight;
}

// Check if point is inside a circle
export function pointInCircle(point: Position, center: Position, radius: number): boolean {
  return distance(point, center) <= radius;
}

// Calculate trajectory point for projectile motion (useful for missile arcs)
export function trajectoryPoint(
  start: Position,
  velocity: Velocity,
  gravity: number,
  time: number
): Position {
  return {
    x: start.x + velocity.x * time,
    y: start.y + velocity.y * time + 0.5 * gravity * time ** 2
  };
}

// Calculate the time needed for a projectile to reach a target height
export function timeToReachHeight(
  startY: number,
  velocityY: number,
  targetY: number,
  gravity: number
): number[] {
  // Solve quadratic equation: startY + velocityY*t + 0.5*gravity*t^2 = targetY
  const a = 0.5 * gravity;
  const b = velocityY;
  const c = startY - targetY;
  
  const discriminant = b ** 2 - 4 * a * c;
  
  if (discriminant < 0) return []; // No solution
  
  const sqrtDiscriminant = Math.sqrt(discriminant);
  const t1 = (-b + sqrtDiscriminant) / (2 * a);
  const t2 = (-b - sqrtDiscriminant) / (2 * a);
  
  return [t1, t2].filter(t => t >= 0);
}

// Map a value from one range to another
export function mapRange(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number {
  const normalizedValue = (value - fromMin) / (fromMax - fromMin);
  return toMin + normalizedValue * (toMax - toMin);
}