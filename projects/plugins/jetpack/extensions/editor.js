import apiFetch from '@wordpress/api-fetch';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import './shared/public-path';
import './shared/block-category';
import './shared/plan-upgrade-notification';
import './shared/stripe-connection-notification';
import './shared/external-media';
import './extended-blocks/core-embed';
import './extended-blocks/core-social-links';
import './extended-blocks/paid-blocks';
import './shared/styles/slideshow-fix.scss';
import './shared/styles/external-link-fix.scss';
// Register media source store to the centralized data registry.
import './store/media-source';
import './store/membership-products';
import './store/wordpress-com';
import extensionList from './index.json';
import './index.scss';

// Register middleware for @wordpress/api-fetch to indicate the fetch is coming from the editor.
apiFetch.use( ( options, next ) => {
	// Skip explicit cors requests.
	if ( options.mode === 'cors' ) {
		return next( options );
	}

	// If a URL is set, skip if it's not same-origin.
	// @see https://html.spec.whatwg.org/multipage/origin.html#same-origin
	if ( options.url ) {
		try {
			const url = new URL( options.url, location.href );
			if (
				url.protocol !== location.protocol ||
				url.hostname !== location.hostname ||
				url.port !== location.port
			) {
				return next( options );
			}
		} catch {
			// Huh? Skip it.
			return next( options );
		}
	}

	// Ok, add header.
	if ( ! options.headers ) {
		options.headers = {};
	}
	options.headers[ 'x-wp-api-fetch-from-editor' ] = 'true';
	return next( options );
} );

/**
 * Detect whether the extension is a beta extension.
 *
 * @example
 * ```js
 * import { isBetaExtension } from './';
 * isBetaExtension( 'ai-content-lens' ); // true
 * ```
 * @param {string} name - Extension name
 * @returns {boolean}     Whether the extension is a beta extension
 */
export function isBetaExtension( name ) {
	if ( ! extensionList ) {
		return false;
	}

	const betaExtensions = extensionList.beta || [];

	/*
	 * Some extensions are defined without the `jetpack/` prefix,
	 * so we need to check for both since, for instance,
	 * the jetpack blocks are prefixed with `jetpack/`.
	 */
	const cleanName = name.replace( /jetpack\//, '' );

	return betaExtensions.includes( name ) || betaExtensions.includes( cleanName );
}

function setBetaBlockTitle( settings, name ) {
	if ( ! isBetaExtension( name ) ) {
		return settings;
	}

	const { title, keywords } = settings;
	const titleSuffix = '(beta)';
	const betaKeyword = 'beta';
	const result = {
		...settings,
	};

	if ( title ) {
		result.title = title.toLowerCase().endsWith( titleSuffix )
			? title
			: `${ settings.title } ${ titleSuffix }`;
	}

	if ( Array.isArray( keywords ) ) {
		result.keywords = keywords.includes( betaKeyword ) ? keywords : [ ...keywords, betaKeyword ];
	}

	return result;
}

addFilter( 'blocks.registerBlockType', 'jetpack/label-beta-blocks-title', setBetaBlockTitle );

const withBetaClassName = createHigherOrderComponent( BlockListBlock => {
	return props => {
		// Do not add the label for children blocks
		if ( props?.clientRootId ) {
			return <BlockListBlock { ...props } />;
		}

		// Only add the label for beta blocks
		const { name } = props;
		if ( ! isBetaExtension( name ) ) {
			return <BlockListBlock { ...props } />;
		}

		return <BlockListBlock { ...props } className="is-beta-extension" />;
	};
}, 'withBetaClassName' );

addFilter( 'editor.BlockListBlock', 'jetpack/label-beta-extensions', withBetaClassName );
