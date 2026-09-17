import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { useInterstitialsState } from '../../../hooks/use-interstitials-state';
import ActionButton from '../../action-button';
import { ModuleToggle } from '../../module-toggle';
import { ActivationToggle, getProductActivation } from '../products/product-card-action';
import { hasNothingLocalToSwitch } from './feature-state';
import type { FeatureState } from './feature-state';

type FeatureActionProps = {
	state: FeatureState;
};

/**
 * The control that switches a feature on, or moves it towards being switchable.
 *
 * Every part of this is a control the rest of My Jetpack already uses — the Products
 * tab's activation toggle, the Modules screen's module toggle, and the action button the
 * product cards and interstitials share — so a feature behaves the same way here as it
 * does there, down to which products offer a toggle at all. A product that cannot simply
 * be switched falls back to that button, which says what it needs next ("Install
 * Plugin", "Activate", "Upgrade") rather than leaving the feature with no action.
 *
 * @param {FeatureActionProps} props       - The component props.
 * @param {FeatureState}       props.state - Live state for the feature.
 * @return The rendered component, or null when nothing here can switch the feature.
 */
export function FeatureAction( { state }: FeatureActionProps ) {
	const { data: interstitials } = useInterstitialsState();
	const { showAiModuleToggle = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );

	const activation = state.product
		? getProductActivation(
				state.product,
				state.module,
				!! interstitials?.[ state.product.slug ],
				showAiModuleToggle
			)
		: null;

	// Every feature backed by a module gets a switch, whatever its product needs: the
	// module is the part of it this site can turn on and off, and what `feature-state`
	// reports, so the switch and the badge always agree.
	if ( state.module?.available ) {
		return <ModuleToggle module={ state.module } />;
	}

	// Reaching here means no module can be switched, so the product is the whole feature
	// and nothing about a missing module should hold its switch shut.
	if ( state.product && activation && ! hasNothingLocalToSwitch( state ) ) {
		return (
			<ActivationToggle
				product={ state.product }
				{ ...activation }
				disabled={ false }
				showBadge={ false }
			/>
		);
	}

	// A separate plugin, so there is nothing here to switch until it is installed. One
	// compact, quiet button: a grid of solid primary buttons drowns out the switches.
	return state.product ? (
		<ActionButton slug={ state.product.slug as JetpackModule } variant="secondary" />
	) : null;
}
