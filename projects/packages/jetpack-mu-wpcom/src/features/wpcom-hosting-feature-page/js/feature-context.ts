import { createContext, useContext } from 'react';
import type { FeatureConfig } from './types.ts';

export const FeatureContext = createContext< FeatureConfig | null >( null );

/**
 * The config of the hosting feature this page is for.
 *
 * @return The config provided by HostingFeaturePage.
 */
export function useFeature(): FeatureConfig {
	const config = useContext( FeatureContext );

	if ( ! config ) {
		throw new Error( 'useFeature() must be used inside HostingFeaturePage.' );
	}

	return config;
}
