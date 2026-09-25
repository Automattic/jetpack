( function ( window, $, items, models, views, i18n, modalinfo, nonces ) {
	'use strict';

	var modules, list_table, handle_facet_click, $the_filters, $the_search, $bulk_button;

	$the_filters = $( '.navbar-form' );
	$the_search = $( '#srch-term-search-input' );
	$bulk_button = $( '#doaction' );

	modules = new models.Modules( {
		items: items,
	} );

	// eslint-disable-next-line no-unused-vars -- Does this have side effects?
	list_table = new views.List_Table( {
		el: '#the-list',
		model: modules,
	} );

	// Kick off an initial redraw.
	modules.trigger( 'change' );

	// Handle the filtering of modules. The tag list (".subsubsub") and the
	// "Purpose" list (".purpose-filter") are independent single-select facets
	// that share this behaviour and combine with one another.
	handle_facet_click = function ( event ) {
		event.preventDefault();

		var $link = $( this );

		// Ignore facets greyed out because they have no matches under the current filters.
		if ( $link.closest( 'li' ).hasClass( 'is-empty' ) ) {
			return;
		}

		// Move the "current" selection within this facet list only.
		var $list = $link.closest( '.subsubsub, .purpose-filter' );
		$list.find( 'li.current' ).removeClass( 'current' );
		$link.closest( 'li' ).addClass( 'current' );

		modules.trigger( 'change' );
	};

	$( '.subsubsub a, .purpose-filter a' ).on( 'click', handle_facet_click );

	$the_filters.on( 'click', '.button-group .button', { modules: modules }, function ( event ) {
		event.preventDefault();

		// Each button group is an independent, single-select facet: activating a
		// button clears only its siblings. State and Purpose are separate groups,
		// so their selections combine rather than replacing one another.
		$( this ).addClass( 'active' ).siblings( '.active' ).removeClass( 'active' );

		modules.trigger( 'change' );
	} );

	$the_search.on(
		'keyup search',
		// Debounce so we re-render (and history.replaceState) once the user
		// pauses typing rather than on every keystroke. This keeps the ~50-row
		// rebuild off the critical path and avoids Safari's replaceState rate limit.
		window._.debounce( function ( e ) {
			// Don't trigger change on tab, since it's only used for accessibility
			// anyway, and will remove all checked boxes
			if ( e.code !== 'Tab' ) {
				modules.trigger( 'change' );
			}
		}, 200 )
	);

	$the_search.prop( 'placeholder', i18n.search_placeholder );

	$bulk_button.on( 'click', function ( event ) {
		var selectedModules = $( '.jetpack-modules-list-table-form' ).serialize(),
			selectedAction = $( this ).siblings( 'select' ).val(),
			url;

		if ( selectedModules.length && '-1' !== selectedAction ) {
			url = 'admin.php?page=jetpack&action=' + encodeURIComponent( selectedAction );
			url += '&' + selectedModules;
			url += '&_wpnonce=' + encodeURIComponent( nonces.bulk );

			window.location.href = url;
		} else {
			// Possibly add in an alert here explaining why nothing's happening?
		}

		event.preventDefault();
	} );
} )(
	window,
	jQuery,
	window.jetpackModulesData.modules,
	window.jetpackModules.models,
	window.jetpackModules.views,
	window.jetpackModulesData.i18n,
	window.jetpackModulesData.modalinfo,
	window.jetpackModulesData.nonces
);
