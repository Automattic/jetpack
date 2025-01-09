<?php
/**
 * Post list tracking.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Add tracking for the post list quick links.
 *
 * @return void
 */
function wpcom_add_tracking_for_posts_lists() {
	global $post_type;

	?>
	<script>
		document.querySelectorAll( '.column-primary .row-actions span' ).forEach( ( span ) => {
			span.addEventListener( 'click', (event) => {
				let name = event.currentTarget.className;

				// Classic editor sets the class to "0".
				if ( '0' === name ) {
					name = 'classic-editor';
				}

				// Handle Quick inline edit.
				if ( 'inline hide-if-no-js' === name ) {
					name = 'quick-edit';
				}

				const props = {
					post_type: '<?php echo esc_html( $post_type ); ?>',
					section: name,
				}

				window._tkq.push( [ 'recordEvent', 'wpcom_post_list_quick_links_clicked', props ] );
			} );
		} );
	</script>

	<?php
}

add_action( 'admin_print_footer_scripts-edit.php', 'wpcom_add_tracking_for_posts_lists' );

/**
 * Adds event for stats clicks in the post list (for pages and post types).
 *
 * @return void
 */
function wpcom_post_list_add_stats_tracking() {
	global $post_type;

	if ( ! in_array( $post_type, array( 'post', 'page' ), true ) ) {
		return;
	}
	?>
	<script>
		document.querySelectorAll( '#the-list .stats a' ).forEach( ( link ) => {
			link.addEventListener( 'click', () => {
				const props = {
					post_type: '<?php echo esc_html( $post_type ); ?>',
				}

				window._tkq.push( [ 'recordEvent', 'wpcom_post_list_stats_clicked', props ] );
			} );
		} );
	</script>
	<?php
}

add_action( 'admin_print_footer_scripts-edit.php', 'wpcom_post_list_add_stats_tracking' );
