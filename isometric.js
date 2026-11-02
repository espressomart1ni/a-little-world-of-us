// Custom 2:1 isometric projection. Everything in the room lives in "grid space"
// (gx, gy in tiles). gridToScreen converts that to pixels on the canvas.
export const GAME_W = 336;
export const GAME_H = 224;
export const HW = 16;          // half tile width  (tile = 32 x 16 px)
export const HH = 8;           // half tile height
export const ROOM_SIZE = 8;    // room is 8 x 8 tiles
export const WALL_H = 56;
export const ORIGIN = { x: 168, y: 72 }; // screen position of the room's back corner (gx=0, gy=0)

export const gridToScreen = (gx, gy) => ({ x: ORIGIN.x + (gx - gy) * HW, y: ORIGIN.y + (gx + gy) * HH });

// Screen-style input (right = +x, down = +y) -> grid direction, so "W" walks up the screen.
export const screenDirToGrid = (sx, sy) => ({ x: sx + sy, y: sy - sx });
