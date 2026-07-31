# Jetpack AI Sidebar E2E

The suite in `specs/ai-sidebar/abilities.test.ts` verifies the Jetpack AI Sidebar on the
connected self-hosted WordPress environment created by Jetpack's E2E framework.

The global Playwright setup:

1. Authenticates the Docker site's WordPress administrator.
2. Authenticates the shared WordPress.com E2E account from the encrypted configuration.
3. Provisions the Jetpack site and user connection.
4. Runs the sidebar tests with the resulting storage state.

The suite enables the preview only in the disposable E2E environment. It does not test
WordPress.com Atomic, Big Sky block edits, or Big Sky checkpoints.
The preview shim intentionally opts the connected self-hosted site into internal-testing
feature gates; rollout eligibility itself is outside this suite's scope.

## Coverage

The same ability contracts run in the post and page editors:

- Translate to Spanish.
- Change tone to Formal.
- Simplify text.
- Optimize title.
- Generate excerpt, when the post type supports excerpts.
- Generate SEO title.
- Generate SEO description.
- Generate alt text for a selected image.
- Generate SEO alt text for all images.
- Simple review.
- Proofread.
- Editorial review.

The suite also verifies that an explicit selected-block grammar request calls
`wpcom__update_block_content` without calling the Big Sky rewrite, apply, or restore tools.

Each live test saves and refreshes a new draft, opens Agents Manager, starts a fresh chat,
runs the suggestion or prompt, and verifies the streamed tool call and editor mutation.
The provider source and SHA-256, sanitized stream metadata, tool names and argument-key
names, console error count, and final editor state are attached to the Playwright result.
Request URLs, request payloads, response bodies, and console messages are deliberately
excluded from public CI artifacts.

CI runs the post and page scenarios as separate jobs. The lane is informational while its
shared external-service quota is provisioned independently from developer accounts.
Jetpack's Playwright configuration runs one Chromium worker by default; do not increase
`PLAYWRIGHT_WORKERS` for this suite because its tests share one Docker site.

## Run locally

Follow the main E2E README to build Jetpack, decrypt the configuration, start the Docker
environment, and start its tunnel. Then run:

```shell
pnpm test:run specs/ai-sidebar
```

Use Playwright UI mode while developing:

```shell
pnpm test:run specs/ai-sidebar --ui
```

The default run loads the provider deployed at `widgets.wp.com`. To test a locally built
provider bundle, set `JETPACK_AI_E2E_PROVIDER_BUNDLE` to the absolute path of
`jetpack-ai-sidebar.min.js`:

```shell
JETPACK_AI_E2E_PROVIDER_BUNDLE=/absolute/path/to/jetpack-ai-sidebar.min.js \
pnpm test:run specs/ai-sidebar
```

The browser fulfills only the provider bundle request from that file. Agents Manager,
authentication, the Jetpack connection, and AI requests still use the configured E2E
environment.

To verify that the loaded provider URL contains an expected branch or build marker, set
`JETPACK_AI_E2E_BUNDLE_MATCH`:

```shell
JETPACK_AI_E2E_BUNDLE_MATCH=my-branch-marker pnpm test:run specs/ai-sidebar
```

The match is checked in memory and is not included in the Playwright attachments.
