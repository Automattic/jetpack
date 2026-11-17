/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';
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

	const toggleEnhancer = useCallback(
		async ( {
			placement,
		}: {
			placement: 'jetpack-sidebar' | 'document-settings' | 'jetpack-prepublish-sidebar';
		} ) => {
			setIsToggling( true );
			try {
				const isSimple = isSimpleSite();
				const response = await apiFetch< { ai_seo_enhancer_enabled?: boolean } >( {
					// See the seo-enhancer store for why Simple differs.
					path: isSimple ? '/wp/v2/settings' : 'jetpack/v4/module/seo-tools',
					method: 'post',
					data: { ai_seo_enhancer_enabled: ! isEnabled },
				} );
				// `/wp/v2/settings` succeeds without saving a setting nothing has registered.
				if ( isSimple && response?.ai_seo_enhancer_enabled !== ! isEnabled ) {
					throw new Error( 'The auto-generate setting was not saved.' );
				}
				tracks.recordEvent( 'jetpack_seo_enhancer_toggle', {
					toggled: ! isEnabled ? 'on' : 'off',
					placement,
				} );
				setIsEnabled( ! isEnabled );
			} catch ( error ) {
				debug( 'Error toggling SEO enhancer', error );
				tracks.recordEvent( 'jetpack_seo_enhancer_toggle_error', {
					toggled: ! isEnabled ? 'on' : 'off',
					error: error?.message,
					placement,
				} );
			} finally {
				setIsToggling( false );
			}
		},
		[ isEnabled, setIsEnabled, setIsToggling, tracks ]
	);

	return {
		isEnabled,
		toggleEnhancer,
		isToggling,
	};
};
