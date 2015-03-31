/* global Site_Icon_Crop_Data, jQuery */
(function($) {
	var jcrop_api, Site_Icon_Crop;
	jcrop_api = {};
	Site_Icon_Crop = {

		updateCoords : function ( coords ) {

			$('#crop-x').val( coords.x );
			$('#crop-y').val( coords.y );
			$('#crop-width').val( coords.w );
			$('#crop-height').val( coords.h );

			Site_Icon_Crop.showPreview( coords );
		},

		showPreview : function( coords ){
			var rx, ry, crop_image, home_icon, preview_rx, preview_ry, favicon;
			rx = 64 / coords.w;
			ry = 64 / coords.h;
			crop_image = $('#crop-image');
			home_icon = $('#preview-homeicon');
			home_icon.css({
				width: Math.round(rx * crop_image.attr( 'width' ) ) + 'px',
				height: Math.round(ry * crop_image.attr( 'height' ) ) + 'px',
				marginLeft: '-' + Math.round(rx * coords.x) + 'px',
				marginTop: '-' + Math.round(ry * coords.y) + 'px'
			});
			preview_rx = 16 / coords.w;
			preview_ry = 16 / coords.h;
			favicon = $('#preview-favicon');
			favicon.css({
				width: Math.round( preview_rx *  crop_image.attr( 'width' ) ) + 'px',
				height: Math.round( preview_ry * crop_image.attr( 'height' ) ) + 'px',
				marginLeft: '-' + Math.round( preview_rx * coords.x ) + 'px',
				marginTop: '-' + Math.floor( preview_ry* coords.y ) + 'px'
			});
		},

		ready: function() {
			jcrop_api = $.Jcrop('#crop-image');
			jcrop_api.setOptions({
				aspectRatio: 1,
				onSelect: Site_Icon_Crop.updateCoords,
				onChange: Site_Icon_Crop.updateCoords,
				minSize: [ Site_Icon_Crop_Data.min_size, Site_Icon_Crop_Data.min_size ]
			});
			jcrop_api.animateTo([Site_Icon_Crop_Data.init_x, Site_Icon_Crop_Data.init_y, Site_Icon_Crop_Data.init_size, Site_Icon_Crop_Data.init_size]);
		}

	};

	Site_Icon_Crop.ready();

})(jQuery);