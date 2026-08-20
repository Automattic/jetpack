/**
 * Test group. jest gives every test file its own module registry, so each
 * widget suite re-evaluates the same dependency graph from scratch; loading
 * several suites through one file pays that cost once instead of once each.
 *
 * Members must declare an identical set of module mocks -- a mock registered
 * by one member applies to the whole group. tests/js/test-groups.test.ts
 * enforces this; read widgets/__groups__/README.md before adding a member.
 */

import '../latest-post/__tests__/use-latest-post.test';
import '../popular-post/__tests__/use-popular-post.test';
import '../post-detail-highlights/__tests__/use-post-highlights.test';
import '../post-traffic-activity/__tests__/use-post-traffic-activity.test';
import '../traffic-chart/__tests__/use-traffic-chart.test';
import '../wordads-chart-tabs/__tests__/wordads-chart-tabs.test';
