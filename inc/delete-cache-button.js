(function ($) {
	$(document).ready(function () {
		$('#wp-admin-bar-delete-cache').click(function () {
			$.post(
				wpsc_ajax.ajax_url,
				{
					// wp ajax action
					action: 'ajax-delete-cache',

					path:  wpsc_ajax.path,
					admin: wpsc_ajax.admin,

					// send the nonce along with the request
					nonce: wpsc_ajax.nonce
				},
			);
			return false;
		});

	});
})(jQuery);
