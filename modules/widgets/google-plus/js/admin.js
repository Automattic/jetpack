(function($) {
	// For when adding widget via customizer
	$( document ).on( 'widget-added', function() {
		toggle_items();
	});

	$(function(){
		$( document ).on( 'change', '.googleplus-badge-choose-type', toggle_items )
			.on( 'widget-updated', toggle_items );

		toggle_items();
	});

	function toggle_items() {
		$( '.widget-inside .googleplus-badge-choose-type' ).each( function(){
			var $widget_form = $( this ).parents( 'form' );

			$widget_form.find( '[class^="googleplus-badge-only-"]' ).parent().hide();
			$widget_form.find( '.googleplus-badge-only-' + $( this ).val() ).parent().show();
		});
	}
})(jQuery);
