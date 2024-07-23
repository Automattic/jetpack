import { addFilter } from '@wordpress/hooks';
import './wpcom-documentation-links.css';

declare global {
	interface Window {
		_currentSiteId: number;
		_currentSiteType: string;
	}
}

/**
 * Override Core documentation that has matching WordPress.com documentation.
 *
 * @param translation - string Translated text.
 * @param text        - string Original text.
 */
function overrideCoreDocumentationLinksToWpcom( translation: string, text: string ) {
	switch ( text ) {
		case 'https://wordpress.org/documentation/article/what-is-an-excerpt-classic-editor/':
		case 'https://wordpress.org/documentation/article/page-post-settings-sidebar/#excerpt':
			return 'https://wordpress.com/support/excerpts/';
		case 'https://wordpress.org/documentation/article/write-posts-classic-editor/#post-field-descriptions':
		case 'https://wordpress.org/documentation/article/page-post-settings-sidebar/#permalink':
			return 'https://wordpress.com/support/permalinks-and-slugs/';
		case 'https://wordpress.org/documentation/article/wordpress-block-editor/':
			return 'https://wordpress.com/support/wordpress-editor/';
		case 'https://wordpress.org/documentation/article/site-editor/':
			return 'https://wordpress.com/support/site-editor/';
		case 'https://wordpress.org/documentation/article/block-based-widgets-editor/':
			return 'https://wordpress.com/support/widgets/';
		case 'https://wordpress.org/plugins/classic-widgets/':
			return 'https://wordpress.com/plugins/classic-widgets';
		case 'https://wordpress.org/documentation/article/styles-overview/':
			return 'https://wordpress.com/support/using-styles/';
	}

	return translation;
}

/**
 * Override Core documentation that doesn't have matching WordPress.com documentation.
 *
 * @param translation - string Translated text.
 * @param text        - string Original text.
 */
function hideSimpleSiteTranslations( translation: string, text: string ) {
	switch ( text ) {
		case 'https://wordpress.org/plugins/classic-widgets/':
			return '';
		case 'Want to stick with the old widgets?':
			return '';
		case 'Get the Classic Widgets plugin.':
			return '';
	}

	return translation;
}

addFilter(
	'i18n.gettext_default',
	'jetpack-mu-wpcom/override-core-docs-to-wpcom',
	overrideCoreDocumentationLinksToWpcom,
	9
);

if ( window?._currentSiteType === 'simple' ) {
	addFilter(
		'i18n.gettext_default',
		'jetpack-mu-wpcom/override-core-docs-to-wpcom',
		hideSimpleSiteTranslations,
		10
	);
}
