/**
 * Test group. jest gives every test file its own module registry, so each
 * widget suite re-evaluates the same dependency graph from scratch; loading
 * several suites through one file pays that cost once instead of once each.
 *
 * Members must declare an identical set of module mocks -- a mock registered
 * by one member applies to the whole group. tests/js/test-groups.test.ts
 * enforces this; read widgets/__groups__/README.md before adding a member.
 */

import '../post-views/__tests__/post-views.test';
import '../video-detail-views-performance/__tests__/video-detail-views-performance.test';
