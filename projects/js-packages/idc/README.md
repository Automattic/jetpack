IDC Package
=========

The Identity Crisis UI.

An identity crisis (IDC) happens when the URL of a site no longer matches the URL registered with WordPress.com — typically after cloning a site to a new domain or setting up a staging copy. This package provides the React components Jetpack plugins render in that state, letting the user either move their Jetpack connection and stats to the new URL, treat the site as a brand-new one and start fresh, or stay in Safe Mode.

## Usage

Install the package:

```bash
pnpm add @automattic/jetpack-idc
```

Render the `IDCScreen` component:

```jsx
import { IDCScreen } from '@automattic/jetpack-idc';

<IDCScreen
	wpcomHomeUrl="site-original.example.org"
	currentUrl="site-cloned.example.org"
	apiRoot="https://example.org/wp-json/"
	apiNonce="12345"
	redirectUri="admin.php?page=my-plugin"
	isAdmin={ true }
/>;
```

### Properties

- *wpcomHomeUrl* - string (required), the original site URL registered with WordPress.com.
- *currentUrl* - string (required), the current site URL.
- *apiRoot* - string (required), API root URL.
- *apiNonce* - string (required), API nonce.
- *redirectUri* - string (required), wp-admin URI to redirect users back to after connecting.
- *isAdmin* - bool (required), whether to display the "admin" or "non-admin" version of the screen.
- *logo* - the screen logo, defaults to the Jetpack logo.
- *customContent* - object, custom text content to override the defaults.
- *tracksUserData* - object, WordPress.com user's Tracks identity.
- *tracksEventData* - object, WordPress.com event tracking information.
- *possibleDynamicSiteUrlDetected* - bool, whether potentially dynamic `HTTP_HOST` usage was detected for site URLs in `wp-config.php`.
- *isDevelopmentSite* - bool, whether the site is in development mode.

## Development

From the monorepo root:

```bash
jetpack install js-packages/idc   # Install dependencies
```

## Contribute

We welcome contributions from the community. Please submit your pull requests on the GitHub repository.

## Get Help

If you encounter any issues or have any questions, please open an issue on the GitHub repository.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

The IDC package is licensed under the GNU General Public License v2 (or later).
