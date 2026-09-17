import { __, sprintf } from '@wordpress/i18n';
import { Button, LinkButton } from '@wordpress/ui';
import { useCallback } from 'react';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { useInterstitialsState } from '../../../hooks/use-interstitials-state';
import ActionButton from '../../action-button';
import { useModuleActivation } from '../../module-toggle';
import { getProductActivation, useProductActivation } from '../products/product-card-action';
import type { FeatureState } from './feature-state';
import type { ProductCamelCase } from '../../../data/types';
import type { MyJetpackModule } from '../../../types';
import type { ProductActivation } from '../products/product-card-action';

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
		<Button
			variant={ isActive ? 'outline' : 'solid' }
			size="compact"
			disabled={ activation.disabled || isBusy }
			onClick={ setActive }
			aria-label={ sprintf(
				/* translators: 1: Activate or Deactivate, 2: the feature name. */
				__( '%1$s %2$s', 'jetpack-my-jetpack' ),
				isActive
					? __( 'Deactivate', 'jetpack-my-jetpack' )
					: __( 'Activate', 'jetpack-my-jetpack' ),
				name
			) }
		>
			{ isActive
				? __( 'Deactivate', 'jetpack-my-jetpack' )
				: __( 'Activate', 'jetpack-my-jetpack' ) }
		</Button>
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
	const { setModuleActive, isUpdating } = useModuleActivation( $module );
	const isActive = $module.activated;

	const onClick = useCallback( () => setModuleActive( ! isActive ), [ isActive, setModuleActive ] );

	return (
		<Button
			variant={ isActive ? 'outline' : 'solid' }
			size="compact"
			disabled={ isUpdating || ! $module.available || !! $module.override }
			onClick={ onClick }
			aria-label={ sprintf(
				/* translators: 1: Activate or Deactivate, 2: the feature name. */
				__( '%1$s %2$s', 'jetpack-my-jetpack' ),
				isActive
					? __( 'Deactivate', 'jetpack-my-jetpack' )
					: __( 'Activate', 'jetpack-my-jetpack' ),
				name
			) }
		>
			{ isActive
				? __( 'Deactivate', 'jetpack-my-jetpack' )
				: __( 'Activate', 'jetpack-my-jetpack' ) }
		</Button>
	);
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

			{ product && activation ? (
				<ProductSwitch product={ product } activation={ activation } name={ feature.name } />
			) : null }

			{ ! activation && $module ? <ModuleSwitch module={ $module } name={ feature.name } /> : null }

			{ ! activation && ! $module && product ? (
				<ActionButton slug={ product.slug as JetpackModule } variant="secondary" />
			) : null }
		</>
	);
}
