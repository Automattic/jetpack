<?php
/**
 * Contact form elements in the admin area. Used with Classic Editor.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Assets;

/**
 * Add a contact form button to the post composition screen
 */
add_action( 'media_buttons', 'grunion_media_button', 999 );
/**
 * Build contact form button.
 *
 * @return void
 */
function grunion_media_button() {
	global $post_ID, $temp_ID, $pagenow;// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	if ( 'press-this.php' === $pagenow ) {
		return;
	}

	$iframe_post_id = (int) ( 0 === $post_ID ? $temp_ID : $post_ID );// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$title          = __( 'Add Contact Form', 'jetpack' );
	$site_url       = esc_url( admin_url( "/admin-ajax.php?post_id={$iframe_post_id}&action=grunion_form_builder&TB_iframe=true&width=768" ) );
	?>

	<a id="insert-jetpack-contact-form" class="button thickbox" title="<?php echo esc_attr( $title ); ?>" data-editor="content" href="<?php echo esc_attr( $site_url ); ?>&id=add_form">
		<span class="jetpack-contact-form-icon"></span> <?php echo esc_html( $title ); ?>
	</a>

	<?php
}

add_action( 'wp_ajax_grunion_form_builder', 'grunion_display_form_view' );
/**
 * Display edit form view.
 *
 * @return void
 */
function grunion_display_form_view() {
	if ( current_user_can( 'edit_posts' ) ) {
		require_once GRUNION_PLUGIN_DIR . 'grunion-form-view.php';
	}
	exit;
}

// feedback specific css items
add_action( 'admin_print_styles', 'grunion_admin_css' );
/**
 * Enqueue styles.
 *
 * @return void
 */
function grunion_admin_css() {
	global $current_screen;
	if ( $current_screen === null ) {
		return;
	}
	if ( 'edit-feedback' !== $current_screen->id ) {
		return;
	}

	wp_enqueue_script( 'wp-lists' );
	?>

<style type='text/css'>
.add-new-h2, .view-switch, body.no-js .tablenav select[name^=action], body.no-js #doaction, body.no-js #doaction2 {
	display: none
}

.column-feedback_from img {
	float:left;
	margin-right:10px;
	margin-top:3px;
}

.widefat .column-feedback_from,
.widefat .column-feedback_date,
.widefat .column-feedback_source {
	width: 17%;
}
.widefat .column-feedback_response {
	width: 100%;
}

.widefat .column-feedback_response::before {
	display: none !important;
}

@media screen and (max-width: 782px) {
	.widefat .column-feedback_response {
		padding-left: 8px !important;
	}
}

.column-feedback_response .feedback_response__item {
	display: grid;
	grid-template-columns: 35% 1fr;
	grid-row-gap: 8px;
}
.column-feedback_response .feedback_response__item-key,
.column-feedback_response .feedback_response__item-value {
	align-items: flex-start;
	display: flex;
	word-break: break-word;
}
.column-feedback_response .feedback_response__item-value {
	font-weight: bold;
}

.column-feedback_response .feedback_response__mobile-separator {
	display: block;
}

@media screen and (min-width: 783px) {
	.column-feedback_response .feedback_response__mobile-separator {
		display: none;
	}
}

.spam a {
	color: #BC0B0B;
}

.untrash a {
	color: #D98500;
}

.unspam a {
	color: #D98500;
}

.post-type-feedback #jetpack-check-feedback-spam {
	margin-top: 0;
}
</style>

	<?php
}

add_action( 'admin_print_scripts', 'grunion_admin_js' );
/**
 * Enqueue scripts.
 *
 * @return void
 */
function grunion_admin_js() {
	global $current_screen;

	if ( 'edit-feedback' !== $current_screen->id ) {
		return;
	}

	?>
<script>
	var __grunionPostStatusNonce = <?php echo wp_json_encode( wp_create_nonce( 'grunion-post-status' ) ); ?>;
</script>
	<?php
}

add_action( 'admin_head', 'grunion_add_bulk_edit_option' );
/**
 * Hack a 'Bulk Spam' option for bulk edit in other than spam view
 * Hack a 'Bulk Delete' option for bulk edit in spam view
 *
 * There isn't a better way to do this until
 * https://core.trac.wordpress.org/changeset/17297 is resolved
 */
