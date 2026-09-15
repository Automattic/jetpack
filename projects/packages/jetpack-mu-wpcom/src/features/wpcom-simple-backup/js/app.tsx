import JetpackFooter from '@automattic/jetpack-components/jetpack-footer';
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { ActivateScreen, IneligibleScreen, InProgressScreen, UpgradeScreen } from './screens.tsx';
import { getInitialState } from './state.ts';
import './style.scss';

const PRODUCT_NAME = 'VaultPress Backup'; // Product name; do not translate.

/**
 * The Backup page for WordPress.com Simple sites.
 *
 * Simple sites share a multisite install and cannot be backed up, so this shows
 * the same upgrade or activate prompt Calypso renders at /backup/$site.
 *
 * @return The rendered page.
 */
export function App() {
	const initialState = getInitialState();

	return (
		<Page
			className="wpcom-simple-backup jp-admin-page"
			visual={ <JetpackLogo showText={ false } height={ 20 } /> }
			title={ PRODUCT_NAME }
			ariaLabel={ PRODUCT_NAME }
			subTitle={ __(
				'Save changes and restore quickly with one-click recovery.',
				'jetpack-mu-wpcom'
			) }
			hasPadding={ false }
		>
			<div className="wpcom-simple-backup__body">
				{ initialState.state === 'in_progress' && <InProgressScreen /> }
				{ initialState.state === 'activate' && <ActivateScreen state={ initialState } /> }
				{ initialState.state === 'ineligible' && <IneligibleScreen state={ initialState } /> }
				{ initialState.state === 'upgrade' && <UpgradeScreen state={ initialState } /> }
			</div>
			<JetpackFooter />
		</Page>
	);
}
