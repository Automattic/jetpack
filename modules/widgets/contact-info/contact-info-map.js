
if (jQuery) {
	jQuery().ready(function() {
		jQuery("div.contact-map").each(function(){
			// get lat and lon from hidden input values
			var lat = jQuery(this).find(".contact-info-map-lat").val();
			var lon = jQuery(this).find(".contact-info-map-lon").val();
			var lat_lon = new google.maps.LatLng(lat, lon);
			var mapOptions = {
				zoom: 16,
				center: lat_lon,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};

			var map = new google.maps.Map(jQuery(this).find(".contact-info-map-canvas")[0], mapOptions);
			var marker = new google.maps.Marker({
				map: map,
				position: lat_lon
			});
		});
	});
};
