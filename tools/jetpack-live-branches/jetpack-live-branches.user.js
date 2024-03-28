// ==UserScript==
// @name         Jetpack Live Branches
// @namespace    https://wordpress.com/
// @version      1.36
// @description  Adds links to PRs pointing to Jurassic Ninja sites for live-testing a changeset
// @grant        GM_xmlhttpRequest
// @connect      betadownload.jetpack.me
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @match        https://github.com/Automattic/jetpack/pull/*
// @updateURL    https://github.com/Automattic/jetpack/raw/trunk/tools/jetpack-live-branches/jetpack-live-branches.user.js
// @downloadURL  https://github.com/Automattic/jetpack/raw/trunk/tools/jetpack-live-branches/jetpack-live-branches.user.js
// ==/UserScript==

// Need to declare "jQuery" for linting within TamperMonkey, but in the monorepo it's already declared.
// eslint-disable-next-line no-redeclare
/* global jQuery */

( function () {
	const $ = jQuery.noConflict();
	const markdownBodySelector = '.pull-discussion-timeline .markdown-body';
	let pluginsList = null;

	const style = document.createElement( 'style' );
	style.innerHTML = `
		#jetpack-live-branches .optionslist {
			list-style: none;
			padding-left: 0;
			margin-top: 24px;
			display: flex;
			flex-wrap: wrap;
		}

		#jetpack-live-branches label {
			font-weight: inherit;
		}

		#jetpack-live-branches label.disabled {
			color: var( --color-fg-muted, #7d8590 );
		}
	`;

	// Watch for relevant DOM changes that indicate we need to re-run `doit()`:
	// - Adding a new `.markdown-body`.
	// - Removing `#jetpack-live-branches`.
	const observer = new MutationObserver( list => {
		for ( const m of list ) {
			for ( const n of m.addedNodes ) {
				if (
					( n.matches && n.matches( markdownBodySelector ) ) ||
					( n.querySelector && n.querySelector( markdownBodySelector ) )
				) {
					doit();
					return;
				}
			}
			for ( const n of m.removedNodes ) {
				if (
					n.id === 'jetpack-live-branches' ||
					( n.querySelector && n.querySelector( '#jetpack-live-branches' ) )
				) {
					doit();
					return;
				}
			}
		}
	} );
	observer.observe( document, { subtree: true, childList: true } );

	// Run it on load too.
	doit();

	/**
	 * Determine the current repo.
	 *
	 * Currently looks at the URL, expecting it to match a `@match` pattern from the script header.
	 *
	 * @returns {string|null} Repo name.
	 */
	function determineRepo() {
		const m = location.pathname.match( /^\/([^/]+\/[^/]+)\/pull\// );
		return m && m[ 1 ] ? decodeURIComponent( m[ 1 ] ) : null;
	}

	/** Function. */
	function doit() {
		const markdownBody = document.querySelectorAll( markdownBodySelector )[ 0 ];
		if ( ! markdownBody || markdownBody.querySelector( '#jetpack-live-branches' ) ) {
			// No body or Live Branches is already there, no need to do it again.
			return;
		}

		const host = 'https://jurassic.ninja';
		const currentBranch = jQuery( '.head-ref:first' ).text();
		const branchStatus = $( '.gh-header-meta .State' ).text().trim();
		const repo = determineRepo();

		if ( branchStatus === 'Merged' ) {
			const contents = `
				<p><strong>This branch is already merged.</strong></p>
				<p><a target="_blank" rel="nofollow noopener" href="${ getLink()[ 0 ] }">
					Test with <code>trunk</code> branch instead.
				</a></p>
				<p>Note: You need to be Logged in to WordPress.com to create a test site.</p>
			`;
			appendHtml( markdownBody, contents );
		} else if ( ! repo ) {
			appendHtml(
				markdownBody,
				'<p><strong>Cannot determine the repository for this PR.</strong></p>'
			);
		} else {
			if ( ! pluginsList ) {
				pluginsList = dofetch(
					// prettier-ignore
					`https://betadownload.jetpack.me/query-branch.php?repo=${ encodeURIComponent( repo ) }&branch=${ encodeURIComponent( currentBranch ) }`
				);
			}
			pluginsList
				.then( body => {
					const plugins = [];

					if ( body.hasOwnProperty( 'plugins' ) ) {
						const labels = new Set(
							$.map( $( '.js-issue-labels a.IssueLabel' ), e => $( e ).data( 'name' ) )
						);
						Object.keys( body.plugins ).forEach( k => {
							const data = body.plugins[ k ];
							plugins.push( {
								name: `branches.${ k }`,
								value: currentBranch,
								label: encodeHtmlEntities( data.name ),
								checked:
									data.pr !== null && data.labels && data.labels.some( l => labels.has( l ) ),
								disabled:
									data.pr === null ? `${ data.name } has not been built for this PR` : false,
							} );
						} );
						if ( ! plugins.length ) {
							throw new Error( `No plugins are configured for ${ repo }` );
						}
						plugins.sort( ( a, b ) => a.label.localeCompare( b.label ) );

						if ( ! plugins.some( p => ! p.disabled ) ) {
							appendHtml(
								markdownBody,
								'<p><strong>No plugins have been built for this PR.</strong> (<a href="#" class="refresh">refresh</a>)</p>'
							);
							return;
						}
					} else {
						throw new Error( 'Invalid response from server' );
					}

					const contents = `
					<details>
						<summary>Expand for JN site options:</summary>
						<h4>Test Plugins</h4>
						${ getOptionsList( plugins, 33 ) }
						<h4>Settings</h4>
						${ getOptionsList(
							[
								{
									label: 'A shortlived site',
									name: 'shortlived',
								},
								{
									checked: true,
									label: '<code>WP_DEBUG</code> and <code>WP_DEBUG_LOG</code> set to true',
									name: 'wp-debug-log',
								},
								{
									label: 'Enable WordPress.com Sandbox Access',
									name: 'dev-pool',
								},
								{
									checked: true,
									label: 'Drop-in Cache Plugins',
									name: 'cache-drop-in',
									invert: true,
									value: 'false',
								},
								{
									label: 'Multisite based on subdirectories',
									name: 'subdir_multisite',
								},
								{
									label: 'Pre-generate content',
									name: 'content',
								},
								{
									label: 'Pre-generate CRM data',
									name: 'jpcrm-populate-crm-data',
								},
								{
									label: 'Pre-generate CRM Woo data',
									name: 'jpcrm-populate-woo-data',
								},
								{
									label: '<code>xmlrpc.php</code> unavailable',
									name: 'blockxmlrpc',
								},
							],
							100
						) }
						<h4>Plugins</h4>
						${ getOptionsList(
							[
								{
									label: 'Jetpack',
									name: 'nojetpack',
									checked: true,
									invert: true,
								},
								{
									label: 'WordPress Beta Tester',
									name: 'wordpress-beta-tester',
								},
								{
									label: 'Gutenberg',
									name: 'gutenberg',
								},
								{
									label: 'Classic Editor',
									name: 'classic-editor',
								},
								{
									label: 'AMP',
									name: 'amp',
								},
								{
									label: 'WooCommerce',
									name: 'woocommerce',
								},
								{
									label: 'WooCommerce Beta Tester',
									name: 'woocommerce-beta-tester',
								},
								{
									label: 'Config Constants',
									name: 'config-constants',
								},
								{
									label: 'Code Snippets',
									name: 'code-snippets',
								},
								{
									label: 'WP Rollback',
									name: 'wp-rollback',
								},
								{
									label: 'WP Downgrade',
									name: 'wp-downgrade',
								},
								{
									label: 'WP Super Cache',
									name: 'wp-super-cache',
								},
								{
									label: 'WP Job Manager',
									name: 'wp-job-manager',
								},
								{
									label: 'Jetpack Debug Helper',
									name: 'jetpack-debug-helper',
								},
							],
							33
						) }

						<h4>Themes</h4>
						${ getOptionsList(
							[
								{
									label: 'TT1-Blocks FSE Theme',
									name: 'tt1-blocks',
								},
							],
							33
						) }
					</details>
					<p>
						<a id="jetpack-beta-branch-link" target="_blank" rel="nofollow noopener" href="#">…</a>
					</p>
					<p>Note: You need to be Logged in to WordPress.com to create a test site.</p>
					`;
					appendHtml( markdownBody, contents );
					updateLink();
				} )
				.catch( e => {
					pluginsList = null;
					appendHtml(
						markdownBody,
						// prettier-ignore
						`<p><strong>Error while fetching data for live testing: ${ encodeHtmlEntities( e.message ) }.</strong> (<a href="#" class="refresh">retry</a>)</p>`
					);
				} );
		}

		/**
		 * Fetch a URL.
		 *
		 * TamperMonkey on Chrome can't use `fetch()` due to CSP.
		 *
		 * @param {string} url - URL.
		 * @returns {Promise} Promise. Resolves with the JSON content from `url`.
		 */
		function dofetch( url ) {
			const do_xmlhttpRequest = window.GM_xmlhttpRequest ?? window.GM?.xmlhttpRequest ?? null;
			if ( do_xmlhttpRequest ) {
				return new Promise( ( resolve, reject ) => {
					do_xmlhttpRequest( {
						method: 'GET',
						url: url,
						onload: r => {
							if ( r.status < 100 || r.status > 599 ) {
								reject( new TypeError( `Network request failed (status ${ r.status })` ) );
								return;
							}
							resolve( JSON.parse( r.responseText ) );
						},
						ontimeout: () => reject( new TypeError( 'Network request timed out' ) ),
						onabort: () => reject( new TypeError( 'Network request aborted' ) ),
						onerror: () => reject( new TypeError( 'Network request failed' ) ),
					} );
				} );
			}

			// Fall back to fetch.
			return fetch( url ).then( r => r.json() );
		}

		/**
		 * Encode necessary HTML entities in a string.
		 *
		 * @param {string} s - String to encode.
		 * @returns {string} Encoded string.
		 */
		function encodeHtmlEntities( s ) {
			return s.replace( /[&<>"']/g, m => `&#${ m.charCodeAt( 0 ) };` );
		}

		/**
		 * Build the JN create URI.
		 *
		 * @returns {string} URI.
		 */
		function getLink() {
			const query = [ 'jetpack-beta' ];
			$(
				'#jetpack-live-branches input[type=checkbox]:checked:not([data-invert]), #jetpack-live-branches input[type=checkbox][data-invert]:not(:checked)'
			).each( ( i, input ) => {
				if ( input.value ) {
					query.push( encodeURIComponent( input.name ) + '=' + encodeURIComponent( input.value ) );
				} else {
					if (
						input.name === 'jpcrm-populate-crm-data' ||
						input.value === 'jpcrm-populate-woo-data'
					) {
						query.push( encodeURIComponent( 'jpcrm' ) );
					}
					query.push( encodeURIComponent( input.name ) );
				}
			} );
			// prettier-ignore
			return [ `${ host }/create?${ query.join( '&' ).replace( /%(2F|5[BD])/g, m => decodeURIComponent( m ) ) }`, query ];
		}

		/**
		 * Build HTML for a single option checkbox.
		 *
		 * @param {object} opts - Options.
		 * @param {string} opts.label - Checkbox label HTML.
		 * @param {string} opts.name - Checkbox name.
		 * @param {string} [opts.value] - Checkbox value, if any.
		 * @param {boolean} [opts.checked] - Whether the checkbox is default checked.
		 * @param {boolean|string} [opts.disabled] - Whether the checkbox is disabled. If a string, the string is used as a title attribute on the label.
		 * @param {boolean} [opts.invert] - Whether the sense of the checkbox is inverted.
		 * @param {number} columnWidth - Column width.
		 * @returns {string} HTML.
		 */
		function getOption(
			{ disabled = false, checked = false, invert = false, value = '', label, name },
			columnWidth
		) {
			// prettier-ignore
			return `
				<li style="min-width: ${ columnWidth }%">
					<label class="${ disabled ? 'disabled' : '' }" ${ typeof disabled === 'string' ? 'title="' + encodeHtmlEntities( disabled ) + '"' : '' }>
						<input type="checkbox" name="${ encodeHtmlEntities( name ) }" value="${ encodeHtmlEntities( value ) }"${ checked ? ' checked' : '' }${ disabled ? ' disabled' : '' }${ invert ? ' data-invert' : '' }>
						${ label }
					</label>
				</li>
			`;
		}

		/**
		 * Build HTML for a set of option checkboxes.
		 *
		 * @param {object[]} options - Array of options for `getOption()`.
		 * @param {number} columnWidth - Column width.
		 * @returns {string} HTML.
		 */
		function getOptionsList( options, columnWidth ) {
			// prettier-ignore
			return `
				<ul class="optionslist">
					${ options.map( option => getOption( option, columnWidth ) ).join( '' ) }
				</ul>
			`;
		}

		/**
		 * Append HTML to the element.
		 *
		 * Also registers `onInputChanged()` as a change handler for all checkboxes in the HTML.
		 *
		 * @param {HTMLElement} el - Element.
		 * @param {string} contents - HTML to append.
		 */
		function appendHtml( el, contents ) {
			const $el = $( el );
			const liveBranches = $( '<div id="jetpack-live-branches" />' ).append(
				`<h2>Jetpack Live Branches</h2> ${ contents }`
			);
			$( '#jetpack-live-branches' ).remove();
			liveBranches.prepend( style );
			$el.append( liveBranches );
			liveBranches.find( 'input[type=checkbox]' ).on( 'change', onInputChanged );
			liveBranches.find( 'a.refresh' ).on( 'click', onRefreshClick );
		}

		/**
		 * Change handler. Updates the link.
		 *
		 * @param {Event} e - Event object.
		 */
		function onInputChanged( e ) {
			e.stopPropagation();
			e.preventDefault();
			if ( e.target.checked ) {
				e.target.setAttribute( 'checked', true );
			} else {
				e.target.removeAttribute( 'checked' );
			}
			updateLink();
		}

		/**
		 * Refresh link click handler.
		 *
		 * @param {Event} e - Event object.
		 * @returns {false} False.
		 */
		function onRefreshClick( e ) {
			e.stopPropagation();
			e.preventDefault();
			pluginsList = null;
			$( '#jetpack-live-branches' ).remove();
			doit();
			return false;
		}

		/**
		 * Update the link.
		 */
		function updateLink() {
			const $link = $( '#jetpack-beta-branch-link' );
			const [ url, query ] = getLink();

			if ( url.match( /[?&]branch(es\.[^&=]*)?=/ ) ) {
				if (
					query.includes( 'jpcrm-populate-crm-data' ) &&
					! url.match( /[?&]branches\.zero-bs-crm/ )
				) {
					// /jpcrm-populate-crm-data/
					$link
						.attr( 'href', null )
						.text( 'Select the Jetpack CRM plugin in order to populate with CRM data' );
				} else if (
					query.includes( 'jpcrm-populate-woo-data' ) &&
					! query.includes( 'woocommerce' )
				) {
					$link
						.attr( 'href', null )
						.text( 'Select the WooCommerce plugin in order to populate with CRM Woo data' );
				} else {
					$link.attr( 'href', url ).text( url );
				}
			} else {
				$link.attr( 'href', null ).text( 'Select at least one plugin to test' );
			}
		}
	}
} )();
