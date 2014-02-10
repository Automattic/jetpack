
( function( window, $, items, models, views ) {
	'use strict';

	var modules, list_table, handle_module_tag_click, $the_table;

	$the_table = $('.wp-list-table.jetpack-modules');

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
		$('.subsubsub').find('a[data-title="' + $(this).data('title') + '"]').addClass('current')
			.closest('li').siblings().find('a.current').removeClass('current');

		/**
		 * If we can, use replaceState to change the URL and indicate the new filtering.
		 * This will be handy with redirecting back to the same state after activating/deactivating.
		 */
		if ( window.history.replaceState ) {
			window.history.replaceState( {}, $(this).data('title'), $(this).attr('href') );
		}

		event.preventDefault();
		event.data.modules.filter_and_sort();
	}
	$('.subsubsub a').on( 'click', { modules : modules }, handle_module_tag_click );
	$the_table.on( 'click', '.module_tags a', { modules : modules }, handle_module_tag_click );

	$the_table.on( 'click', '.more-info-link', function( event ) {
		event.preventDefault();
		$( document.body ).addClass('jetpack-lb').append('<div class="jetpack-light-box-wrap"><div class="jetpack-light-box"></div></div>');
		$('.jetpack-light-box').html( $( this ).closest( '.jetpack-module' ).find( '.more-info' ).html() );
		$('.jetpack-light-box-wrap').on( 'click', function( event ) {
			if ( $( event.target ).hasClass( 'jetpack-light-box-wrap' ) ) {
				$( document.body ).removeClass( 'jetpack-lb' ).children( '.jetpack-light-box-wrap' ).remove();
			}
		} );
	} );

	$the_table.on( 'click', '.configure', { modules : modules }, function( event ) {
		event.preventDefault();
		event.data.modules.render_configure( $(this).closest('.jetpack-module').attr('id') );
	} );

} ) ( this, jQuery, window.jetpackModulesData, this.jetpackModules.models, this.jetpackModules.views );
