import { createContext, useContext } from 'react';
import type { BaseFeatureConfig, FeatureConfig } from './types.ts';

export const FeatureContext = createContext< BaseFeatureConfig | FeatureConfig | null >( null );

/**
 * The config of the hosting feature this page is for.
 *
 * @return The config provided by HostingFeaturePage.
 */
export function useFeature(): BaseFeatureConfig | FeatureConfig {
	const config = useContext( FeatureContext );

	if ( ! config ) {
		throw new Error( 'useFeature() must be used inside HostingFeaturePage.' );
	}

	return config;
}

/**
 * The config of a plan-gated feature, for the prompts only such a feature shows.
 *
 * @return The config provided by HostingFeaturePage.
 */
export function usePlanFeature(): FeatureConfig {
	const config = useFeature();

	if ( ! ( 'upgrade' in config ) ) {
		throw new Error( 'usePlanFeature() needs the config of a plan-gated feature.' );
	}

	return config;
}
