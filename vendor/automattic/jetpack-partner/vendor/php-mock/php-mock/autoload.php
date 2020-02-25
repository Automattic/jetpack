<?php

use PHPUnit\Runner\Version;

// Compatibility with PHPUnit 8.0
// We need to use "magic" trait \phpmock\TestCaseTrait
// and instead of setUp/tearDown method in test case
// we should have setUpCompat/tearDownCompat.
if (class_exists(Version::class)
    && version_compare(Version::id(), '8.0.0') >= 0
) {
    class_alias(\phpmock\TestCaseTypeHintTrait::class, \phpmock\TestCaseTrait::class);
} else {
    class_alias(\phpmock\TestCaseNoTypeHintTrait::class, \phpmock\TestCaseTrait::class);
}
