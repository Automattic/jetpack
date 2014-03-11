
( function( window, $, items, models, views, i18n ) {
	'use strict';

	var modules, list_table, handle_module_tag_click, $the_table, $the_filters, $the_search, $jp_frame, show_modal, hide_modal, set_modal_tab;

	$the_table   = $( '.wp-list-table.jetpack-modules' );
	$the_filters = $( '.navbar-form' );
	$the_search  = $( '#srch-term-search-input' );
	$jp_frame    = $( '.jp-frame' );

	modules = new models.Modules( {
		items : items
	} );

	list_table = new views.List_Table( {
		el    : '#the-list',
		model : modules
	} );

	// Kick off an initial redraw.
	modules.trigger( 'change' );

	// Handle the filtering of modules.
	handle_module_tag_click = function( event ) {
		// Switch the item in the subsubsub list that's flagged as current.
		$( '.subsubsub' ).find( 'a[data-title="' + $(this).data('title') + '"]' ).addClass( 'current' )
			.closest( 'li' ).siblings().find( 'a.current' ).removeClass( 'current' );

		event.preventDefault();
		modules.trigger( 'change' );
	};

	$( '.subsubsub a' ).on( 'click', { modules : modules }, handle_module_tag_click );

	show_modal = function( module, tab ) {
		$jp_frame.children( '.modal, .shade' ).show();
		set_modal_tab( tab );
	};

	hide_modal = function() {
		$jp_frame.children( '.modal, .shade' ).hide();
		set_modal_tab( null );
	};

	$jp_frame.on( 'click', '.modal header .close, .shade', hide_modal );

	set_modal_tab = function( tab ) {
		$jp_frame.find( '.modal .active' ).removeClass( 'active' );
		switch ( tab ) {
			case 'learn-more':
				$jp_frame.find( '.modal .learn-more a' ).addClass( 'active' );
				$jp_frame.children( '.modal' ).trigger( 'learn-more' );
				break;
			case 'config':
				$jp_frame.find( '.modal .config a' ).addClass( 'active' );
				$jp_frame.children( '.modal' ).trigger( 'config' );
				break;
			default:
				break;
		}
	};

	$jp_frame.on( 'click', '.modal header ul li a', function( event ){
		event.preventDefault();
		set_modal_tab( $(this).data('tab') );
	} );

	$jp_frame.children( '.modal' ).on( 'learn-more', function() {
		$(this).find('.content').html( items.latex.long_description );
	} );

	$jp_frame.children( '.modal' ).on( 'config', function() {
		$(this).find('.content').html( 'config' );
	} );

	$the_table.on( 'click', '.info a', { modules : modules }, function( event ) {
		event.preventDefault();
		show_modal( {}, 'learn-more' );
	} );

	$the_table.on( 'click', '.configure a', { modules : modules }, function( event ) {
		event.preventDefault();
		show_modal( {}, 'config' );
	} );

	$the_filters.on( 'click', '.button-group .button', { modules : modules }, function( event ) {
		event.preventDefault();
		$(this).addClass('active').siblings('.active').removeClass('active');
		modules.trigger( 'change' );
	} );

	$the_search.on( 'keyup', function() {
		modules.trigger( 'change' );
	} );

	$the_search.prop( 'placeholder', i18n.search_placeholder );

} ) ( this, jQuery, window.jetpackModulesData.modules, this.jetpackModules.models, this.jetpackModules.views, window.jetpackModulesData.i18n );
