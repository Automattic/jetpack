import JetpackFooter from '@automattic/jetpack-components/jetpack-footer';
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { ActivateScreen, InProgressScreen, UpgradeScreen } from './screens.tsx';
import { getInitialState } from './state.ts';
import './style.scss';

const PRODUCT_NAME = 'VaultPress Backup'; // Product name; do not translate.

/**
 * The Backup page for WordPress.com Simple and WoA sites.
 *
 * Shown while backups are out of reach: a Simple site shares a multisite install
 * and cannot be backed up, and a WoA site may not have bought them yet.
 *
 * @return The rendered page.
 */
export function App() {
	const initialState = getInitialState();

	return (
		<Page
			className="wpcom-backup jp-admin-page"
			visual={ <JetpackLogo showText={ false } height={ 20 } /> }
			title={ PRODUCT_NAME }
			ariaLabel={ PRODUCT_NAME }
			subTitle={ __(
				'Save changes and restore quickly with one-click recovery.',
				'jetpack-mu-wpcom'
			) }
			hasPadding={ false }
		>
			<div className="wpcom-backup__body">
				{ initialState.state === 'in_progress' && <InProgressScreen /> }
				{ initialState.state === 'activate' && <ActivateScreen state={ initialState } /> }
				{ initialState.state === 'upgrade' && <UpgradeScreen state={ initialState } /> }
			</div>
			<JetpackFooter />
		</Page>
	);
}
