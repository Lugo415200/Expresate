const { test } = require('node:test');
const assert = require('node:assert/strict');
const { shuffled } = require('../apps/mobile/src/lessonInteraction');

test('answer shuffle reaches every permutation equally without mutating the source', () => {
  const original = ['A', 'B', 'C'];
  const permutations = new Set();
  const positions = [0, 0, 0];
  for (let first = 0; first < 3; first++) {
    for (let second = 0; second < 2; second++) {
      const random = [(first + 0.5) / 3, (second + 0.5) / 2];
      const result = shuffled(original, () => random.shift());
      permutations.add(result.join(''));
      positions[result.indexOf('A')]++;
      assert.deepEqual([...result].sort(), original);
    }
  }
  assert.equal(permutations.size, 6);
  assert.deepEqual(positions, [2, 2, 2]);
  assert.deepEqual(original, ['A', 'B', 'C']);
});
