// ==UserScript==
// @name         Jetpack Live Branches
// @namespace    https://wordpress.com/
// @version      1.4
// @description  Adds links to PRs pointing to Jurassic Ninja sites for live-testing a changeset
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @match        https://github.com/Automattic/jetpack/pull/*
// ==/UserScript==

( function() {
	const $ = jQuery.noConflict();
	doit();

	function doit() {
		const markdownBody = document.querySelectorAll( '.markdown-body' )[ 0 ];
		const branch = jQuery( '.head-ref' ).text();
		const branchIsForked = branch.includes( ':' );
		const branchIsMerged = $( '.gh-header-meta .State' ).text().trim() === 'Merged';
		const query = 'jetpack-beta&branch=' + branch + '&shortlived&wp-debug-log';
		const base = 'https://jurassic.ninja/create?';
		let link = base + query;
		const canLiveTestText =
			'<div id="jetpack-live-branches">' +
			'<h2>Jetpack Live Branches</h2>' +
			'<p style="height:3em;" ><a id="jetpack-beta-branch-link" target="_blank" rel="nofollow noopener" href="' + link + '">' + link + '</a></p>' +
			'<ul>' +
			'<li class="task-list-item enabled"><input type="checkbox" name="shortlived" checked class="task-list-item-checkbox">Launch a shortlived site</li>' +
			'<li class="task-list-item enabled"><input type="checkbox" name="wp-debug-log" checked class="task-list-item-checkbox">Launch sites with WP_DEBUG and WP_DEBUG_LOG set to true</li>' +
			'<li class="task-list-item enabled"><input type="checkbox" name="gutenberg" class="task-list-item-checkbox">Launch with Gutenberg installed</li>' +
			'<li class="task-list-item enabled"><input type="checkbox" name="woocommerce" class="task-list-item-checkbox">Launch with WooCommerce installed</li>' +
			'<li class="task-list-item enabled"><input type="checkbox" name="code-snippets" class="task-list-item-checkbox">Launch with Code Snippets installed</li>' +
			'<li class="task-list-item enabled"><input type="checkbox" name="wp-rollback" class="task-list-item-checkbox">Launch with WP Rollback installed</li>' +
			'<li class="task-list-item enabled"><input type="checkbox" name="wp-downgrade" class="task-list-item-checkbox">Launch with WP Downgrade installed</li>' +
			'</ul>' +
			'</div>';
		const branchIsForkedText =
			'<div id="jetpack-live-branches">' +
			'<h2>Jetpack Live Branches</h2>' +
			'<p><strong>This branch can\'t be tested live because it comes from a forked version of this repo.</p>' +
			'</div>';
		const branchIsMergedText =
			'<div id="jetpack-live-branches">' +
			'<h2>Jetpack Live Branches</h2>' +
			'<p><strong>This branch is already merged.</p>' +
			'</div>';
		if ( ! branchIsForked && ! branchIsMerged ) {
			appendHtml( markdownBody, canLiveTestText );
		} else if ( ! branchIsMerged ) {
			appendHtml( markdownBody, branchIsForkedText );
		} else {
			appendHtml( markdownBody, branchIsMergedText );
		}

		function appendHtml( el, str ) {
			const div = document.createElement( 'div' );
			const $el = $( el );
			$( div ).append( str );
			$el.append( $( div ).children().get( 0 ) );

			$el.find( 'input[type=checkbox]' ).change( toggle );
		}

		function toggle( e ) {
			e.stopPropagation();
			e.preventDefault();
			const $link = $( '#jetpack-beta-branch-link' );
			const $this = $( this );
			const name = $this.attr( 'name' );
			const checked = $this.is( ':checked' );

			const query_array = $link.attr( 'href' ).split( '?' )[ 1 ].split( '&' );

			if ( checked ) {
				query_array.push( name );
				link = base + query_array.join( '&' );
			} else {
				link = base + query_array.filter( function( item ) {
					return item !== name;
				} ).join( '&' );
			}
			$link.attr( 'href', link );
			$link.text( link );
		}
	}
} )();
