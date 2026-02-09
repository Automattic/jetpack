/**
 * Site Switcher for Command Palette
 * Adds a dynamic "Switch to Site" command that searches across all user's WordPress.com sites
 *
 * Requires WordPress 6.9+ for admin-wide command palette support
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch';
import { useCommandLoader } from '@wordpress/commands';
import { useMemo, useState, useEffect } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { siteLogo } from '@wordpress/icons';

const userId = window.jetpackSiteSwitcherConfig?.userId || 0;
const CACHE_KEY = `jetpack_site_switcher_sites_${ userId }`;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Get cached sites from localStorage
 */
function getCachedSites() {
	try {
		const cached = localStorage.getItem( CACHE_KEY );
		if ( ! cached ) {
			return null;
		}

		const { sites, timestamp } = JSON.parse( cached );

		// Check if cache is still valid
		if ( Date.now() - timestamp < CACHE_DURATION ) {
			return sites;
		}

		// Cache expired, remove it
		localStorage.removeItem( CACHE_KEY );
		return null;
	} catch {
		// If localStorage is not available or JSON parsing fails, return null
		return null;
	}
}

/**
 * Save sites to localStorage cache
 */
function setCachedSites( sites ) {
	try {
		localStorage.setItem(
			CACHE_KEY,
			JSON.stringify( {
				sites,
				timestamp: Date.now(),
			} )
		);
	} catch {
		// Silently fail if localStorage is not available (e.g., private browsing)
	}
}

/**
 * Fetch compact sites list from WordPress.com API
 */
async function fetchSitesFromWordPressCom() {
	// Check localStorage cache first
	const cachedSites = getCachedSites();
	if ( cachedSites ) {
		return cachedSites;
	}

	const apiPath = window.jetpackSiteSwitcherConfig?.apiPath;

	try {
		const data = await apiFetch( {
			path: apiPath,
			method: 'GET',
			global: true,
		} );

		const sites = data.sites || [];

		setCachedSites( sites );

		return sites;
	} catch {
		return [];
	}
}

/**
 * Safely extract hostname from a URL string
 *
 * @param {string} urlString - The URL to parse
 * @return {string} The hostname, or empty string if invalid
 */
function getHostnameFromURL( urlString ) {
	if ( ! urlString ) {
		return '';
	}
	try {
		return new URL( urlString ).hostname;
	} catch {
		return '';
	}
}

/**
 * Remove trailing slash from a URL string
 *
 * @param {string} url - The URL to process
 * @return {string} URL without trailing slash
 */
function untrailingslashit( url ) {
	return url ? url.replace( /\/+$/, '' ) : url;
}

/**
 * Escape special regex characters in a string
 *
 * @param {string} str - String to escape
 * @return {string} Escaped string safe for use in RegExp
 */