function grunion_add_bulk_edit_option() {

	$screen = get_current_screen();

	if ( $screen === null ) {
		return;
	}

	if ( 'edit-feedback' !== $screen->id ) {
		return;
	}

	// When viewing spam we want to be able to be able to bulk delete
	// When viewing anything we want to be able to bulk move to spam
	if ( isset( $_GET['post_status'] ) && 'spam' === $_GET['post_status'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- no changes to the site, we're only rendering the option to choose bulk delete/spam.
		// Create Delete Permanently bulk item
		$option_val      = 'delete';
		$option_txt      = __( 'Delete Permanently', 'jetpack' );
		$pseudo_selector = 'last-child';

	} else {
		// Create Mark Spam bulk item
		$option_val      = 'spam';
		$option_txt      = __( 'Mark as Spam', 'jetpack' );
		$pseudo_selector = 'first-child';
	}

	?>
		<script type="text/javascript">
			jQuery(document).ready(function($) {
				$('#posts-filter .actions select').filter('[name=action], [name=action2]').find('option:<?php echo esc_attr( $pseudo_selector ); ?>').after('<option value="<?php echo esc_attr( $option_val ); ?>"><?php echo esc_attr( $option_txt ); ?></option>' );
			})
		</script>
	<?php
}

add_action( 'admin_init', 'grunion_handle_bulk_spam' );
/**
 * Handle a bulk spam report
 */
function grunion_handle_bulk_spam() {
	global $pagenow;

	if ( 'edit.php' !== $pagenow
	|| ( empty( $_REQUEST['post_type'] ) || 'feedback' !== $_REQUEST['post_type'] ) ) {
		return;
	}

	// Slip in a success message
	if ( ! empty( $_REQUEST['message'] ) && 'marked-spam' === $_REQUEST['message'] ) {
		add_action( 'admin_notices', 'grunion_message_bulk_spam' );
	}

	if ( ( empty( $_REQUEST['action'] ) || 'spam' !== $_REQUEST['action'] ) && ( empty( $_REQUEST['action2'] ) || 'spam' !== $_REQUEST['action2'] ) ) {
		return;
	}

	check_admin_referer( 'bulk-posts' );

	if ( empty( $_REQUEST['post'] ) ) {
		wp_safe_redirect( wp_get_referer() );
		exit;
	}

	$post_ids = array_map( 'intval', $_REQUEST['post'] );

	foreach ( $post_ids as $post_id ) {
		if ( ! current_user_can( 'edit_page', $post_id ) ) {
			wp_die( esc_html__( 'You are not allowed to manage this item.', 'jetpack' ) );
		}

		$post           = array(
			'ID'          => $post_id,
			'post_status' => 'spam',
		);
		$akismet_values = get_post_meta( $post_id, '_feedback_akismet_values', true );
		wp_update_post( $post );

		/**
		 * Fires after a comment has been marked by Akismet.
		 *
		 * Typically this means the comment is spam.
		 *
		 * @module contact-form
		 *
		 * @since 2.2.0
		 *
		 * @param string $comment_status Usually is 'spam', otherwise 'ham'.
		 * @param array $akismet_values From '_feedback_akismet_values' in comment meta
		 */
		do_action( 'contact_form_akismet', 'spam', $akismet_values );
	}

	$redirect_url = add_query_arg( 'message', 'marked-spam', wp_get_referer() );
	wp_safe_redirect( $redirect_url );
	exit;
}
/**
 * Display spam message.
 *
 * @return void
 */
function grunion_message_bulk_spam() {
	echo '<div class="updated"><p>' . esc_html__( 'Feedback(s) marked as spam', 'jetpack' ) . '</p></div>';
}

add_filter( 'bulk_actions-edit-feedback', 'grunion_admin_bulk_actions' );
/**
 * Unset edit option when bulk editing.
 *
 * @param array $actions List of actions available.
 * @return array $actions
 */
function grunion_admin_bulk_actions( $actions ) {
	global $current_screen;
	if ( 'edit-feedback' !== $current_screen->id ) {
		return $actions;
	}

	unset( $actions['edit'] );
	return $actions;
}

add_filter( 'views_edit-feedback', 'grunion_admin_view_tabs' );
/**
 * Unset publish button when editing feedback.
 *
 * @param array $views List of post views.
 * @return array $views
 */
function grunion_admin_view_tabs( $views ) {
	global $current_screen;
	if ( 'edit-feedback' !== $current_screen->id ) {
		return $views;
	}

	unset( $views['publish'] );

	preg_match( '|post_type=feedback\'( class="current")?\>(.*)\<span class=|', $views['all'], $match );
	if ( ! empty( $match[2] ) ) {
		$views['all'] = str_replace( $match[2], __( 'Messages', 'jetpack' ) . ' ', $views['all'] );
	}

	return $views;
}

add_filter( 'manage_feedback_posts_columns', 'grunion_post_type_columns_filter' );
/**
 * Build Feedback admin page columns.
 *
 * @param array $cols List of available columns.
 * @return array
 */
function grunion_post_type_columns_filter( $cols ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	return array(
		'cb'                => '<input type="checkbox" />',
		'feedback_from'     => __( 'From', 'jetpack' ),
		'feedback_source'   => __( 'Source', 'jetpack' ),
		'feedback_date'     => __( 'Date', 'jetpack' ),
		'feedback_response' => __( 'Response Data', 'jetpack' ),
	);
}

/**
 * Displays the value for the source column. (This function runs within the loop.)
 *
 * @return void
 */
function grunion_manage_post_column_date() {
	echo esc_html( date_i18n( 'Y/m/d', get_the_time( 'U' ) ) );
}

/**
 * Displays the value for the from column.
 *
 * @param  \WP_Post $post Current post.
 * @return void
 */
function grunion_manage_post_column_from( $post ) {
	$content_fields = Grunion_Contact_Form_Plugin::parse_fields_from_content( $post->ID );

	if ( isset( $content_fields['_feedback_author'] ) ) {
		echo esc_html( $content_fields['_feedback_author'] );
		return;
	}

	if ( isset( $content_fields['_feedback_author_email'] ) ) {
		printf(
			"<a href='%1\$s' target='_blank'>%2\$s</a><br />",
			esc_url( 'mailto:' . $content_fields['_feedback_author_email'] ),
			esc_html( $content_fields['_feedback_author_email'] )
		);
		return;
	}

	if ( isset( $content_fields['_feedback_ip'] ) ) {
		echo esc_html( $content_fields['feedback_ip'] );
		return;
	}

	echo esc_html__( 'Unknown', 'jetpack' );
}

/**
 * Displays the value for the response column.
 *
 * @param  \WP_Post $post Current post.
 * @return void
 */
function grunion_manage_post_column_response( $post ) {
	$content_fields = Grunion_Contact_Form_Plugin::parse_fields_from_content( $post->ID );

	$response_fields = array_diff_key(
		isset( $content_fields['_feedback_all_fields'] ) ? $content_fields['_feedback_all_fields'] : array(),
		array(
			'email_marketing_consent' => '',
			'entry_title'             => '',
			'entry_permalink'         => '',
			'feedback_id'             => '',
		)
	);

	echo '<hr class="feedback_response__mobile-separator" />';
	echo '<div class="feedback_response__item">';
	foreach ( $response_fields as $key => $value ) {
		printf(
			'<div class="feedback_response__item-key">%s</div><div class="feedback_response__item-value">%s</div>',
			esc_html( preg_replace( '#^\d+_#', '', $key ) ),
			esc_html( $value )
		);
	}
	echo '</div>';
	echo '<hr />';

	echo '<div class="feedback_response__item">';
	if ( isset( $content_fields['_feedback_ip'] ) ) {
		echo '<div class="feedback_response__item-key">' . esc_html__( 'IP', 'jetpack' ) . '</div>';
		echo '<div class="feedback_response__item-value">' . esc_html( $content_fields['_feedback_ip'] ) . '</div>';
	}
	echo '<div class="feedback_response__item-key">' . esc_html__( 'Source', 'jetpack' ) . '</div>';
	echo '<div class="feedback_response__item-value"><a href="' . esc_url( get_permalink( $post->post_parent ) ) . '" target="_blank" rel="noopener noreferrer">' . esc_html( get_permalink( $post->post_parent ) ) . '</a></div>';
	echo '</div>';
}

/**
 * Displays the value for the source column.
 *
 * @param  \WP_Post $post Current post.
 * @return void
 */
function grunion_manage_post_column_source( $post ) {
	if ( ! isset( $post->post_parent ) ) {
		return;
	}

	$form_url   = get_permalink( $post->post_parent );
	$parsed_url = wp_parse_url( $form_url );

	printf(
		'<a href="%s" target="_blank" rel="noopener noreferrer">/%s</a>',
		esc_url( $form_url ),
		esc_html( basename( $parsed_url['path'] ) )
	);
}

add_action( 'manage_posts_custom_column', 'grunion_manage_post_columns', 10, 2 );
/**
 * Parse message content and display in appropriate columns.
 *
 * @param array $col List of columns available on admin page.
 * @param int   $post_id The current post ID.
 * @return void
 */
function grunion_manage_post_columns( $col, $post_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	global $post;

	/**
	 * Only call parse_fields_from_content if we're dealing with a Grunion custom column.
	 */
	if ( ! in_array( $col, array( 'feedback_date', 'feedback_from', 'feedback_response', 'feedback_source' ), true ) ) {
		return;
	}

	switch ( $col ) {
		case 'feedback_date':
			grunion_manage_post_column_date();
			return;
		case 'feedback_from':
			grunion_manage_post_column_from( $post );
			return;
		case 'feedback_response':
			grunion_manage_post_column_response( $post );
			return;
		case 'feedback_source':
			grunion_manage_post_column_source( $post );
			return;
	}
}

add_filter( 'post_row_actions', 'grunion_manage_post_row_actions', 10, 2 );
/**
 * Add actions to feedback response rows in WP Admin.
 *
 * @param string[] $actions Default actions.
 * @return string[]
 */
function grunion_manage_post_row_actions( $actions ) {
	global $post;

	if ( 'feedback' !== $post->post_type ) {
		return $actions;
	}

	$post_type_object = get_post_type_object( $post->post_type );
	$actions          = array();

	if ( $post->post_status === 'trash' ) {
		$actions['untrash'] = sprintf(
			'<a title="%s" href="%s">%s</a>',
			esc_attr__( 'Restore this item from the Trash', 'jetpack' ),
			esc_url( wp_nonce_url( admin_url( sprintf( $post_type_object->_edit_link . '&action=untrash', rawurlencode( $post->ID ) ) ) ), 'untrash-' . $post->post_type . '_' . $post->ID ),
			esc_html__( 'Restore', 'jetpack' )
		);
		$actions['delete']  = sprintf(
			'<a class="submitdelete" title="%s" href="%s">%s</a>',
			esc_attr( __( 'Delete this item permanently', 'jetpack' ) ),
			get_delete_post_link( $post->ID, '', true ),
			esc_html__( 'Delete Permanently', 'jetpack' )
		);
	} elseif ( $post->post_status === 'publish' ) {
		$actions['spam']  = sprintf(
			'<a title="%s" href="%s">%s</a>',
			esc_html__( 'Mark this message as spam', 'jetpack' ),
			esc_url( wp_nonce_url( admin_url( 'admin-ajax.php?post_id=' . rawurlencode( $post->ID ) . '&action=spam' ) ), 'spam-feedback_' . $post->ID ),
			esc_html__( 'Spam', 'jetpack' )
		);
		$actions['trash'] = sprintf(
			'<a class="submitdelete" title="%s" href="%s">%s</a>',
			esc_attr__( 'Trash', 'jetpack' ),
			get_delete_post_link( $post->ID ),
			esc_html__( 'Trash', 'jetpack' )
		);
	} elseif ( $post->post_status === 'spam' ) {
		$actions['unspam unapprove'] = sprintf(
			'<a title="%s" href="">%s</a>',
			esc_html__( 'Mark this message as NOT spam', 'jetpack' ),
			esc_html__( 'Not Spam', 'jetpack' )
		);
		$actions['delete']           = sprintf(
			'<a class="submitdelete" title="%s" href="%s">%s</a>',
			esc_attr( __( 'Delete this item permanently', 'jetpack' ) ),
			get_delete_post_link( $post->ID, '', true ),
			esc_html__( 'Delete Permanently', 'jetpack' )
		);
	}

	return $actions;
}

/**
 * Escape grunion attributes.
 *
 * @param string $attr - the attribute we're escaping.
 *
 * @return string
 */
function grunion_esc_attr( $attr ) {
	$out = esc_attr( $attr );
	// we also have to entity-encode square brackets so they don't interfere with the shortcode parser
	// FIXME: do this better - just stripping out square brackets for now since they mysteriously keep reappearing
	$out = str_replace( '[', '', $out );
	$out = str_replace( ']', '', $out );
	return $out;
}

/**
 * Sort grunion items.
 *
 * @param array $a - the first item we're sorting.
 * @param array $b - the second item we're sorting.
 *
 * @return string
 */
function grunion_sort_objects( $a, $b ) {
	if ( isset( $a['order'] ) && isset( $b['order'] ) ) {
		return $a['order'] - $b['order'];
	}
	return 0;
}

/**
 * Take an array of field types from the form builder, and construct a shortcode form.
 * returns both the shortcode form, and HTML markup representing a preview of the form
 */
function grunion_ajax_shortcode() {
	check_ajax_referer( 'grunion_shortcode' );

	if ( ! current_user_can( 'edit_posts' ) ) {
		die( '-1' );
	}

	$attributes = array();

	foreach ( array( 'subject', 'to' ) as $attribute ) {
		if ( isset( $_POST[ $attribute ] ) && is_scalar( $_POST[ $attribute ] ) && (string) $_POST[ $attribute ] !== '' ) {
			$attributes[ $attribute ] = sanitize_text_field( wp_unslash( $_POST[ $attribute ] ) );
		}
	}

	if ( isset( $_POST['fields'] ) && is_array( $_POST['fields'] ) ) {
		$fields = sanitize_text_field( stripslashes_deep( $_POST['fields'] ) );
		usort( $fields, 'grunion_sort_objects' );

		$field_shortcodes = array();

		foreach ( $fields as $field ) {
			$field_attributes = array();

			if ( isset( $field['required'] ) && 'true' === $field['required'] ) {
				$field_attributes['required'] = 'true';
			}

			foreach ( array( 'options', 'label', 'type' ) as $attribute ) {
				if ( isset( $field[ $attribute ] ) ) {
					$field_attributes[ $attribute ] = $field[ $attribute ];
				}
			}

			$field_shortcodes[] = new Grunion_Contact_Form_Field( $field_attributes );
		}
	}

	$grunion = new Grunion_Contact_Form( $attributes, $field_shortcodes );

	die( "\n$grunion\n" ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

/**
 * Takes a post_id, extracts the contact-form shortcode from that post (if there is one), parses it,
 * and constructs a json object representing its contents and attributes.
 */
function grunion_ajax_shortcode_to_json() {
	global $post;

	check_ajax_referer( 'grunion_shortcode_to_json' );

	if ( ! empty( $_POST['post_id'] ) && ! current_user_can( 'edit_post', (int) $_POST['post_id'] ) ) {
		die( '-1' );
	} elseif ( ! current_user_can( 'edit_posts' ) ) {
		die( '-1' );
	}

	if ( ! isset( $_POST['content'] ) || ! is_numeric( $_POST['post_id'] ) ) {
		die( '-1' );
	}

	$content = sanitize_text_field( wp_unslash( $_POST['content'] ) );

	// doesn't look like a post with a [contact-form] already.
	if ( false === has_shortcode( $content, 'contact-form' ) ) {
		die( '' );
	}

	$post = get_post( (int) $_POST['post_id'] ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

	do_shortcode( $content );

	$grunion = Grunion_Contact_Form::$last;

	$out = array(
		'to'      => '',
		'subject' => '',
		'fields'  => array(),
	);

	foreach ( $grunion->fields as $field ) {
		$out['fields'][ $field->get_attribute( 'id' ) ] = $field->attributes;
	}

	foreach ( array( 'to', 'subject' ) as $attribute ) {
		$value = $grunion->get_attribute( $attribute );
		if ( isset( $grunion->defaults[ $attribute ] ) && $value === $grunion->defaults[ $attribute ] ) {
			$value = '';
		}
		$out[ $attribute ] = $value;
	}

	die( wp_json_encode( $out ) );
}

add_action( 'wp_ajax_grunion_shortcode', 'grunion_ajax_shortcode' );
add_action( 'wp_ajax_grunion_shortcode_to_json', 'grunion_ajax_shortcode_to_json' );

// process row-action spam/not spam clicks
add_action( 'wp_ajax_grunion_ajax_spam', 'grunion_ajax_spam' );

/**
 * Handle marking feedback as spam.
 */
function grunion_ajax_spam() {
	global $wpdb;

	if ( empty( $_POST['make_it'] ) ) {
		return;
	}

	$post_id = isset( $_POST['post_id'] ) ? (int) $_POST['post_id'] : 0;
	check_ajax_referer( 'grunion-post-status' );
	if ( ! current_user_can( 'edit_page', $post_id ) ) {
		wp_die( esc_html__( 'You are not allowed to manage this item.', 'jetpack' ) );
	}

	require_once __DIR__ . '/grunion-contact-form.php';

	$current_menu = '';
	if ( isset( $_POST['sub_menu'] ) && preg_match( '|post_type=feedback|', sanitize_text_field( wp_unslash( $_POST['sub_menu'] ) ) ) ) {
		if ( preg_match( '|post_status=spam|', sanitize_text_field( wp_unslash( $_POST['sub_menu'] ) ) ) ) {
			$current_menu = 'spam';
		} elseif ( preg_match( '|post_status=trash|', sanitize_text_field( wp_unslash( $_POST['sub_menu'] ) ) ) ) {
			$current_menu = 'trash';
		} else {
			$current_menu = 'messages';
		}
	}

	$post             = get_post( $post_id );
	$post_type_object = get_post_type_object( $post->post_type );
	$akismet_values   = get_post_meta( $post_id, '_feedback_akismet_values', true );
	if ( $_POST['make_it'] === 'spam' ) {
		$post->post_status = 'spam';
		$status            = wp_insert_post( $post );

		/** This action is already documented in modules/contact-form/admin.php */
		do_action( 'contact_form_akismet', 'spam', $akismet_values );
	} elseif ( $_POST['make_it'] === 'ham' ) {
		$post->post_status = 'publish';
		$status            = wp_insert_post( $post );

		/** This action is already documented in modules/contact-form/admin.php */
		do_action( 'contact_form_akismet', 'ham', $akismet_values );

		$comment_author_email = false;
		$reply_to_addr        = false;
		$message              = false;
		$to                   = false;
		$headers              = false;
		$blog_url             = wp_parse_url( site_url() );

		// resend the original email
		$email          = get_post_meta( $post_id, '_feedback_email', true );
		$content_fields = Grunion_Contact_Form_Plugin::parse_fields_from_content( $post_id );

		if ( ! empty( $email ) && ! empty( $content_fields ) ) {
			if ( isset( $content_fields['_feedback_author_email'] ) ) {
				$comment_author_email = $content_fields['_feedback_author_email'];
			}

			if ( isset( $email['to'] ) ) {
				$to = $email['to'];
			}

			if ( isset( $email['message'] ) ) {
				$message = $email['message'];
			}

			if ( isset( $email['headers'] ) ) {
				$headers = $email['headers'];
			} else {
				$headers = 'From: "' . $content_fields['_feedback_author'] . '" <wordpress@' . $blog_url['host'] . ">\r\n";

				if ( ! empty( $comment_author_email ) ) {
					$reply_to_addr = $comment_author_email;
				} elseif ( is_array( $to ) ) {
					$reply_to_addr = $to[0];
				}

				if ( $reply_to_addr ) {
					$headers .= 'Reply-To: "' . $content_fields['_feedback_author'] . '" <' . $reply_to_addr . ">\r\n";
				}

				$headers .= 'Content-Type: text/plain; charset="' . get_option( 'blog_charset' ) . '"';
			}

			/**
			 * Filters the subject of the email sent after a contact form submission.
			 *
			 * @module contact-form
			 *
			 * @since 3.0.0
			 *
			 * @param string $content_fields['_feedback_subject'] Feedback's subject line.
			 * @param array $content_fields['_feedback_all_fields'] Feedback's data from old fields.
			 */
			$subject = apply_filters( 'contact_form_subject', $content_fields['_feedback_subject'], $content_fields['_feedback_all_fields'] );

			Grunion_Contact_Form::wp_mail( $to, $subject, $message, $headers );
		}
	} elseif ( $_POST['make_it'] === 'publish' ) {
		if ( ! current_user_can( $post_type_object->cap->delete_post, $post_id ) ) {
			wp_die( esc_html__( 'You are not allowed to move this item out of the Trash.', 'jetpack' ) );
		}

		if ( ! wp_untrash_post( $post_id ) ) {
			wp_die( esc_html__( 'Error in restoring from Trash.', 'jetpack' ) );
		}
	} elseif ( $_POST['make_it'] === 'trash' ) {
		if ( ! current_user_can( $post_type_object->cap->delete_post, $post_id ) ) {
			wp_die( esc_html__( 'You are not allowed to move this item to the Trash.', 'jetpack' ) );
		}

		if ( ! wp_trash_post( $post_id ) ) {
			wp_die( esc_html__( 'Error in moving to Trash.', 'jetpack' ) );
		}
	}

	$sql          = "
		SELECT post_status,
			COUNT( * ) AS post_count
		FROM `{$wpdb->posts}`
		WHERE post_type =  'feedback'
		GROUP BY post_status
	";
	$status_count = (array) $wpdb->get_results( $sql, ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared

	$status      = array();
	$status_html = '';
	foreach ( $status_count as $row ) {
		$status[ $row['post_status'] ] = $row['post_count'];
	}

	if ( isset( $status['publish'] ) ) {
		$status_html .= '<li><a href="edit.php?post_type=feedback"';
		if ( $current_menu === 'messages' ) {
			$status_html .= ' class="current"';
		}

		$status_html .= '>' . __( 'Messages', 'jetpack' ) . ' <span class="count">';
		$status_html .= '(' . number_format( $status['publish'] ) . ')';
		$status_html .= '</span></a> |</li>';
	}

	if ( isset( $status['trash'] ) ) {
		$status_html .= '<li><a href="edit.php?post_status=trash&amp;post_type=feedback"';
		if ( $current_menu === 'trash' ) {
			$status_html .= ' class="current"';
		}

		$status_html .= '>' . __( 'Trash', 'jetpack' ) . ' <span class="count">';
		$status_html .= '(' . number_format( $status['trash'] ) . ')';
		$status_html .= '</span></a>';
		if ( isset( $status['spam'] ) ) {
			$status_html .= ' |';
		}
		$status_html .= '</li>';
	}

	if ( isset( $status['spam'] ) ) {
		$status_html .= '<li><a href="edit.php?post_status=spam&amp;post_type=feedback"';
		if ( $current_menu === 'spam' ) {
			$status_html .= ' class="current"';
		}

		$status_html .= '>' . __( 'Spam', 'jetpack' ) . ' <span class="count">';
		$status_html .= '(' . number_format( $status['spam'] ) . ')';
		$status_html .= '</span></a></li>';
	}

	echo $status_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- we're building the html to echo.
	exit;
}

/**
 * Add the scripts that will add the "Check for Spam" button to the Feedbacks dashboard page.
 */
function grunion_enable_spam_recheck() {
	if ( ! defined( 'AKISMET_VERSION' ) ) {
		return;
	}

	$screen = get_current_screen();

	// Only add to feedback, only to non-spam view
	if ( 'edit-feedback' !== $screen->id || ( ! empty( $_GET['post_status'] ) && 'spam' === $_GET['post_status'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- not making site changes with this check.
		return;
	}

	// Add the actual "Check for Spam" button.
	add_action( 'admin_head', 'grunion_check_for_spam_button' );
}

add_action( 'admin_enqueue_scripts', 'grunion_enable_spam_recheck' );

/**
 * Add the JS and CSS necessary for the Feedback admin page to function.
 */
function grunion_add_admin_scripts() {
	$screen = get_current_screen();

	if ( 'edit-feedback' !== $screen->id ) {
		return;
	}

	// Add the scripts that handle the spam check event.
	wp_register_script(
		'grunion-admin',
		Assets::get_file_url_for_environment(
			'_inc/build/contact-form/js/grunion-admin.min.js',
			'modules/contact-form/js/grunion-admin.js'
		),
		array( 'jquery' ),
		JETPACK__VERSION,
		true
	);

	wp_enqueue_script( 'grunion-admin' );

	wp_enqueue_style( 'grunion.css' );

	// Only add to feedback, only to spam view.
	if ( empty( $_GET['post_status'] ) || 'spam' !== $_GET['post_status'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- not making site changes with this check
		return;
	}

	$feedbacks_count = wp_count_posts( 'feedback' );
	$nonce           = wp_create_nonce( 'jetpack_delete_spam_feedbacks' );
	$success_url     = remove_query_arg( array( 'jetpack_empty_feedback_spam_error', 'post_status' ) ); // Go to the "All Feedback" page.
	$failure_url     = add_query_arg( 'jetpack_empty_feedback_spam_error', '1' ); // Refresh the current page and show an error.
	$spam_count      = $feedbacks_count->spam;

	$button_parameters = array(
		/* translators: The placeholder is for showing how much of the process has completed, as a percent. e.g., "Emptying Spam (40%)" */
		'progress_label' => __( 'Emptying Spam (%1$s%)', 'jetpack' ),
		'success_url'    => $success_url,
		'failure_url'    => $failure_url,
		'spam_count'     => $spam_count,
		'nonce'          => $nonce,
		'label'          => __( 'Empty Spam', 'jetpack' ),
	);

	wp_localize_script( 'grunion-admin', 'jetpack_empty_spam_button_parameters', $button_parameters );
}

add_action( 'admin_enqueue_scripts', 'grunion_add_admin_scripts' );

/**
 * Add the "Check for Spam" button to the Feedbacks dashboard page.
 */
function grunion_check_for_spam_button() {
	// Nonce name.
	$nonce_name = 'jetpack_check_feedback_spam_' . (string) get_current_blog_id();
	// Get HTML for the button.
	$button_html  = get_submit_button(
		__( 'Check for Spam', 'jetpack' ),
		'secondary',
		'jetpack-check-feedback-spam',
		false,
		array(
			'data-failure-url' => add_query_arg( 'jetpack_check_feedback_spam_error', '1' ), // Refresh the current page and show an error.
			'data-nonce-name'  => $nonce_name,
		)
	);
	$button_html .= '<span class="jetpack-check-feedback-spam-spinner"></span>';
	$button_html .= wp_nonce_field( 'grunion_recheck_queue', $nonce_name, false, false );

	// Add the button next to the filter button via js.
	?>
	<script type="text/javascript">
		jQuery( function( $ ) {
			$( '.tablenav.bottom .bulkactions' ).append( <?php echo wp_json_encode( $button_html ); ?> );
		} );
	</script>
	<?php
}

/**
 * Recheck all approved feedbacks for spam.
 */
function grunion_recheck_queue() {
	$blog_id = get_current_blog_id();

	if (
		empty( $_POST[ 'jetpack_check_feedback_spam_' . (string) $blog_id ] )
		|| ! wp_verify_nonce( sanitize_key( $_POST[ 'jetpack_check_feedback_spam_' . (string) $blog_id ] ), 'grunion_recheck_queue' )
	) {
		wp_send_json_error(
			__( 'You aren’t authorized to do that.', 'jetpack' ),
			403
		);

		return;
	}

	if ( ! current_user_can( 'delete_others_posts' ) ) {
		wp_send_json_error(
			__( 'You don’t have permission to do that.', 'jetpack' ),
			403
		);

		return;
	}

	$query = 'post_type=feedback&post_status=publish';

	if ( isset( $_POST['limit'], $_POST['offset'] ) ) {
		$query .= '&posts_per_page=' . (int) $_POST['limit'] . '&offset=' . (int) $_POST['offset'];
	}

	$approved_feedbacks = get_posts( $query );

	foreach ( $approved_feedbacks as $feedback ) {
		$meta = get_post_meta( $feedback->ID, '_feedback_akismet_values', true );

		if ( ! $meta ) {
			// _feedback_akismet_values is eventually deleted when it's no longer
			// within a reasonable time period to check the feedback for spam, so
			// if it's gone, don't attempt a spam recheck.
			continue;
		}

		$meta['recheck_reason'] = 'recheck_queue';

		/**
		 * Filter whether the submitted feedback is considered as spam.
		 *
		 * @module contact-form
		 *
		 * @since 3.4.0
		 *
		 * @param bool false Is the submitted feedback spam? Default to false.
		 * @param array $meta Feedack values returned by the Akismet plugin.
		 */
		$is_spam = apply_filters( 'jetpack_contact_form_is_spam', false, $meta );

		if ( $is_spam ) {
			wp_update_post(
				array(
					'ID'          => $feedback->ID,
					'post_status' => 'spam',
				)
			);
			/** This action is already documented in modules/contact-form/admin.php */
			do_action( 'contact_form_akismet', 'spam', $meta );
		}
	}

	wp_send_json(
		array(
			'processed' => count( $approved_feedbacks ),
		)
	);
}

add_action( 'wp_ajax_grunion_recheck_queue', 'grunion_recheck_queue' );

/**
 * Delete a number of spam feedbacks via an AJAX request.
 */
function grunion_delete_spam_feedbacks() {
	if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( $_POST['nonce'], 'jetpack_delete_spam_feedbacks' ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- core doesn't sanitize nonce checks either. 
		wp_send_json_error(
			__( 'You aren’t authorized to do that.', 'jetpack' ),
			403
		);

		return;
	}

	if ( ! current_user_can( 'delete_others_posts' ) ) {
		wp_send_json_error(
			__( 'You don’t have permission to do that.', 'jetpack' ),
			403
		);

		return;
	}

	$deleted_feedbacks = 0;

	$delete_limit = 25;
	/**
	 * Filter the amount of Spam feedback one can delete at once.
	 *
	 * @module contact-form
	 *
	 * @since 8.7.0
	 *
	 * @param int $delete_limit Number of spam to process at once. Default to 25.
	 */
	$delete_limit = apply_filters( 'jetpack_delete_spam_feedbacks_limit', $delete_limit );
	$delete_limit = (int) $delete_limit;
	$delete_limit = max( 1, min( 100, $delete_limit ) ); // Allow a range of 1-100 for the delete limit.

	$query_args = array(
		'post_type'      => 'feedback',
		'post_status'    => 'spam',
		'posts_per_page' => $delete_limit,
	);

	$query          = new WP_Query( $query_args );
	$spam_feedbacks = $query->get_posts();

	foreach ( $spam_feedbacks as $feedback ) {
		wp_delete_post( $feedback->ID, true );

		$deleted_feedbacks++;
	}

	wp_send_json(
		array(
			'success' => true,
			'data'    => array(
				'counts' => array(
					'deleted' => $deleted_feedbacks,
					'limit'   => $delete_limit,
				),
			),
		)
	);
}
add_action( 'wp_ajax_jetpack_delete_spam_feedbacks', 'grunion_delete_spam_feedbacks' );

/**
 * Show an admin notice if the "Empty Spam" or "Check Spam" process was unable to complete, probably due to a permissions error.
 */
function grunion_feedback_admin_notice() {
	if ( isset( $_GET['jetpack_empty_feedback_spam_error'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		echo '<div class="notice notice-error"><p>' . esc_html( __( 'An error occurred while trying to empty the Feedback spam folder.', 'jetpack' ) ) . '</p></div>';
	} elseif ( isset( $_GET['jetpack_check_feedback_spam_error'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		echo '<div class="notice notice-error"><p>' . esc_html( __( 'An error occurred while trying to check for spam among the feedback you received.', 'jetpack' ) ) . '</p></div>';
	}
}
add_action( 'admin_notices', 'grunion_feedback_admin_notice' );
