/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { store } from './store';
/**
 * Types
 */
const debug = debugFactory( 'seo-enhancer:use-seo-module-settings' );

export const useSeoModuleSettings = () => {
	const { tracks } = useAnalytics();
	const isEnabled = useSelect( select => select( store ).isAutoEnhanceEnabled(), [] );
	const isToggling = useSelect( select => select( store ).isTogglingAutoEnhance(), [] );
	const setIsToggling = useDispatch( store ).setIsTogglingAutoEnhance;
	const setIsEnabled = useDispatch( store ).setIsAutoEnhanceEnabled;

	const toggleEnhancer = useCallback( async () => {
		setIsToggling( true );
		try {
			await apiFetch( {
				path: 'jetpack/v4/module/seo-tools',
				method: 'post',
				data: { ai_seo_enhancer_enabled: ! isEnabled },
			} );
			tracks.recordEvent( 'jetpack_seo_enhancer_toggle', {
				toggled: ! isEnabled ? 'on' : 'off',
			} );
			setIsEnabled( ! isEnabled );
		} catch ( error ) {
			debug( 'Error toggling SEO enhancer', error );
			tracks.recordEvent( 'jetpack_seo_enhancer_toggle_error', {
				toggled: ! isEnabled ? 'on' : 'off',
				error: error?.message,
			} );
		} finally {
			setIsToggling( false );
		}
	}, [ isEnabled, setIsEnabled, setIsToggling, tracks ] );

	return {
		isEnabled,
		toggleEnhancer,
		isToggling,
	};
};
