import { __, sprintf } from '@wordpress/i18n';
import { Button, LinkButton } from '@wordpress/ui';
import { useCallback } from 'react';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { useInterstitialsState } from '../../../hooks/use-interstitials-state';
import ActionButton from '../../action-button';
import { useModuleActivation } from '../../module-toggle';
import { getProductActivation, useProductActivation } from '../products/product-card-action';
import { hasNothingLocalToSwitch } from './feature-state';
import { useStandaloneSwitch } from './use-standalone-switch';
import type { FeatureState } from './feature-state';
import type { ProductCamelCase } from '../../../data/types';
import type { MyJetpackModule } from '../../../types';
import type { ProductActivation } from '../products/product-card-action';

type SwitchButtonProps = {
	isOn: boolean;
	name: string;
	disabled: boolean;
	onClick: () => void;
};

/**
 * The modal's Activate/Deactivate button, whichever mechanism switches the feature.
 *
 * @param {SwitchButtonProps} props          - The component props.
 * @param {boolean}           props.isOn     - Whether the feature is on.
 * @param {string}            props.name     - The feature's name, for the label.
 * @param {boolean}           props.disabled - Whether a switch is in flight.
 * @param {Function}          props.onClick  - Flips the feature.
 * @return The rendered component.
 */
function SwitchButton( { isOn, name, disabled, onClick }: SwitchButtonProps ) {
	// Bound before the branch: minification folds `c ? __( a ) : __( b )` into one call
	// with a ternary msgid, which the i18n build check rejects.
	const deactivateText = __( 'Deactivate', 'jetpack-my-jetpack' );
	const activateText = __( 'Activate', 'jetpack-my-jetpack' );
	const deactivateLabel = sprintf(
		/* translators: %s is the feature name. */
		__( 'Deactivate %s', 'jetpack-my-jetpack' ),
		name
	);
	const activateLabel = sprintf(
		/* translators: %s is the feature name. */
		__( 'Activate %s', 'jetpack-my-jetpack' ),
		name
	);

	return (
		<Button
			variant={ isOn ? 'outline' : 'solid' }
			size="compact"
			disabled={ disabled }
			onClick={ onClick }
			aria-label={ isOn ? deactivateLabel : activateLabel }
		>
			{ isOn ? deactivateText : activateText }
		</Button>
	);
}

type ProductSwitchProps = {
	product: ProductCamelCase;
	activation: ProductActivation;
	name: string;
};

/**
 * Switch a product-backed feature, as a button rather than the card's toggle.
 *
 * @param {ProductSwitchProps} props            - The component props.
 * @param {ProductCamelCase}   props.product    - The product behind the feature.
 * @param {object}             props.activation - How the product may be switched.
 * @param {string}             props.name       - The feature's name, for the label.
 * @return The rendered component.
 */
function ProductSwitch( { product, activation, name }: ProductSwitchProps ) {
	const isActive = activation.active ?? true;
	const { setActive, isBusy } = useProductActivation( { product, ...activation } );

	return (
		<SwitchButton
			isOn={ isActive }
			name={ name }
			disabled={ !! activation.disabled || isBusy }
			onClick={ setActive }
		/>
	);
}

type ModuleSwitchProps = {
	module: MyJetpackModule;
	name: string;
};

/**
 * Switch a module-backed feature, as a button rather than the card's toggle.
 *
 * @param {ModuleSwitchProps} props        - The component props.
 * @param {MyJetpackModule}   props.module - The module behind the feature.
 * @param {string}            props.name   - The feature's name, for the label.
 * @return The rendered component.
 */
function ModuleSwitch( { module: $module, name }: ModuleSwitchProps ) {
	const { setModuleActive, isUpdating } = useModuleActivation( $module, { reload: false } );
	const isActive = $module.activated;

	const onClick = useCallback( () => setModuleActive( ! isActive ), [ isActive, setModuleActive ] );

	return (
		<SwitchButton
			isOn={ isActive }
			name={ name }
			disabled={ isUpdating || ! $module.available || !! $module.override }
			onClick={ onClick }
		/>
	);
}

type StandaloneSwitchProps = {
	product: ProductCamelCase;
	isOn: boolean;
	name: string;
};

/**
 * Switch a feature by its standalone plugin, as a button rather than the card's toggle.
 *
 * @param {StandaloneSwitchProps} props         - The component props.
 * @param {ProductCamelCase}      props.product - The product whose plugin is the switch.
 * @param {boolean}               props.isOn    - Whether the plugin is installed and active.
 * @param {string}                props.name    - The feature's name, for the label.
 * @return The rendered component.
 */
function StandaloneSwitch( { product, isOn, name }: StandaloneSwitchProps ) {
	const { setActive, isBusy } = useStandaloneSwitch( product, isOn );

	return <SwitchButton isOn={ isOn } name={ name } disabled={ isBusy } onClick={ setActive } />;
}

type FeatureModalActionsProps = {
	state: FeatureState;
};

/**
 * What the modal offers to do with a feature.
 *
 * Buttons rather than the card's switch: the modal is read at the point of deciding, so
 * it names the decision. Open leads the row once the feature is running, Activate before
 * that; a feature that needs more than switching keeps the lifecycle button, which says
 * what it needs next.
 *
 * @param {FeatureModalActionsProps} props       - The component props.
 * @param {FeatureState}             props.state - Live state for the feature.
 * @return The rendered component.
 */
export function FeatureModalActions( { state }: FeatureModalActionsProps ) {
	const { data: interstitials } = useInterstitialsState();
	const { showAiModuleToggle = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );
	const { feature, product, module: $module } = state;
	const isActive = state.status === 'active';
	const nothingToSwitch = hasNothingLocalToSwitch( state );
	// A feature running on its plan alone has only somewhere to go, and Open already
	// leads there, so its lifecycle button would just say the same thing twice.
	const opensElsewhere = nothingToSwitch && isActive && !! feature.manage_url;

	const activation = product
		? getProductActivation(
				product,
				$module,
				!! interstitials?.[ product.slug ],
				showAiModuleToggle
			)
		: null;

	return (
		<>
			{ isActive && feature.manage_url ? (
				<LinkButton href={ feature.manage_url } variant="solid" size="compact">
					{ __( 'Open', 'jetpack-my-jetpack' ) }
				</LinkButton>
			) : null }

			{ product && feature.standalone_switch ? (
				<StandaloneSwitch product={ product } isOn={ isActive } name={ feature.name } />
			) : null }

			{ ! feature.standalone_switch && $module?.available ? (
				<ModuleSwitch module={ $module } name={ feature.name } />
			) : null }

			{ ! feature.standalone_switch &&
			! $module?.available &&
			product &&
			activation &&
			! nothingToSwitch ? (
				<ProductSwitch
					product={ product }
					activation={ { ...activation, disabled: false, reloadOnToggle: false } }
					name={ feature.name }
				/>
			) : null }

			{ ! $module?.available &&
			product &&
			( ! activation || nothingToSwitch ) &&
			! opensElsewhere ? (
				<ActionButton slug={ product.slug as JetpackModule } variant="secondary" />
			) : null }
		</>
	);
}
