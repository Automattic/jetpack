(function($, jetpackL10n) {

	///////////////////////////////////////
	// INIT
	///////////////////////////////////////

	var data;

	$(document).ready(function () {
		initEvents();
		configFixedElements();

		data = {
			'module_info'   :   jetpackL10n.module_info
		};

	});

	///////////////////////////////////////
	// FUNCTIONS
	///////////////////////////////////////

	function configFixedElements() {
		var jpTopFrame = $('.frame.top'),
			jpBottomFrame = $('.frame.bottom'),
			$body = $('body');

		$body.scroll(function(){
			if ( 33 > jpTopFrame.offset().top ) {
				jpTopFrame.addClass('fixed');
				$body.addClass('jp-frame-top-fixed');
			}
			if ( 120 <= jpBottomFrame.offset().top ) {
				jpTopFrame.removeClass('fixed');
				$body.removeClass('jp-frame-top-fixed');
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
		$('.shade, .modal .close').on('click', function ( event ) {
			$('.shade, .modal').hide();
			$('.manage-right').removeClass('show');
			event.preventDefault();
		});
	}

})(jQuery);
