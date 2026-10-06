import JetpackFooter from '@automattic/jetpack-components/jetpack-footer';
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { Page } from '@wordpress/admin-ui';
import { FeatureContext } from './feature-context.ts';
import { ActivateScreen, InProgressScreen, UpgradeScreen } from './screens.tsx';
import { getInitialState } from './state.ts';
import type { FeatureConfig } from './types.ts';
import './style.scss';

/**
 * A hosting feature page for WordPress.com Simple and WoA sites.
 *
 * Shown while the feature is out of reach: a Simple site has to move to our
 * hosting platform to run it, and a WoA site may not have bought it yet.
 *
 * @param props        - Component props.
 * @param props.config - The feature's copy, imagery and Tracks IDs.
 * @return The rendered page.
 */
export function HostingFeaturePage( { config }: { config: FeatureConfig } ) {
	const initialState = getInitialState();

	return (
		<FeatureContext.Provider value={ config }>
			<Page
				className="wpcom-hosting-feature jp-admin-page"
				visual={ <JetpackLogo showText={ false } height={ 20 } /> }
				title={ config.productName }
				ariaLabel={ config.productName }
				subTitle={ config.subTitle }
				hasPadding={ false }
			>
				<div className="wpcom-hosting-feature__body">
					{ initialState.state === 'in_progress' && <InProgressScreen /> }
					{ initialState.state === 'activate' && <ActivateScreen state={ initialState } /> }
					{ initialState.state === 'upgrade' && <UpgradeScreen state={ initialState } /> }
				</div>
				<JetpackFooter />
			</Page>
		</FeatureContext.Provider>
	);
}
