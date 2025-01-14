import { localizeUrl } from '@automattic/i18n-utils';
import { addFilter } from '@wordpress/hooks';
import './wpcom-documentation-links.css';

/**
 * Override Core documentation that has matching WordPress.com documentation.
 *
 * @param {string} translation - string Translated text.
 * @param {string} text        - string Original text.
 * @return {string} - The localized URL if a match is found, otherwise the original translation.
 */
function overrideCoreDocumentationLinksToWpcom( translation: string, text: string ): string {
	const documentLinksMap = {
		/**
		 * Excerpts
		 */
		'https://wordpress.org/documentation/article/what-is-an-excerpt-classic-editor/':
			'https://wordpress.com/support/excerpts/',
		'https://wordpress.org/documentation/article/page-post-settings-sidebar/#excerpt':
			'https://wordpress.com/support/excerpts/',

		/**
		 * Permalinks and Slugs
		 */
		'https://wordpress.org/documentation/article/write-posts-classic-editor/#post-field-descriptions':
			'https://wordpress.com/support/permalinks-and-slugs/',
		'https://wordpress.org/documentation/article/page-post-settings-sidebar/#permalink':
			'https://wordpress.com/support/permalinks-and-slugs/',

		/**
		 * Wordpress Editor
		 */
		'https://wordpress.org/documentation/article/wordpress-block-editor/':
			'https://wordpress.com/support/wordpress-editor/',

		/**
		 * Site Editor
		 */
		'https://wordpress.org/documentation/article/site-editor/':
			'https://wordpress.com/support/site-editor/',

		/**
		 * Widgets
		 */
		'https://wordpress.org/documentation/article/block-based-widgets-editor/':
			'https://wordpress.com/support/widgets/',
		'https://wordpress.org/plugins/classic-widgets/':
			'https://wordpress.com/plugins/classic-widgets',

		/**
		 * Styles
		 */
		'https://wordpress.org/documentation/article/styles-overview/':
			'https://wordpress.com/support/using-styles/',

		'https://developer.wordpress.org/advanced-administration/wordpress/css/':
			'https://wordpress.com/support/editing-css/',

		/**
		 * Embed Block
		 */
		'https://wordpress.org/documentation/article/embeds/':
			'https://wordpress.com/support/wordpress-editor/blocks/embed-block/',
	};

	const url = documentLinksMap[ text ] ?? '';
	if ( url ) {
		return localizeUrl( url );
	}

	return translation;
}

/**
 * Override Core documentation that doesn't have matching WordPress.com documentation.
 *
 * @param {string} translation - string Translated text.
 * @param {string} text        - string Original text.
 * @return {string} - Empty string for specific text, otherwise translated string.
 */
function hideSimpleSiteTranslations( translation: string, text: string ): string {
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
