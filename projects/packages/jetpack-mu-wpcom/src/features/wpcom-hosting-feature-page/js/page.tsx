import AdminPage from '@automattic/jetpack-components/admin-page';
import { FeatureContext } from './feature-context.ts';
import {
	ActivateScreen,
	CheckoutPendingScreen,
	EnableScreen,
	InProgressScreen,
	UpgradeScreen,
} from './screens.tsx';
import { getInitialState } from './state.ts';
import type { BaseFeatureConfig, FeatureConfig } from './types.ts';
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
export function HostingFeaturePage( { config }: { config: BaseFeatureConfig | FeatureConfig } ) {
	const initialState = getInitialState();
	// The other screens read the plan prompts' copy, which a feature without a plan has none of.
	const isPlanFeature = 'upgrade' in config;

	return (
		<FeatureContext.Provider value={ config }>
			<AdminPage
				className="wpcom-hosting-feature"
				title={ config.productName }
				subTitle={ config.subTitle }
				unwrapped
			>
				<div className="wpcom-hosting-feature__body">
					<div className="wpcom-hosting-feature__stage">
						{ isPlanFeature && initialState.state === 'in_progress' && (
							<InProgressScreen state={ initialState } />
						) }
						{ isPlanFeature && initialState.state === 'activate' && (
							<ActivateScreen state={ initialState } />
						) }
						{ isPlanFeature &&
							initialState.state === 'upgrade' &&
							( initialState.checkoutPending ? (
								<CheckoutPendingScreen state={ initialState } />
							) : (
								<UpgradeScreen state={ initialState } />
							) ) }
						{ initialState.state === 'enable' && <EnableScreen state={ initialState } /> }
					</div>
				</div>
			</AdminPage>
		</FeatureContext.Provider>
	);
}
