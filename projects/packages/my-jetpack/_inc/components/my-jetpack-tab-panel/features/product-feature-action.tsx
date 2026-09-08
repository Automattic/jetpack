import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { useProductSwitch } from './use-product-switch';
import type { FeatureState } from './feature-state';

type ProductFeatureActionProps = {
	state: FeatureState;
};

/**
 * Install, activate and deactivate buttons for a feature backed by a product.
 *
 * @param {ProductFeatureActionProps} props       - The component props.
 * @param {FeatureState}              props.state - Live state for the feature.
 * @return The rendered component.
 */
export function ProductFeatureAction( { state }: ProductFeatureActionProps ) {
	const { action, isBusy, onInstall, onActivate, onDeactivate } = useProductSwitch( state );

	if ( ! state.product ) {
		return null;
	}

	if ( action === 'install' ) {
		return (
			<Button variant="solid" onClick={ onInstall } disabled={ isBusy } loading={ isBusy }>
				{ __( 'Install', 'jetpack-my-jetpack' ) }
			</Button>
		);
	}

	if ( action === 'activate' ) {
		return (
			<Button variant="solid" onClick={ onActivate } disabled={ isBusy } loading={ isBusy }>
				{ __( 'Activate', 'jetpack-my-jetpack' ) }
			</Button>
		);
	}

	if ( action !== 'running' ) {
		return null;
	}

	return (
		<Button
			variant="outline"
			tone="neutral"
			onClick={ onDeactivate }
			disabled={ isBusy }
			loading={ isBusy }
		>
			{ __( 'Deactivate', 'jetpack-my-jetpack' ) }
		</Button>
	);
}
