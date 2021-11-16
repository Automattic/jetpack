( function () {
	// Elements
	let prs = document.getElementById( 'section-pr' )?.querySelectorAll( '.branch-card' );
	if ( ! prs ) {
		return; // Return early if on main plugin selection screen.
	}
	const releases = document.getElementById( 'section-releases' ).querySelectorAll( '.branch-card' );
	const search_input_prs = document.getElementById( 'search-component-prs' );
	const search_input_releases = document.getElementById( 'search-component-releases' );
	const search_close_link_prs = document.getElementById( 'search-component-prs-close' );
	const search_close_link_releases = document.getElementById( 'search-component-releases-close' );
	const activate_links = document.querySelectorAll( '.activate-branch' );
	const toggle_links = document.querySelectorAll( '.form-toggle__label' );

	const pr_index = [];
	const release_index = [];
	const each = Array.prototype.forEach;
	let clicked_activate = false;
	let clicked_toggle = false;

	// Build index of prs
	each.call( prs, function ( element, index ) {
		hide( element );
		element.querySelector( '.activate-branch' ).setAttribute( 'data-index', index );
		pr_index[ index ] = {
			header: element.querySelector( '.branch-card-header' ).textContent,
			key: element.getAttribute( 'data-pr' ),
			element: element,
		};
	} );

	// Build index of releases
	each.call( releases, function ( element, index ) {
		hide( element );
		element.querySelector( '.activate-branch' ).setAttribute( 'data-index', index );
		release_index[ index ] = {
			header: element.querySelector( '.branch-card-header' ).textContent,
			key: element.getAttribute( 'data-release' ),
			element: element,
		};
	} );

	search_input_listener( search_input_prs );
	search_input_listener( search_input_releases );
	/**
	 * Attaches keyup event listener to the search inputs.
	 *
	 * @param {object} input_area - Search input DOM Element object.
	 */
	function search_input_listener( input_area ) {
		if ( ! input_area ) {
			return;
		}

		input_area.addEventListener( 'keyup', function ( event ) {
			const section_id = event.srcElement.id;
			const search_for = pr_to_header( input_area.value );
			const index = 'search-component-releases' === section_id ? release_index : pr_index;

			if ( ! search_for ) {
				if ( input_area.id === 'search-component-prs' ) {
					each.call( prs, hide );
					hide( search_close_link_prs );
				}

				if ( input_area.id === 'search-component-releases' ) {
					each.call( releases, hide );
					hide( search_close_link_releases );
				}

				return;
			}

			if ( input_area.id === 'search-component-prs' ) {
				show( search_close_link_prs );
			}

			if ( input_area.id === 'search-component-releases' ) {
				show( search_close_link_releases );
			}

			index.forEach( show_found.bind( this, search_for, section_id ) );
		} );
	}

	/**
	 * Displays matching search results.
	 *
	 * @param {string} search_for - Search input term.
	 * @param {string} section    - Which search section to display result in (pr/release).
	 * @param {object} found      - A matching prs or releases array item from the search.
	 */
	function show_found( search_for, section, found ) {
		const element = found.element;
		const header_text = /^ *[0-9]+ *$/.test( search_for ) ? `${ found.key }` : found.header;
		const class_selector = '.branch-card-header';

		const found_position = header_text.indexOf( search_for );
		if ( -1 === found_position ) {
			hide( element );
			return;
		}

		element.querySelector( class_selector ).innerHTML = highlight_word( search_for, header_text );
		show( element );
	}

	hide_search_close_link( search_close_link_prs );
	hide_search_close_link( search_close_link_releases );
	/**
	 * Attaches click event listener that controls hiding search results and clearing search inputs.
	 * Also handles hiding the close search icon when search input is empty.
	 *
	 * @param {object} section - DOM Element object for a close search icon.
	 */
	function hide_search_close_link( section ) {
		if ( ! section ) {
			return;
		}

		hide( section );
		section.addEventListener( 'click', function ( event ) {
			if ( section.id === 'search-component-prs-close' ) {
				each.call( prs, hide );
				hide( section );
				search_input_prs.value = '';
			}

			if ( section.id === 'search-component-releases-close' ) {
				each.call( releases, hide );
				hide( section );
				search_input_releases.value = '';
			}

			event.preventDefault();
		} );
	}

	// Attach click event listeners to all of the 'Activate' links.
	each.call( activate_links, function ( element ) {
		element.addEventListener( 'click', activate_link_click.bind( this, element ) );
	} );
	/**
	 * Handles click event for the 'Activate' links.
	 *
	 * @param {object} element - The 'Activate' link element being clicked.
	 */
	function activate_link_click( element ) {
		if ( clicked_activate ) {
			return;
		}
		if ( element.textContent === window.JetpackBeta.activate ) {
			element.parentNode.textContent = window.JetpackBeta.activating;
		} else {
			element.parentNode.textContent = window.JetpackBeta.updating;
		}

		const index = parseInt( element.getAttribute( 'data-index' ) );

		prs = Array.prototype.filter.call( prs, function ( pr, i ) {
			return index === i ? false : true;
		} );
		disable_activate_branch_links();
		trackEvent( element );
		clicked_activate = true;
	}

	/**
	 * Disables the 'Activate' links.
	 */
	function disable_activate_branch_links() {
		each.call( activate_links, function ( element ) {
			element.addEventListener( 'click', function ( event ) {
				event.preventDefault();
			} );
			element.removeEventListener( 'click', activate_link_click.bind( this, element ) );
			element.classList.add( 'is-disabled' );
		} );
	}

	// Attaches click event listener to all toggle links.
	each.call( toggle_links, function ( element ) {
		element.addEventListener( 'click', toggle_link_click.bind( this, element ) );
	} );
	/**
	 * Handles click event for one of the toggle links (e.g. Autoupdates switch).
	 *
	 * @param {object} element - The toggle link element being clicked.
	 */
	function toggle_link_click( element ) {
		if ( clicked_toggle ) {
			return;
		}
		clicked_toggle = true;
		element.classList.toggle( 'is-active' );
		trackEvent( element );
	}

	// Helper functions

	/**
	 * Massage search input to match pr/release 'header'.
	 *
	 * @param   {string} search - The raw search input text.
	 * @returns {string} The massaged search string.
	 */
	function pr_to_header( search ) {
		return search
			.replace( /\//g, ' / ' )
			.replace( /-/g, ' ' )
			.replace( /  +/g, ' ' )
			.toLowerCase()
			.trim();
	}

	/**
	 * Highlights text in search results matching the search input text.
	 *
	 * @param {string} word   - The search input term.
	 * @param {string} phrase - The full pr/release header text.
	 * @returns {string} Search result with span wrapping matching word (search input) for styling.
	 */
	function highlight_word( word, phrase ) {
		const replace = '<span class="highlight">' + word + '</span>';
		return phrase.replace( word, replace );
	}

	/**
	 * Sets an element to display:none
	 *
	 * @param {object} element - DOM Element object.
	 */
	function hide( element ) {
		element.classList.add( 'branch-card-hide' );
	}

	/**
	 * Unsets/clears an element's display value.
	 *
	 * @param {object} element - DOM Element object.
	 */
	function show( element ) {
		element.classList.remove( 'branch-card-hide' );
	}

	/**
	 * Track user event such as a click on a button or a link.
	 *
	 * @param {string} element - Element that was clicked.
	 */
	function trackEvent( element ) {
		// Do not track anything if TOS have not been accepted yet and the file isn't enqueued.
		if ( ! window.jpTracksAJAX || 'function' !== typeof window.jpTracksAJAX.record_ajax_event ) {
			return;
		}

		const eventName = element.getAttribute( 'data-jptracks-name' );
		const eventProp = element.getAttribute( 'data-jptracks-prop' );

		window.jpTracksAJAX.record_ajax_event( eventName, 'click', eventProp );
	}
} )();
