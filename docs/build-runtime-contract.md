# Build and Runtime Contract for Premium Analytics

This document defines the required build and runtime behavior for
`projects/packages/premium-analytics`.

## Current Runtime Model

The package depends on a runtime chain like this:

1. PHP entry initializes package
2. generated `build/build.php` registers the boot and interceptor behavior
3. `@wordpress/boot` provides the full-page shell
4. routes are discovered and lazy-loaded from metadata

Agents must preserve this model unless there is explicit architectural approval.

## Build Script Requirements

The package build scripts MUST preserve the post-build shim copy step that places
the boot asset shim at:

`build/modules/boot/index.min.asset.php`

This is part of the package's build behavior and must not be silently removed.

## Shim Rule

`shims/boot-asset.php` is a compatibility workaround.

Agents MUST NOT remove it unless all of the following are confirmed:

- the generated template no longer depends on that asset file
- target WordPress and runtime support make the workaround unnecessary
- the package has been validated without blank-page regressions

## Init Module Rule

`packages/init/` exists for runtime reasons, not just organization.

Agents MUST treat it as part of the boot contract until proven otherwise.

It currently serves to:

- configure boot-time UI state such as menu icon behavior
- ensure build and runtime dependency tracking includes boot-related modules

Agents MUST NOT remove or bypass the init module without validating that
boot dependencies are still correctly tracked and loaded.

## Dependency Upgrade Rule

Human review is required before changing any of these package dependencies:

- `@wordpress/build`
- `@wordpress/boot`
- `@wordpress/route`

Reason:
small version shifts may change template behavior, module resolution, or boot expectations.

## Generated Output Rule

Agents MUST NOT edit:

- `build/**`

All build artifacts must be regenerated from source.

## Definition of Done for Build-Sensitive Changes

A build-sensitive change is complete only if:

- package build succeeds
- generated app still opens in `wp-admin`
- the page does not render blank
- route navigation still works
- no shim-dependent regression is introduced
