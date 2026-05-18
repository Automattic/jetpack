import { __ } from '@wordpress/i18n';
import { enhanceSearchInput } from './enhance-input';
import './style.scss';

const DEFAULT_SEARCH_INPUT_SELECTOR = [
	'input[name="s"]:not(.jetpack-instant-search__box-input)',
	'#searchform input.search-field:not(.jetpack-instant-search__box-input)',
	'.search-form input.search-field:not(.jetpack-instant-search__box-input)',
	'.searchform input.search-field:not(.jetpack-instant-search__box-input)',
].join( ', ' );

const labels = {
	list: __( 'Search suggestions', 'jetpack-search-pkg' ),
	query: __( 'Suggestions', 'jetpack-search-pkg' ),
	taxonomy: __( 'Popular Filters', 'jetpack-search-pkg' ),
	post: __( 'Articles', 'jetpack-search-pkg' ),
};

/**
 * Wrap a native search input so the absolute-positioned suggestions list can
 * anchor to the input without taking over the form.
 *
 * @param {HTMLInputElement} input - Search input.
 * @return {HTMLElement|null} Suggestions container.
 */
function prepareContainer( input ) {
	if ( input.closest( '.jetpack-search-suggestions-wrapper' ) ) {
		return input.closest( '.jetpack-search-suggestions-wrapper' );
	}
	const parent = input.parentNode;
	if ( ! parent ) {
		return null;
	}

	const wrapper = document.createElement( 'span' );
	wrapper.className = 'jetpack-search-suggestions-wrapper';
	parent.insertBefore( wrapper, input );
	wrapper.appendChild( input );
	return wrapper;
}

/**
 * Initialize search suggestions for theme-rendered search forms.
 */
function initialize() {
	const options = window.JetpackSearchSuggestionsOptions ?? {};
	const { siteId, searchSuggestionsEnabled } = options;
	if ( ! searchSuggestionsEnabled || ! siteId ) {
		return;
	}

	const selector = options.theme_options?.searchInputSelector || DEFAULT_SEARCH_INPUT_SELECTOR;
	document.querySelectorAll( selector ).forEach( input => {
		const form = input.closest( 'form' );
		const container = prepareContainer( input );
		if ( ! form || ! container ) {
			return;
		}

		enhanceSearchInput( {
			input,
			container,
			siteId,
			apiOptions: options,
			labels,
			onQuerySelect: item => {
				input.value = item.text;
				form.submit();
			},
			onNavigate: item => {
				window.location.href = item.url;
			},
		} );
	} );
}

if ( document.readyState !== 'loading' ) {
	initialize();
} else {
	document.addEventListener( 'DOMContentLoaded', initialize );
}
