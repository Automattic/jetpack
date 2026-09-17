import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { useInterstitialsState } from '../../../hooks/use-interstitials-state';
import { ModuleToggle } from '../../module-toggle';
import { ActivationToggle, getProductActivation } from '../products/product-card-action';
import type { FeatureState } from './feature-state';

type FeatureToggleProps = {
	state: FeatureState;
};

/**
 * The card's on/off switch, or nothing when the feature cannot be switched from here.
 *
 * Both halves are the controls the rest of My Jetpack already uses — the Products tab's
 * activation toggle and the Modules screen's module toggle — so a feature switches the
 * same way here as it does there, down to which products offer a toggle at all. The
 * Active badge is suppressed because the card carries its own.
 *
 * @param {FeatureToggleProps} props       - The component props.
 * @param {FeatureState}       props.state - Live state for the feature.
 * @return The rendered component.
 */
export function FeatureToggle( { state }: FeatureToggleProps ) {
	const { data: interstitials } = useInterstitialsState();
	const { showAiModuleToggle = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );

	if ( state.product ) {
		const activation = getProductActivation(
			state.product,
			state.module,
			!! interstitials?.[ state.product.slug ],
			showAiModuleToggle
		);

		return activation ? (
			<ActivationToggle product={ state.product } { ...activation } showBadge={ false } />
		) : null;
	}

	return state.module ? <ModuleToggle module={ state.module } /> : null;
}
