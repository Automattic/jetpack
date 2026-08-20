/**
 * Test group. jest gives every test file its own module registry, so each
 * widget suite re-evaluates the same dependency graph from scratch; loading
 * several suites through one file pays that cost once instead of once each.
 *
 * Members must declare an identical set of module mocks -- a mock registered
 * by one member applies to the whole group. tests/js/test-groups.test.ts
 * enforces this; read widgets/__groups__/README.md before adding a member.
 */

import '../clicks/__tests__/clicks.test';
import '../email-top-row/__tests__/email-top-row.test';
import '../emails/__tests__/emails.test';
import '../file-downloads/__tests__/file-downloads.test';
import '../most-commented-authors/__tests__/most-commented-authors.test';
import '../most-commented-posts/__tests__/most-commented-posts.test';
import '../plan-usage/__tests__/plan-usage.test';
import '../post-comments/__tests__/post-comments.test';
import '../post-likes/__tests__/post-likes.test';
import '../referrers/__tests__/referrers.test';
