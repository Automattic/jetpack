import { Button, Text } from '@automattic/jetpack-components';
import AdminPage from '@automattic/jetpack-components/admin-page';
import { __, sprintf } from '@wordpress/i18n';
import './style.scss';
import type { FC } from 'react';

export type Props = {
	/** The product name, e.g. "VideoPress", "Search". Not translated -- it's a product name. */
	productName: string;
	/** Optional subtitle shown under the product name in the page header. */
	subTitle?: string;
};

/**
 * Fallback shown by a product's dashboard, in place of its normal connect screen,
 * when the site is in local development mode. A normal "Connect" button would attempt
 * a real WordPress.com connection and fail (WordPress.com can never reach a localhost
 * or private URL to complete one), so this instead sends the user to the Jetpack
 * dashboard's local development page, which explains what still works locally and how
 * to get connection-dependent features working (e.g. via a WordPress Studio Preview Site).
 *
 * Wrapped in `AdminPage` so the page keeps the same header/footer chrome the
 * product's normal connect screen would have shown.
 *
 * A relative link is used deliberately -- every consumer of this component is
 * itself rendered from a `wp-admin/admin.php` page, so `admin.php?page=jetpack`
 * always resolves correctly regardless of the site's install path, without each
 * product having to plumb its own copy of the site's admin URL through.
 *
 * @param props             - Component props.
 * @param props.productName - The product name to show in the heading.
 * @param props.subTitle    - Optional subtitle shown under the product name.
 * @return The offline mode screen element.
 */
const OfflineModeScreen: FC< Props > = ( { productName, subTitle } ) => (
	<AdminPage title={ productName } subTitle={ subTitle }>
		<div className="jp-connection__offline-mode-screen">
			<Text variant="title-medium" mb={ 2 }>
				{ sprintf(
					/* translators: %s: a product name, such as "VideoPress" or "Search". */
					__( '%s needs a connection to WordPress.com', 'jetpack-connection-js' ),
					productName
				) }
			</Text>
			<Text mb={ 3 }>
				{ __(
					"This site is in local development mode, so we can't reach it right now. The Jetpack dashboard explains what still works locally, and how to get this feature working.",
					'jetpack-connection-js'
				) }
			</Text>
			<Button variant="primary" href="admin.php?page=jetpack#/dashboard">
				{ __( 'Go to the local development dashboard', 'jetpack-connection-js' ) }
			</Button>
		</div>
	</AdminPage>
);

export default OfflineModeScreen;
