import { createInterpolateElement } from '@wordpress/element';
import { sprintf } from '@wordpress/i18n';

export type Formatter< Options = unknown > = ( text: string, options?: Options ) => string;
type AugmentFormatterReturnType< T extends Formatter, TNewReturn > = (
	...a: Parameters< T >
) => ReturnType< T > | TNewReturn;
type ConditionalFormatter = AugmentFormatterReturnType< Formatter, boolean >;
type NullableFormatter = AugmentFormatterReturnType< Formatter, undefined >;

export const baseDomain: Formatter = url => {
	// Strip leading protocol
	const withoutProtocol = url.replace( /^[^/]+:\/\//, '' );
	// Strip everything after the domain using indexOf to avoid ReDoS
	const slashIndex = withoutProtocol.indexOf( '/' );
	return slashIndex === -1 ? withoutProtocol : withoutProtocol.substring( 0, slashIndex );
};

/**
 * Counts Unicode codepoints rather than UTF-16 code units, so an emoji like 🚀
 * is one character (matching PHP `mb_strlen`) rather than two. Lets the JS
 * preview's truncation align with the backend's logical-char counting.
 *
 * @param text - The string to measure.
 * @return The codepoint count.
 */
const codepointLength = ( text: string ): number => Array.from( text ).length;

/**
 * Slices a string by Unicode codepoints rather than UTF-16 code units, so
 * surrogate pairs (most emoji) are never split mid-character.
 *
 * @param text  - The string to slice.
 * @param start - Start index, in codepoints.
 * @param end   - End index, in codepoints (exclusive).
 * @return The sliced string.
 */
const codepointSlice = ( text: string, start: number, end?: number ): string =>
	Array.from( text ).slice( start, end ).join( '' );

export const shortEnough: ( n: number ) => ConditionalFormatter = limit => title =>
	codepointLength( title ) <= limit ? title : false;

export const truncatedAtSpace: ( a: number, b: number ) => ConditionalFormatter =
	( lower, upper ) => fullTitle => {
		const title = fullTitle.slice( 0, upper );
		const lastSpace = title.lastIndexOf( ' ' );

		return lastSpace > lower && lastSpace < upper
			? title.slice( 0, lastSpace ).concat( '…' )
			: false;
	};

export const hardTruncation: ( n: number ) => Formatter = limit => title =>
	codepointSlice( title, 0, limit ).concat( '…' );

export const firstValid: ( ...args: ConditionalFormatter[] ) => NullableFormatter =
	( ...predicates ) =>
	a =>
		( predicates.find( p => false !== p( a ) ) as Formatter )?.( a );

export const stripHtmlTags: Formatter< Array< string > > = ( description, allowedTags = [] ) => {
	const pattern = new RegExp( `(<([^${ allowedTags.join( '' ) }>]+)>)`, 'gi' );

	return description ? description.replace( pattern, '' ) : '';
};

/**
 * For social note posts we use the first 50 characters of the description.
 * @param description - The post description.
 * @return The first 50 characters of the description.
 */
export const getTitleFromDescription = ( description: string ): string => {
	return stripHtmlTags( description ).substring( 0, 50 );
};

export const hasTag = ( text: string, tag: string ): boolean => {
	const pattern = new RegExp( `<${ tag }[^>]*>`, 'gi' );

	return pattern.test( text );
};

export const formatNextdoorDate = new Intl.DateTimeFormat( 'en-GB', {
	// Result: "7 Oct", "31 Dec"
	day: 'numeric',
	month: 'short',
} ).format;

export const formatThreadsDate = new Intl.DateTimeFormat( 'en-US', {
	// Result: "'06/21/2024"
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
} ).format;

export const formatTweetDate = new Intl.DateTimeFormat( 'en-US', {
	// Result: "Apr 7", "Dec 31"
	month: 'short',
	day: 'numeric',
} ).format;

export const formatMastodonDate = new Intl.DateTimeFormat( 'en-US', {
	// Result: "Apr 7, 2024", "Dec 31, 2023"
	month: 'short',
	day: 'numeric',
	year: 'numeric',
} ).format;

export type Platform =
	| 'bluesky'
	| 'facebook'
	| 'instagram'
	| 'linkedin'
	| 'mastodon'
	| 'nextdoor'
	| 'threads'
	| 'tumblr'
	| 'twitter';

type PreviewTextOptions = {
	platform: Platform;
	maxChars?: number;
	maxLines?: number;
	hyperlinkUrls?: boolean;
	hyperlinkHashtags?: boolean;
	hashtagDomain?: string;
	/**
	 * Editor hyperlinks to render as links over the matching body text. Only
	 * passed for the networks whose APIs support inline links (Bluesky, Tumblr).
	 */
	hyperlinks?: Hyperlink[];
};

/**
 * An editor hyperlink: the visible anchor text and the URL it points to.
 */
export type Hyperlink = {
	text: string;
	href: string;
	/**
	 * Zero-based index of this anchor among identical occurrences of `text` in
	 * the content, so repeated texts link the right duplicate. Defaults to 0.
	 */
	occurrence?: number;
};

// Collapses whitespace runs to a single space so anchor text matches the sanitized body text.
const collapseWhitespace = ( text: string ): string => text.replace( /\s+/g, ' ' ).trim();

// Counts the occurrences of `needle` in `haystack`, scanning from each match's next character.
const countOccurrences = ( haystack: string, needle: string ): number => {
	let count = 0;

	for (
		let pos = haystack.indexOf( needle );
		pos !== -1;
		pos = haystack.indexOf( needle, pos + 1 )
	) {
		count++;
	}

	return count;
};

// Index of the zero-based `n`-th occurrence of `needle` in `haystack`, or -1.
const nthIndexOf = ( haystack: string, needle: string, n: number ): number => {
	let pos = haystack.indexOf( needle );

	while ( pos !== -1 && n > 0 ) {
		n--;
		pos = haystack.indexOf( needle, pos + 1 );
	}

	return pos;
};

/**
 * Extracts `(text, href)` pairs from `<a href="…">text</a>` in HTML, skipping
 * autolinks (text already equals the URL) and non-http(s) hrefs. Mirrors the
 * backend `ExtractorUtils::get_anchor_links_from_html` so the preview links the
 * same anchors the published share will.
 *
 * @param html - Raw post content HTML.
 * @return The editor hyperlinks found, in document order.
 */
export function parseHyperlinks( html: string ): Hyperlink[] {
	if ( ! html ) {
		return [];
	}

	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = html;

	const links: Hyperlink[] = [];

	for ( const anchor of Array.from( doc.body.querySelectorAll( 'a[href]' ) ) ) {
		const href = anchor.getAttribute( 'href' ) ?? '';
		const text = collapseWhitespace( anchor.textContent ?? '' );

		if ( ! /^https?:\/\//i.test( href ) || '' === text || text === href ) {
			continue;
		}

		// Record which duplicate of `text` this anchor covers, by counting the
		// identical occurrences in the plain text before the anchor.
		const range = doc.createRange();
		range.selectNodeContents( doc.body );
		range.setEndBefore( anchor );
		const occurrence = countOccurrences( collapseWhitespace( range.toString() ), text );

		links.push( { text, href, occurrence } );
	}

	return links;
}

export const hashtagUrlMap = {
	twitter: 'https://twitter.com/hashtag/%1$s',
	facebook: 'https://www.facebook.com/hashtag/%1$s',
	linkedin: 'https://www.linkedin.com/feed/hashtag/?keywords=%1$s',
	instagram: 'https://www.instagram.com/explore/tags/%1$s',
	mastodon: 'https://%2$s/tags/%1$s',
	nextdoor: 'https://nextdoor.com/hashtag/%1$s',
	threads: 'https://www.threads.net/search?q=%1$s&serp_type=tags',
	tumblr: 'https://www.tumblr.com/tagged/%1$s',
	bluesky: 'https://bsky.app/hashtag/%1$s',
} as const;

/**
 * Prepares the text for the preview.
 * @param {string}             text    - The text to prepare.
 * @param {PreviewTextOptions} options - The options for preparing the text.
 * @return The prepared text as React nodes.
 */
export function preparePreviewText( text: string, options: PreviewTextOptions ): React.ReactNode {
	const {
		platform,
		maxChars,
		maxLines,
		hyperlinkHashtags = true,
		// Instagram doesn't support hyperlink URLs at the moment.
		hyperlinkUrls = 'instagram' !== platform,
		hyperlinks,
	} = options;

	let result = stripHtmlTags( text );

	// Replace multiple new lines (2+) with 2 new lines
	// There can be any whitespace characters in empty lines
	// That is why "\s*"
	result = result.replaceAll( /(?:\s*[\n\r]){2,}/g, '\n\n' );

	if ( maxChars && codepointLength( result ) > maxChars ) {
		result = hardTruncation( maxChars )( result );
	}

	if ( maxLines ) {
		const lines = result.split( '\n' );

		if ( lines.length > maxLines ) {
			result = lines.slice( 0, maxLines ).join( '\n' );
		}
	}

	const componentMap: Record< string, React.ReactElement > = {};

	if ( hyperlinkUrls ) {
		// Convert URLs to hyperlinks.
		// TODO: Use a better regex here to match the URLs without protocol.
		const urls = result.match( /(https?:\/\/\S+)/g ) || [];

		/**
		 * BEFORE:
		 * result = 'Check out this cool site: https://wordpress.org and this one: https://wordpress.com'
		 */
		urls.forEach( ( url, index ) => {
			// Add the element to the component map.
			componentMap[ `Link${ index }` ] = (
				<a href={ url } rel="noopener noreferrer" target="_blank">
					{ url }
				</a>
			);
			// Replace the URL with the component placeholder.
			result = result.replace( url, `<Link${ index } />` );
		} );
		/**
		 * AFTER:
		 * result = 'Check out this cool site: <Link0 /> and this one: <Link1 />'
		 * componentMap = {
		 * Link0: <a href="https://wordpress.org" ...>https://wordpress.org</a>,
		 * Link1: <a href="https://wordpress.com" ...>https://wordpress.com</a>
		 * }
		 */
	}

	// Convert hashtags to hyperlinks.
	if ( hyperlinkHashtags && hashtagUrlMap[ platform ] ) {
		/**
		 * We need to ensure that only the standalone hashtags are matched.
		 * For example, we don't want to match the hash in the URL.
		 * Thus we need to match the whitespace character before the hashtag or the beginning of the string.
		 */
		const hashtags = result.matchAll( /(^|\s)#(\w+)/g );

		const hashtagUrl = hashtagUrlMap[ platform ];

		/**
		 * BEFORE:
		 * result = `#breaking text with a #hashtag on the #web
		 * with a url https://github.com/Automattic/wp-calypso#security that has a hash in it`
		 */
		[ ...hashtags ].forEach( ( [ fullMatch, whitespace, hashtag ], index ) => {
			const url = sprintf( hashtagUrl, hashtag, options.hashtagDomain );

			// Add the element to the component map.
			componentMap[ `Hashtag${ index }` ] = (
				<a href={ url } rel="noopener noreferrer" target="_blank">
					{ `#${ hashtag }` }
				</a>
			);

			// Replace the hashtag with the component placeholder.
			result = result.replace( fullMatch, `${ whitespace }<Hashtag${ index } />` );
		} );
		/**
		 * AFTER:
		 * result = `<Hashtag0 /> text with a <Hashtag1 /> on the <Hashtag2 />
		 * with a url https://github.com/Automattic/wp-calypso#security that has a hash in it`
		 *
		 * componentMap = {
		 * Hashtag0: <a href="https://twitter.com/hashtag/breaking" ...>#breaking</a>,
		 * Hashtag1: <a href="https://twitter.com/hashtag/hashtag" ...>#hashtag</a>,
		 * Hashtag2: <a href="https://twitter.com/hashtag/web" ...>#web</a>
		 * }
		 */
	}

	// Render editor hyperlinks: wrap each anchor's own occurrence of its text in
	// a link, resolving all positions before any tags are inserted. Anchors whose
	// occurrence isn't present (e.g. truncated away) or overlaps another match
	// are skipped. Runs after the URL/hashtag passes so the inserted tags stay balanced.
	if ( hyperlinks?.length ) {
		const matches: Array< { pos: number; text: string; href: string; index: number } > = [];

		hyperlinks.forEach( ( { text: anchorText, href, occurrence = 0 }, index ) => {
			if ( ! anchorText ) {
				return;
			}

			const pos = nthIndexOf( result, anchorText, occurrence );

			if ( pos === -1 ) {
				return;
			}

			const overlaps = matches.some(
				match => pos < match.pos + match.text.length && match.pos < pos + anchorText.length
			);

			if ( ! overlaps ) {
				matches.push( { pos, text: anchorText, href, index } );
			}
		} );

		// Insert right-to-left so earlier positions stay valid.
		matches.sort( ( a, b ) => b.pos - a.pos );

		for ( const { pos, text: anchorText, href, index } of matches ) {
			const token = `Hyperlink${ index }`;
			componentMap[ token ] = <a href={ href } rel="noopener noreferrer" target="_blank" />;

			const wrapped = `<${ token }>${ anchorText }</${ token }>`;
			result = result.slice( 0, pos ) + wrapped + result.slice( pos + anchorText.length );
		}
	}

	// Convert newlines to <br> tags.
	/**
	 * BEFORE:
	 * result = 'This is a text\nwith a newline\nin it'
	 */
	result = result.replace( /\n/g, '<br />' );
	componentMap.br = <br />;
	/**
	 * AFTER:
	 * result = 'This is a text<br />with a newline<br />in it'
	 * componentMap = { br: <br /> }
	 */

	return createInterpolateElement( result, componentMap );
}
