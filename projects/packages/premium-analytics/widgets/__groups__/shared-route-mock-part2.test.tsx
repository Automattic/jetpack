/**
 * Test group. jest gives every test file its own module registry, so each
 * widget suite re-evaluates the same dependency graph from scratch; loading
 * several suites through one file pays that cost once instead of once each.
 *
 * Members must declare an identical set of module mocks -- a mock registered
 * by one member applies to the whole group. tests/js/test-groups.test.ts
 * enforces this; read widgets/__groups__/README.md before adding a member.
 */

import '../site-overview/__tests__/site-overview.test';
import '../subscriber-highlights/__tests__/subscriber-highlights.test';
import '../video-detail-embeds/__tests__/video-detail-embeds.test';
import '../video-detail-highlights/__tests__/video-detail-highlights.test';
import '../videopress/__tests__/videopress.test';
import '../wordads-highlights/__tests__/wordads-highlights.test';
