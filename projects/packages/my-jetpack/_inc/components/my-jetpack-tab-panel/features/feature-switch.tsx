import { ModuleFeatureAction } from './module-feature-action';
import { ProductFeatureAction } from './product-feature-action';
import type { FeatureState } from './feature-state';

type FeatureSwitchProps = {
	state: FeatureState;
};

/**
 * The control that actually switches a feature on or off.
 *
 * Deliberately absent from the list rows, which stay browse-only: from the list a
 * feature is switched by selecting it and using the bulk bar, or by opening its
 * detail page. The two branches are separate components so each can call its own
 * data hooks unconditionally.
 *
 * @param {FeatureSwitchProps} props       - The component props.
 * @param {FeatureState}       props.state - Live state for the feature.
 * @return The rendered component.
 */
export function FeatureSwitch( { state }: FeatureSwitchProps ) {
	if ( state.product ) {
		return <ProductFeatureAction state={ state } />;
	}

	if ( state.module ) {
		return <ModuleFeatureAction state={ state } />;
	}

	return null;
}
