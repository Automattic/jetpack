## Jetpack.FeatureFlags.FeatureFlagName

This sniff validates the literal flag name passed to `Feature_Flags::register()` from the [`automattic/jetpack-feature-flags`](../../feature-flags/) package.

Flag names must match `/^[a-z0-9][a-z0-9_-]*$/`. The package enforces this at lint time rather than at runtime, so this sniff catches invalid names without adding any runtime cost. Only plain string literals can be checked; dynamic names (variables, concatenation, function calls) are skipped, so normalize any dynamic or user-supplied input before registering.

### Messages

* `Invalid`: Feature flag name "%s" is invalid. Names must match `/^[a-z0-9][a-z0-9_-]*$/`.

### Configuration

This sniff has no configuration options.
