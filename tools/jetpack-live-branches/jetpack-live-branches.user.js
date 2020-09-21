// ==UserScript==
// @name         Jetpack Live Branches
// @namespace    https://wordpress.com/
// @version      1.16
// @description  Adds links to PRs pointing to Jurassic Ninja sites for live-testing a changeset
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @match        https://github.com/Automattic/jetpack/pull/*
// ==/UserScript==

/* global jQuery */

( function () {
	const $ = jQuery.noConflict();
	doit();

	function doit() {
		const markdownBody = document.querySelectorAll( '.markdown-body' )[ 0 ];
		const currentBranch = jQuery( '.head-ref:first' ).text();
		const branchIsForked = currentBranch.includes( ':' );
		const branchStatus = $( '.gh-header-meta .State' ).text().trim();

		if ( branchStatus === 'Merged' ) {
			const contents = `
				<p><strong>This branch is already merged.</strong></p>
				<p><a target="_blank" rel="nofollow noopener" href="${ getLink( 'master' ) }">
					Test with <code>master</code> branch instead.
				</a></p>
			`;
			appendHtml( markdownBody, contents );
		} else if ( branchStatus === 'Draft' ) {
			appendHtml(
				markdownBody,
				'<p><strong>This branch is a draft. You can open live branches only from open pull requests.</strong></p>'
			);
		} else if ( branchIsForked ) {
			appendHtml(
				markdownBody,
				"<p><strong>This branch can't be tested live because it comes from a forked version of this repo.</strong></p>"
			);
		} else {
			const contents = `
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
							label: 'Multisite based on subdomains',
							name: 'subdomain_multisite',
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
							label: 'WP Log Viewer',
							name: 'wp-log-viewer',
						},
						{
							label: 'WP Job Manager',
							name: 'wp-job-manager',
						},
						{
							label: 'Jetpack CRM',
							name: 'zero-bs-crm',
						},
					],
					33
				) }
				<p>
					<a id="jetpack-beta-branch-link" target="_blank" rel="nofollow noopener" href="#">…</a>
				</p>
			`;
			appendHtml( markdownBody, contents );
			updateLink();
		}

		function getLink( branch ) {
			const query = [ 'jetpack-beta', `branch=${ branch }` ];
			$( '#jetpack-live-branches input[type=checkbox]:checked' ).each( ( i, input ) => {
				query.push( input.name );
			} );
			return `https://jurassic.ninja/create?${ query.join( '&' ) }`;
		}

		function getOption( { checked = false, label, name }, columnWidth ) {
			return `
			<li style="min-width: ${ columnWidth }%">
				<label style="font-weight: inherit; ">
					<input type="checkbox" name="${ name }" ${ checked ? 'checked' : '' }>
					${ label }
				</label>
			</li>
			`;
		}

		function getOptionsList( options, columnWidth ) {
			return `
				<ul style="list-style: none; padding-left: 0; display: flex; flex-wrap: wrap;">
					${ options
						.map( option => {
							return getOption( option, columnWidth );
						} )
						.join( '' ) }
				</ul>
			`;
		}

		function appendHtml( el, contents ) {
			const $el = $( el );
			const liveBranches = $( '<div id="jetpack-live-branches" />' ).append(
				`<h2>Jetpack Live Branches</h2> ${ contents }`
			);
			$el.append( liveBranches );
			$( 'body' ).on( 'change', $el.find( 'input[type=checkbox]' ), onInputChanged );
		}

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

		function updateLink() {
			const link = getLink( currentBranch );
			$( '#jetpack-beta-branch-link' ).attr( 'href', link ).text( link );
		}
	}
} )();
