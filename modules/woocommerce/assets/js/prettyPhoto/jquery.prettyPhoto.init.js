(function($) {
$(function() {

	// Lightbox
	$("a.zoom").prettyPhoto({
		hook: 'data-rel',
		social_tools: false,
		theme: 'pp_woocommerce',
		horizontal_padding: 20,
		opacity: 0.8,
		deeplinking: false
	});
	$("a[data-rel^='prettyPhoto']").prettyPhoto({
		hook: 'data-rel',
		social_tools: false,
		theme: 'pp_woocommerce',
		horizontal_padding: 20,
		opacity: 0.8,
		deeplinking: false
	});

});
})(jQuery);
