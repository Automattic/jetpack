/* global google */
/* jshint unused:false */
jQuery( function( $ ) {
	var hasSelectiveRefresh;

	function setupContactMaps( rootElement ) {
		rootElement = $( rootElement || document.body );

		rootElement.find( 'div.contact-map' ).each( function() {

			// get lat and lon from hidden input values
			var lat = jQuery(this).find('.contact-info-map-lat').val(),
				lon = jQuery(this).find('.contact-info-map-lon').val(),
				lat_lon = new google.maps.LatLng( lat, lon ),
				mapOptions = {
					zoom: 16,
					center: lat_lon,
					mapTypeId: google.maps.MapTypeId.ROADMAP
				},
				map = new google.maps.Map(jQuery(this).find('.contact-info-map-canvas')[0], mapOptions),
				marker = new google.maps.Marker({
					map: map,
					position: lat_lon
				});

			google.maps.event.addListenerOnce(map, 'mouseover', function() {
				google.maps.event.trigger(map, 'resize');
			});

		});
	}

	setupContactMaps();

	hasSelectiveRefresh = (
		'undefined' !== typeof wp &&
		wp.customize &&
		wp.customize.selectiveRefresh &&
		wp.customize.widgetsPreview &&
		wp.customize.widgetsPreview.WidgetPartial
	);
	if ( hasSelectiveRefresh ) {
		wp.customize.selectiveRefresh.bind( 'partial-content-rendered', function( placement ) {
			if ( placement.partial.widgetId && /^widget_contact_info-\d+$/.test( placement.partial.widgetId ) ) {
				setupContactMaps( placement.container );
			}
		} );
	}
} );
