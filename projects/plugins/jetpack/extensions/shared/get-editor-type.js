import { select } from '@wordpress/data';

export const SITE_EDITOR = 'site';
export const WIDGET_EDITOR = 'widget';
export const POST_EDITOR = 'post';
export const CUSTOMIZER_EDITOR = 'customizer';
export const NAVIGATION_EDITOR = 'navigation';
export const UNKNOWN_EDITOR = 'unknown';

export const getEditorType = () => {
	if ( select( 'core/edit-site' ) ) {
		return SITE_EDITOR;
	}

	if ( select( 'core/edit-widgets' ) ) {
		return WIDGET_EDITOR;
	}

	if ( select( 'core/customize-widgets' ) ) {
		return CUSTOMIZER_EDITOR;
	}

	if ( select( 'core/edit-navigation' ) ) {
		return NAVIGATION_EDITOR;
	}

	if ( select( 'core/edit-post' ) ) {
		return POST_EDITOR;
	}

	return UNKNOWN_EDITOR;
};
