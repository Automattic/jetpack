# Jetpack Shared Stores

Shared [`@wordpress/data`](https://developer.wordpress.org/block-editor/reference-guides/data/) stores used by the Jetpack block editor extensions.

This package exists to solve a single, specific problem: **duplicate store registration**. Each of the stores below registers itself at module scope. When the store code is bundled into more than one script that loads on the same page (for example the Jetpack plugin editor bundle and another plugin's editor bundle), each bundle runs the registration and WordPress logs `Store "…" is already registered`.

By keeping these stores in a dedicated package that is externalized into a single UMD bundle (script handle `jetpack-shared-stores`), every consumer references the same runtime copy and registration happens exactly once.

## Stores

- **`jetpack-modules`** — Jetpack module activation state. Backed by the `/jetpack/v4/module/*` REST endpoints.
- **`wordpress-com/plans`** — WordPress.com plans and AI Assistant feature data.

## Usage

Import the package root for its side effect to ensure both stores are registered, then access them by id via `@wordpress/data`:

```js
import '@automattic/jetpack-shared-stores';
import { select, useDispatch } from '@wordpress/data';

const modules = select( 'jetpack-modules' ).getJetpackModules();
```

The store ids (`jetpack-modules`, `wordpress-com/plans`) are part of the public contract and must not change.

## Contribute

We welcome contributions! See the [contributing guide](https://github.com/Automattic/jetpack/blob/trunk/projects/js-packages/jetpack-shared-stores/CONTRIBUTING.md) and the [Jetpack monorepo](https://github.com/Automattic/jetpack) for details.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

This package is licensed under [GPL v2 or later](https://www.gnu.org/licenses/gpl-2.0.html).
