(function($) {

	///////////////////////////////////////
	// INIT
	///////////////////////////////////////

	$(document).ready(function () {
		initEvents();
		configFixedElements();
	});

	///////////////////////////////////////
	// FUNCTIONS
	///////////////////////////////////////

	function configFixedElements() {
		var jpBottomFrame = $(".frame.bottom"),
			jpTopFrame = $(".frame.top");

		$('body').scroll(function(){

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

	function initEvents() {
		// toggle search and filters at mobile resolution
		$('.filter-search').on('click', function () {
			$(this).toggleClass('active');
			$('.manage-right').toggleClass('show');
			$('.shade').toggle();
		});

		// Toggle all checkboxes
		$('.checkall').on('click', function () {
			$('.table-bordered').find(':checkbox').prop('checked', this.checked);
		});

		// Clicking outside modal, or close X closes modal
		$('.shade, .modal header .close').on('click', function () {
			$('.shade, .modal').hide();
			$('.manage-right').removeClass('show');
			return false;
		});
	}

})(jQuery);