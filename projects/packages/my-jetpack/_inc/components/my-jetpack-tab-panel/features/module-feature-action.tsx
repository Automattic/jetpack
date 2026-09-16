import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { useModuleSwitch } from './use-module-switch';
import type { FeatureState } from './feature-state';

type ModuleFeatureActionProps = {
	state: FeatureState;
};

/**
 * Activate and deactivate buttons for a feature governed by a Jetpack module.
 *
 * @param {ModuleFeatureActionProps} props       - The component props.
 * @param {FeatureState}             props.state - Live state for the feature.
 * @return The rendered component.
 */
export function ModuleFeatureAction( { state }: ModuleFeatureActionProps ) {
	const { isActive, isBusy, isLocked, onActivate, onDeactivate } = useModuleSwitch( state );

	if ( ! state.module ) {
		return null;
	}

	if ( isActive ) {
		return (
			<Button
				variant="outline"
				tone="neutral"
				onClick={ onDeactivate }
				disabled={ isBusy || isLocked }
				loading={ isBusy }
			>
				{ __( 'Deactivate', 'jetpack-my-jetpack' ) }
			</Button>
		);
	}

	return (
		<Button
			variant="solid"
			onClick={ onActivate }
			disabled={ isBusy || isLocked }
			loading={ isBusy }
		>
			{ __( 'Activate', 'jetpack-my-jetpack' ) }
		</Button>
	);
}
