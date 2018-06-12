/**
 * Creates a pseudo-random value generator. The seed must be an integer.
 *
 * Uses an optimized version of the Park-Miller PRNG.
 * http://www.firstpr.com.au/dsp/rand31/
 */

const SEED = 4353245
var _seed = SEED % 2147483647
if (_seed <= 0){
  _seed += 2147483646
}

/**
 * Returns a pseudo-random value between 1 and 2^32 - 2.
 */
const next = () => _seed = _seed * 16807 % 2147483647

/**
 * Returns a pseudo-random floating point number in range [0, 1).
 */
const nextFloat = () => (next() - 1) / 2147483646

/**
 * The maximum is exclusive and the minimum is inclusive  
 */
module.exports.intBetween = (min, max) => {
  return Math.floor(nextFloat() * (max - min)) + min
}