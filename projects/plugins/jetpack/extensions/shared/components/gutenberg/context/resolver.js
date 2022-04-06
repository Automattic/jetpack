/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

export const SITE_EDITOR_CONTEXT = 'SITE_EDITOR_CONTEXT';
export const WIDGET_EDITOR_CONTEXT = 'WIDGET_EDITOR_CONTEXT';
export const POST_EDITOR_CONTEXT = 'POST_EDITOR_CONTEXT';
export const CUSTOMIZER_EDITOR_CONTEXT = 'CUSTOMIZER_EDITOR_CONTEXT';
export const NAVIGATION_EDITOR_CONTEXT = 'NAVIGATION_EDITOR_CONTEXT';
export const UNKNOWN_EDITOR_CONTEXT = 'UNKNOWN_EDITOR_CONTEXT';

export const getGutenbergContext = () => {
	if ( select( 'core/edit-site' ) ) {
		return SITE_EDITOR_CONTEXT;
	}

	if ( select( 'core/edit-widgets' ) ) {
		return WIDGET_EDITOR_CONTEXT;
	}

	if ( select( 'core/customize-widgets' ) ) {
		return CUSTOMIZER_EDITOR_CONTEXT;
	}

	if ( select( 'core/edit-navigation' ) ) {
		return NAVIGATION_EDITOR_CONTEXT;
	}

	if ( select( 'core/editor' ) ) {
		return POST_EDITOR_CONTEXT;
	}

	return UNKNOWN_EDITOR_CONTEXT;
};
