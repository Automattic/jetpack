import { localizeUrl } from '@automattic/i18n-utils';
import { getUserLocale } from '@automattic/jetpack-components';
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
	let url;
	switch ( text ) {
		case 'https://wordpress.org/documentation/article/what-is-an-excerpt-classic-editor/':
		case 'https://wordpress.org/documentation/article/page-post-settings-sidebar/#excerpt':
			url = 'https://wordpress.com/support/excerpts/';
			break;
		case 'https://wordpress.org/documentation/article/write-posts-classic-editor/#post-field-descriptions':
		case 'https://wordpress.org/documentation/article/page-post-settings-sidebar/#permalink':
			url = 'https://wordpress.com/support/permalinks-and-slugs/';
			break;
		case 'https://wordpress.org/documentation/article/wordpress-block-editor/':
			url = 'https://wordpress.com/support/wordpress-editor/';
			break;
		case 'https://wordpress.org/documentation/article/site-editor/':
			url = 'https://wordpress.com/support/site-editor/';
			break;
		case 'https://wordpress.org/documentation/article/block-based-widgets-editor/':
			url = 'https://wordpress.com/support/widgets/';
			break;
		case 'https://wordpress.org/plugins/classic-widgets/':
			url = 'https://wordpress.com/plugins/classic-widgets';
			break;
		case 'https://wordpress.org/documentation/article/styles-overview/':
			url = 'https://wordpress.com/support/using-styles/';
			break;
	}

	if ( url ) {
		return localizeUrl( url, getUserLocale().toLowerCase() );
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
