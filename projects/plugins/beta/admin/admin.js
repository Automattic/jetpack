( function () {
	// Elements
	let prs = document.getElementById( 'section-pr' ).querySelectorAll( '.branch-card' );
	const tags = document.getElementById( 'section-tags' ).querySelectorAll( '.tag-card' );
	const search_input_prs = document.getElementById( 'search-component-prs' );
	const search_input_tags = document.getElementById( 'search-component-tags' );
	const search_close_link_prs = document.getElementById( 'search-component-prs-close' );
	const search_close_link_tags = document.getElementById( 'search-component-tags-close' );
	const activate_links = document.querySelectorAll( '.activate-branch' );
	const toggle_links = document.querySelectorAll( '.form-toggle__label' );

	const pr_index = [];
	const tag_index = [];
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

	// Build index of tags
	each.call( tags, function ( element, index ) {
		hide( element );
		element.querySelector( '.activate-branch' ).setAttribute( 'data-index', index );
		tag_index[ index ] = {
			header: element.querySelector( '.tag-card-header' ).textContent,
			key: element.getAttribute( 'data-tag' ),
			element: element,
		};
	} );

	search_input_listener( search_input_prs );
	search_input_listener( search_input_tags );
	/**
	 * @param input_area
	 */
	function search_input_listener( input_area ) {
		input_area.addEventListener( 'keyup', function ( event ) {
			const section_id = event.srcElement.id;
			const search_for = pr_to_header( input_area.value );
			const index = 'search-component-tags' === section_id ? tag_index : pr_index;

			if ( ! search_for ) {
				if ( input_area.id === 'search-component-prs' ) {
					each.call( prs, hide );
					hide( search_close_link_prs );
				}

				if ( input_area.id === 'search-component-tags' ) {
					each.call( tags, hide );
					hide( search_close_link_tags );
				}

				return;
			}

			if ( input_area.id === 'search-component-prs' ) {
				show( search_close_link_prs );
			}

			if ( input_area.id === 'search-component-tags' ) {
				show( search_close_link_tags );
			}

			index.forEach( show_found.bind( this, search_for, section_id ) );
		} );
	}

	/**
	 * @param search_for
	 * @param section
	 * @param found
	 */
	function show_found( search_for, section, found ) {
		const element = found.element;
		const header_text = parseInt( search_for ) > 0 ? found.key.toString() : found.header;
		const class_selector =
			'search-component-tags' === section ? '.tag-card-header' : '.branch-card-header';

		const found_position = header_text.indexOf( search_for );
		if ( -1 === found_position ) {
			hide( element );
			return;
		}

		element.querySelector( class_selector ).innerHTML = highlight_word( search_for, header_text );
		show( element );
	}

	// Hiding the search close link
	hide_search_close_link( search_close_link_prs );
	hide_search_close_link( search_close_link_tags );
	/**
	 * @param section
	 */
	function hide_search_close_link( section ) {
		hide( section );
		section.addEventListener( 'click', function ( event ) {
			if ( section.id === 'search-component-prs-close' ) {
				each.call( prs, hide );
				hide( section );
				search_input_prs.value = '';
			}

			if ( section.id === 'search-component-tags-close' ) {
				each.call( tags, hide );
				hide( section );
				search_input_tags.value = '';
			}

			event.preventDefault();
		} );
	}

	// Activate Links
	each.call( activate_links, function ( element, index ) {
		element.addEventListener( 'click', activate_link_click.bind( this, element ) );
	} );

	/**
	 * @param element
	 * @param event
	 */
	function activate_link_click( element, event ) {
		if ( clicked_activate ) {
			return;
		}
		if ( element.textContent == window.JetpackBeta.activate ) {
			element.parentNode.textContent = window.JetpackBeta.activating;
		} else {
			element.parentNode.textContent = window.JetpackBeta.updating;
		}

		const index = parseInt( element.getAttribute( 'data-index' ) );

		prs = Array.prototype.filter.call( prs, function ( pr, i ) {
			return index === i ? false : true;
		} );
		disable_activete_branch_links();
		trackEvent( element );
		clicked_activate = true;
	}

	/**
	 *
	 */
	function disable_activete_branch_links() {
		each.call( activate_links, function ( element, index ) {
			element.addEventListener( 'click', function ( event ) {
				event.preventDefault();
			} );
			element.removeEventListener( 'click', activate_link_click.bind( this, element ) );
			element.classList.add( 'is-disabled' );
		} );
	}

	// Toggle Links
	each.call( toggle_links, function ( element, index ) {
		element.addEventListener( 'click', toggle_link_click.bind( this, element ) );
	} );
	/**
	 * @param element
	 * @param event
	 */
	function toggle_link_click( element, event ) {
		if ( clicked_toggle ) {
			return;
		}
		clicked_toggle = true;
		element.classList.toggle( 'is-active' );
		trackEvent( element );
	}

	// Helper functions
	/**
	 * @param search
	 */
	function pr_to_header( search ) {
		return search
			.replace( '/', ' / ' )
			.replace( new RegExp( '\\-', 'g' ), ' ' )
			.replace( /  +/g, ' ' )
			.toLowerCase();
	}

	/**
	 * @param word
	 * @param phrase
	 */
	function highlight_word( word, phrase ) {
		const regExp = new RegExp( word, 'g' );
		const replace = '<span class="highlight">' + word + '</span>';
		return phrase.replace( regExp, replace );
	}

	/**
	 * @param element
	 */
	function hide( element ) {
		element.style.display = 'none';
	}

	/**
	 * @param element
	 */
	function show( element ) {
		element.style.display = '';
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
