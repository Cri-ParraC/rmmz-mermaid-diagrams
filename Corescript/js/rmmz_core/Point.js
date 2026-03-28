//=============================================================================
// rmmz_core.js v1.10.0
//=============================================================================

//-----------------------------------------------------------------------------
/**
 * The point class.
 *
 * @class
 * @extends PIXI.Point
 * @param {number} x - The x coordinate.
 * @param {number} y - The y coordinate.
 */
function Point() {
    this.initialize(...arguments);
}

Point.prototype = Object.create(PIXI.Point.prototype);
Point.prototype.constructor = Point;

Point.prototype.initialize = function(x, y) {
    PIXI.Point.call(this, x, y);
};
