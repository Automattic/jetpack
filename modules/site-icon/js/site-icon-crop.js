/* global Site_Icon_Crop_Data, jQuery */
(function($) {
	var jcrop_api = {};
	var Site_Icon_Crop = {

		updateCoords : function ( coords ) {
			
			$('#crop-x').val( coords.x );
			$('#crop-y').val( coords.y );
			$('#crop-width').val( coords.w );
			$('#crop-height').val( coords.h );
			console.log('updating the coodrinated');
			Site_Icon_Crop.showPreview( coords );
		},

		showPreview : function( coords ){
			var rx = 64 / coords.w;
			var ry = 64 / coords.h;
			var crop_image = $('#crop-image');
			var home_icon = $('#preview-homeicon');
			home_icon.css({
				width: Math.round(rx * crop_image.attr( 'width' ) ) + 'px',
				height: Math.round(ry * crop_image.attr( 'height' ) ) + 'px',
				marginLeft: '-' + Math.round(rx * coords.x) + 'px',
				marginTop: '-' + Math.round(ry * coords.y) + 'px'
			});
			var preview_rx = 16 / coords.w;
			var preview_ry = 16 / coords.h;
			var favicon = $('#preview-favicon');
			favicon.css({
				width: Math.round( preview_rx *  crop_image.attr( 'width' ) ) + 'px',
				height: Math.round( preview_ry * crop_image.attr( 'height' ) ) + 'px',
				marginLeft: '-' + Math.round(rx * coords.x) + 'px',
				marginTop: '-' + Math.round(ry * coords.y) + 'px'
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