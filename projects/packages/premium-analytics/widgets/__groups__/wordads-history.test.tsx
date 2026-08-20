/**
 * Test group. jest gives every test file its own module registry, so each
 * widget suite re-evaluates the same dependency graph from scratch; loading
 * several suites through one file pays that cost once instead of once each.
 *
 * Members must declare an identical set of module mocks -- a mock registered
 * by one member applies to the whole group. tests/js/test-groups.test.ts
 * enforces this; read widgets/__groups__/README.md before adding a member.
 */

import '../wordads-adjustments-history/__tests__/wordads-adjustments-history.test';
import '../wordads-earnings-history/__tests__/wordads-earnings-history.test';
import '../wordads-sponsored-content-history/__tests__/wordads-sponsored-content-history.test';
