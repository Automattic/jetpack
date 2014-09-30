
(function($) {
	var jcrop_api = {};
	var Blavatar_Crop = {

		updateCoords : function ( coords ) {
			
			$('#crop-x').val( coords.x );
			$('#crop-y').val( coords.y );
			$('#crop-width').val( coords.w );
			$('#crop-height').val( coords.h );
			console.log('updating the coodrinated');
			Blavatar_Crop.showPreview( coords );
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
			var rx = 16 / coords.w;
			var ry = 16 / coords.h;
			var favicon = $('#preview-favicon')
			favicon.css({
				width: Math.round( rx *  crop_image.attr( 'width' ) ) + 'px',
				height: Math.round( ry * crop_image.attr( 'height' ) ) + 'px',
				marginLeft: '-' + Math.round(rx * coords.x) + 'px',
				marginTop: '-' + Math.round(ry * coords.y) + 'px'
			});
		},

		ready: function() {
			jcrop_api = $.Jcrop('#crop-image');
			jcrop_api.setOptions({
				aspectRatio: 1,
				onSelect: Blavatar_Crop.updateCoords,
				onChange: Blavatar_Crop.updateCoords,
				minSize: [ Blavatar_Crop_Data.min_size, Blavatar_Crop_Data.min_size ]
			});
			jcrop_api.animateTo([Blavatar_Crop_Data.init_x, Blavatar_Crop_Data.init_y, Blavatar_Crop_Data.init_size, Blavatar_Crop_Data.init_size]);
	
		}

	}
	
	Blavatar_Crop.ready();

})(jQuery);