## Jetpack.PHPUnit.FunctionCoversBackslash

PHPUnit does not recognize function-`@covers` or `#[CoversFunction()]` with a leading backslash.

PHPUnit 12 raises a warning if one is encountered.

### Messages

* `CoversFunctionAnnotationBackslashFound`: Function name for `@covers` must not include a leading backslash.
* `CoversFunctionAttributeBackslashFound`: Function name for `PHPUnit\Framework\Attributes\CoversFunction` must not include a leading backslash.
* `UsesFunctionAnnotationBackslashFound`: Function name for `@uses` must not include a leading backslash.
* `UsesFunctionAttributeBackslashFound`: Function name for `PHPUnit\Framework\Attributes\UsesFunction` must not include a leading backslash.

### Configuration

This sniff has no configuration options.
