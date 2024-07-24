<?php
/**
 * Custom notices for wp-admin/profile.php
 *
 * Hooks to add notices to the user Profile page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Adds a notice for Automatticians informing that the Toolbar always shows on the front end on Atomic sites if
 * connected to Autoproxxy.
 */
function maybe_show_wpcom_toolbar_autoproxxy_notice() {
	?>
	<style>
		.toolbar-autoproxxy-notice {
			color: #666;
			font-style: italic;
			margin-top: 5px;
		}
	</style>
	<script type="text/javascript">
		document.addEventListener('DOMContentLoaded', function () {
			// Find the Toolbar checkbox label container using the unique ID.
			var toolbarCheckboxLabel = document.querySelector('#admin_bar_front').parentNode;
			if (toolbarCheckboxLabel) {
				// Create a new div for the notice.
				var newDiv = document.createElement('div');
				newDiv.className = 'toolbar-autoproxxy-notice';
				newDiv.textContent = 'Toolbar will always be shown under Automattic proxy.';

				// Insert the new div after the checkbox and label.
				toolbarCheckboxLabel.appendChild(newDiv);

				// Find and remove the <br> tag following the label to improve spacing.
				var brElement = toolbarCheckboxLabel.nextSibling;
				if (brElement && brElement.tagName === 'BR') {
					brElement.parentNode.removeChild(brElement);
				}
			}
		});
	</script>
	<?php
}

add_action( 'admin_footer-profile.php', 'maybe_show_wpcom_toolbar_autoproxxy_notice' );
