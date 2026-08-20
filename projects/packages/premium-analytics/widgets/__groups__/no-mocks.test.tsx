/**
 * Test group. jest gives every test file its own module registry, so each
 * widget suite re-evaluates the same dependency graph from scratch; loading
 * several suites through one file pays that cost once instead of once each.
 *
 * Members must declare an identical set of module mocks -- a mock registered
 * by one member applies to the whole group. tests/js/test-groups.test.ts
 * enforces this; read widgets/__groups__/README.md before adding a member.
 */

import '../authors/__tests__/build-top-authors-data.test';
import '../popular-days/__tests__/bucket-views-by-weekday.test';
import '../shares/__tests__/use-share-views.test';
import '../videopress/__tests__/build-video-plays-data.test';
