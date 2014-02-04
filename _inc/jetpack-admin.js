(function($) {

	///////////////////////////////////////
	// INIT
	///////////////////////////////////////

	$(document).ready(function () {
		configFixedElements();
	});

	///////////////////////////////////////
	// FUNCTIONS
	///////////////////////////////////////

	function configFixedElements() {
		var jpBottomFrame = $(".frame.bottom"),
			jpTopFrame = $(".frame.top");

		$('body').scroll(function(e){

			var frameBottom = jpBottomFrame.offset().top,
				frameTop = jpTopFrame.offset().top;

			// Top Frame
			if (frameTop < 33) {
		    	jpTopFrame.addClass('fixed');
		    }
		    if (frameBottom >= 120){
		    	jpTopFrame.removeClass('fixed');
		    }
		});
	}

})(jQuery);