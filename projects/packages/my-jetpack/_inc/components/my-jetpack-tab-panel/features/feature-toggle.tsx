import { FormToggle } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useModuleSwitch } from './use-module-switch';
import { useProductSwitch } from './use-product-switch';
import type { FeatureState } from './feature-state';

type FeatureToggleProps = {
	state: FeatureState;
};

const label = ( isActive: boolean, name: string ) =>
	isActive
		? sprintf(
				/* translators: %s is the feature name */
				__( 'Deactivate %s', 'jetpack-my-jetpack' ),
				name
		  )
		: sprintf(
				/* translators: %s is the feature name */
				__( 'Activate %s', 'jetpack-my-jetpack' ),
				name
		  );

/**
 * Switch for a product-backed feature. Turning it on installs first when the
 * standalone plugin is missing, so one gesture covers both cases.
 *
 * @param {FeatureToggleProps} props       - The component props.
 * @param {FeatureState}       props.state - Live state for the feature.
 * @return The rendered component.
 */
function ProductToggle( { state }: FeatureToggleProps ) {
	const { isActive, isBusy, onToggle } = useProductSwitch( state );

	return (
		<FormToggle
			checked={ isActive }
			disabled={ isBusy }
			onChange={ onToggle }
			aria-label={ label( isActive, state.feature.name ) }
		/>
	);
}

/**
 * Switch for a feature governed by a Jetpack module.
 *
 * @param {FeatureToggleProps} props       - The component props.
 * @param {FeatureState}       props.state - Live state for the feature.
 * @return The rendered component.
 */
function ModuleToggle( { state }: FeatureToggleProps ) {
	const { isActive, isBusy, isLocked, onToggle } = useModuleSwitch( state );

	return (
		<FormToggle
			checked={ isActive }
			disabled={ isBusy || isLocked }
			onChange={ onToggle }
			aria-label={ label( isActive, state.feature.name ) }
		/>
	);
}

/**
 * The list row's on/off switch, in the shape the modules page uses.
 *
 * A feature that needs a paid plan, or has nothing local to switch, gets no toggle:
 * there is no state the row could put it into.
 *
 * @param {FeatureToggleProps} props       - The component props.
 * @param {FeatureState}       props.state - Live state for the feature.
 * @return The rendered component.
 */
export function FeatureToggle( { state }: FeatureToggleProps ) {
	if ( ! state.switchable ) {
		return null;
	}

	if ( state.product ) {
		return <ProductToggle state={ state } />;
	}

	if ( state.module ) {
		return <ModuleToggle state={ state } />;
	}

	return null;
}
