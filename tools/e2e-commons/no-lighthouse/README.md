## Wat?

Gutenberg's `@wordpress/e2e-test-utils-playwright` has a lot of helpful stuff for E2E tests.

On the other hand, it also brings in `lighthouse` for performance measurements, which brings in ~140 sub-dependencies that aren't used by anything else and that seem prone to having CVEs.

To simplify the monorepo E2Es, where we don't enable any of that performance measurement, we use this stub package to satisfy the `import`s of the unused dependency.
