/**
 * External dependencies
 */
import { JETPACK_MODULES_STORE_ID } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { select } from '@wordpress/data';
import { useState, useCallback, useEffect } from '@wordpress/element';
import debugFactory from 'debug';
/**
 * Types
 */
import type { JetpackModuleSelector } from './types';

const debug = debugFactory( 'seo-enhancer:use-seo-module-settings' );

export const useSeoModuleSettings = () => {
	const [ isEnabled, setIsEnabled ] = useState( false );
	const [ isToggling, setIsToggling ] = useState( false );

	useEffect( () => {
		const seoModuleSettings = (
			select( JETPACK_MODULES_STORE_ID ) as JetpackModuleSelector
		 ).getJetpackModules()[ 'seo-tools' ];
		const enhancerAvailable =
			seoModuleSettings && 'ai_seo_enhancer_enabled' in seoModuleSettings.options;
		const enhancerEnabled =
			enhancerAvailable && seoModuleSettings.options?.ai_seo_enhancer_enabled?.current_value;

		setIsEnabled( enhancerEnabled );
	}, [] );

	const toggleEnhancer = useCallback( async () => {
		setIsToggling( true );
		try {
			await apiFetch( {
				path: 'jetpack/v4/module/seo-tools',
				method: 'post',
				data: { ai_seo_enhancer_enabled: ! isEnabled },
			} );

			setIsEnabled( ! isEnabled );
		} catch ( error ) {
			debug( 'Error toggling SEO enhancer', error );
		} finally {
			setIsToggling( false );
		}
	}, [ isEnabled ] );

	return {
		isEnabled,
		toggleEnhancer,
		isToggling,
	};
};