function escapeRegex( str ) {
	return str.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

/**
 * Custom hook to load site-switching commands based on search term
 *
 * @param {Object} props        - Hook properties
 * @param {string} props.search - Search term to filter sites
 * @return {Object} Object containing commands array and loading state
 */
function useSiteSwitcherCommandLoader( { search } ) {
	const [ sites, setSites ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( true );

	// Fetch sites on mount
	useEffect( () => {
		fetchSitesFromWordPressCom()
			.then( fetchedSites => {
				setSites( fetchedSites );
				setIsLoading( false );
			} )
			.catch( () => {
				setIsLoading( false );
			} );
	}, [] );

	// Generate and filter commands based on search term
	const commands = useMemo( () => {
		if ( ! sites || sites.length === 0 ) {
			return [];
		}

		const searchLower = search ? search.toLowerCase() : '';

		// Strip generic keywords from search to allow queries like "site dean" to find sites with "dean"
		const genericKeywords = [
			__( 'site', 'jetpack' ).toLowerCase(),
			__( 'switch', 'jetpack' ).toLowerCase(),
			__( 'switch site', 'jetpack' ).toLowerCase(),
		];

		let cleanedSearch = searchLower;
		genericKeywords.forEach( keyword => {
			cleanedSearch = cleanedSearch.replace(
				new RegExp( `\\b${ escapeRegex( keyword ) }\\b`, 'g' ),
				' '
			);
		} );
		cleanedSearch = cleanedSearch.trim().replace( /\s+/g, ' ' );

		// Check if the search is a prefix of any generic keyword (e.g., "swit" matches "switch")
		// If so, treat it as a generic search and show all sites
		const isGenericKeywordPrefix =
			cleanedSearch && genericKeywords.some( keyword => keyword.startsWith( cleanedSearch ) );

		// If search is empty after stripping generic keywords, or is a prefix of a generic keyword, show all sites
		const filteredSites =
			! cleanedSearch || isGenericKeywordPrefix
				? sites
				: sites.filter( site => {
						const domain = getHostnameFromURL( site.URL );
						return (
							( site.name && site.name.toLowerCase().includes( cleanedSearch ) ) ||
							domain.toLowerCase().includes( cleanedSearch )
						);
				  } );

		// Filter out sites with invalid URLs (can't navigate to them anyway)
		const validSites = filteredSites.filter( site => {
			return site.URL && getHostnameFromURL( site.URL ) !== '';
		} );

		// Exclude the current site from the list
		const currentURL = untrailingslashit( window.location.href.toLowerCase() );
		const otherSites = validSites.filter( site => {
			// Normalize site URL for comparison
			const siteURL = untrailingslashit( site.URL.toLowerCase() );
			// Check if current URL starts with site URL (handles multisite subdirectory installs)
			// e.g., current: example.com/site1/wp-admin matches site: example.com/site1
			return ! currentURL.startsWith( siteURL );
		} );

		return otherSites.map( site => {
			// Extract domain from URL for display - don't want to display the protocol.
			const domain = getHostnameFromURL( site.URL );

			const iconElement = site.icon?.img ? <img src={ site.icon.img } alt="" /> : siteLogo;

			// Use site name if available, otherwise just show domain
			const label = site.name
				? sprintf(
						/* translators: %1$s: site name, %2$s: site domain */
						__( 'Switch to %1$s (%2$s)', 'jetpack' ),
						site.name,
						domain
				  )
				: sprintf(
						/* translators: %s: site domain */
						__( 'Switch to %s', 'jetpack' ),
						domain
				  );

			return {
				name: `jetpack/switch-to-site-${ domain }`,
				label,
				icon: iconElement,
				callback: ( { close } ) => {
					try {
						window.location.href = new URL( '/wp-admin', site.URL ).href;
					} catch {
						// If URL is malformed, don't navigate
					}
					close();
				},
				keywords: [
					site.name,
					domain,
					__( 'site', 'jetpack' ),
					__( 'switch site', 'jetpack' ),
				].filter( Boolean ),
			};
		} );
	}, [ sites, search ] );

	return {
		commands,
		isLoading,
	};
}

/**
 * Component that registers the site switcher command loader
 */
function JetpackSiteSwitcher() {
	useCommandLoader( {
		name: 'jetpack/site-switcher',
		hook: useSiteSwitcherCommandLoader,
	} );

	return null;
}

// Render the site switcher into wp-admin
// This works with WordPress 6.9+ admin-wide command palette
if ( typeof window !== 'undefined' && window.wp && window.wp.element && window.wp.commands ) {
	const { createRoot, createElement } = window.wp.element;

	// Create a container for our site switcher
	const container = document.createElement( 'div' );
	container.id = 'jetpack-site-switcher';
	container.style.display = 'none'; // Hidden, as we only need the hooks to run

	// Wait for DOM to be ready
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', () => {
			document.body.appendChild( container );
			createRoot( container ).render( createElement( JetpackSiteSwitcher ) );
		} );
	} else {
		document.body.appendChild( container );
		createRoot( container ).render( createElement( JetpackSiteSwitcher ) );
	}
}
