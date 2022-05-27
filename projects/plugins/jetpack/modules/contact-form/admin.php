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
	$plugin_url     = esc_url( GRUNION_PLUGIN_URL );// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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

.widefat .column-feedback_from {
	width: 17%;
}
.widefat .column-feedback_date {
	width: 17%;
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

</style>

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
 * @return array $cols
 */
function grunion_post_type_columns_filter( $cols ) {
	$cols = array(
		'cb'               => '<input type="checkbox" />',
		'feedback_from'    => __( 'From', 'jetpack' ),
		'feedback_message' => __( 'Message', 'jetpack' ),
		'feedback_date'    => __( 'Date', 'jetpack' ),
	);

	return $cols;
}

add_action( 'manage_posts_custom_column', 'grunion_manage_post_columns', 10, 2 );
/**
 * Parse message content and display in appropriate columns.
 *
 * @param array $col List of columns available on admin page.
 * @param int   $post_id The current post ID.
 * @return void
 */
function grunion_manage_post_columns( $col, $post_id ) {
	global $post;

	/**
	 * Only call parse_fields_from_content if we're dealing with a Grunion custom column.
	 */
	if ( ! in_array( $col, array( 'feedback_date', 'feedback_from', 'feedback_message' ), true ) ) {
		return;
	}

	$content_fields = Grunion_Contact_Form_Plugin::parse_fields_from_content( $post_id );

	switch ( $col ) {
		case 'feedback_from':
			$author_name  = isset( $content_fields['_feedback_author'] ) ? $content_fields['_feedback_author'] : '';
			$author_email = isset( $content_fields['_feedback_author_email'] ) ? $content_fields['_feedback_author_email'] : '';
			$author_url   = isset( $content_fields['_feedback_author_url'] ) ? $content_fields['_feedback_author_url'] : '';
			$author_ip    = isset( $content_fields['_feedback_ip'] ) ? $content_fields['_feedback_ip'] : '';
			$form_url     = isset( $post->post_parent ) ? get_permalink( $post->post_parent ) : null;

			$author_name_line = '';
			if ( ! empty( $author_name ) ) {
				if ( ! empty( $author_email ) ) {
					$author_name_line = get_avatar( $author_email, 32 );
				}

				$author_name_line .= sprintf( '<strong>%s</strong><br />', esc_html( $author_name ) );
			}

			$author_email_line = '';
			if ( ! empty( $author_email ) ) {
				$author_email_line = sprintf( "<a href='%1\$s' target='_blank'>%2\$s</a><br />", esc_url( 'mailto:' . $author_email ), esc_html( $author_email ) );
			}

			$author_url_line = '';
			if ( ! empty( $author_url ) ) {
				$author_url_line = sprintf( "<a href='%1\$s'>%1\$s</a><br />", esc_url( $author_url ) );
			}

			echo $author_name_line; //phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped, Output escaped above.
			echo $author_email_line; //phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped, Output escaped above.
			echo $author_url_line; //phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped, Output escaped above.
			echo "<a href='edit.php?post_type=feedback&s=" . rawurlencode( $author_ip );
			echo "&mode=detail'>" . esc_html( $author_ip ) . '</a><br />';
			if ( $form_url ) {
				echo '<a href="' . esc_url( $form_url ) . '">' . esc_html( $form_url ) . '</a>';
			}
			break;

		case 'feedback_message':
			$post_type_object = get_post_type_object( $post->post_type );
			if ( isset( $content_fields['_feedback_subject'] ) ) {
				echo '<strong>';
				echo esc_html( $content_fields['_feedback_subject'] );
				echo '</strong>';
				echo '<br />';
			}
			echo esc_html( get_the_content( '' ) );
			echo '<br />';

			$extra_fields = get_post_meta( $post_id, '_feedback_extra_fields', true );
			if ( ! empty( $extra_fields ) ) {
				echo '<br /><hr />';
				echo '<table cellspacing="0" cellpadding="0" style="">' . "\n";
				foreach ( (array) $extra_fields as $k => $v ) {
					// Remove prefix from exta fields
					echo "<tr><td align='right'><b>" . esc_html( preg_replace( '#^\d+_#', '', $k ) ) . '</b></td><td>' . esc_html( $v ) . "</td></tr>\n";
				}
				echo '</table>';
			}

			echo '<div class="row-actions">';
			if ( $post->post_status === 'trash' ) {
				echo '<span class="untrash" id="feedback-restore-' . (int) $post_id;
				echo '"><a title="';
				echo esc_attr__( 'Restore this item from the Trash', 'jetpack' );
				echo '" href="' . esc_url( wp_nonce_url( admin_url( sprintf( $post_type_object->_edit_link . '&action=untrash', rawurlencode( $post->ID ) ) ) ), 'untrash-' . $post->post_type . '_' . $post->ID );
				echo '">' . esc_html__( 'Restore', 'jetpack' ) . '</a></span> | ';

				echo "<span class='delete'> <a class='submitdelete' title='";
				echo esc_attr( __( 'Delete this item permanently', 'jetpack' ) );
				echo "' href='" . get_delete_post_link( $post->ID, '', true );
				echo "'>" . esc_html__( 'Delete Permanently', 'jetpack' ) . '</a></span>';
				?>

<script>
jQuery(document).ready(function($) {
$('#feedback-restore-<?php echo (int) $post_id; ?>').click(function(e) {
	e.preventDefault()
	$.post(ajaxurl, {
			action: 'grunion_ajax_spam',
			post_id: '<?php echo (int) $post_id; ?>',
			make_it: 'publish',
			sub_menu: jQuery('.subsubsub .current').attr('href'),
			_ajax_nonce: <?php echo wp_json_encode( wp_create_nonce( 'grunion-post-status-' . $post_id ) ); ?>
		},
		function(r) {
			$('#post-<?php echo (int) $post_id; ?>')
				.css({backgroundColor: '#59C859'})
				.fadeOut(350, function() {
					$(this).remove();
					$('.subsubsub').html(r);
				});
		}
	);
});
});
</script>

				<?php
			} elseif ( $post->post_status === 'publish' ) {
				echo '<span class="spam" id="feedback-spam-' . esc_attr( $post_id );
				echo '"><a title="';
				echo esc_html__( 'Mark this message as spam', 'jetpack' );
				echo '" href="' . esc_url( wp_nonce_url( admin_url( 'admin-ajax.php?post_id=' . rawurlencode( $post_id ) . '&action=spam' ) ), 'spam-feedback_' . $post_id );
				echo '">Spam</a></span>';
				echo ' | ';

				echo '<span class="delete" id="feedback-trash-' . esc_attr( $post_id );
				echo '">';
				echo '<a class="submitdelete" title="' . esc_attr__( 'Trash', 'jetpack' );
				echo '" href="' . get_delete_post_link( $post_id );
				echo '">' . esc_html__( 'Trash', 'jetpack' ) . '</a></span>';

				?>

<script>
jQuery(document).ready( function($) {
	$('#feedback-spam-<?php echo (int) $post_id; ?>').click( function(e) {
		e.preventDefault();
		$.post( ajaxurl, {
				action: 'grunion_ajax_spam',
				post_id: '<?php echo (int) $post_id; ?>',
				make_it: 'spam',
				sub_menu: jQuery('.subsubsub .current').attr('href'),
				_ajax_nonce: <?php echo wp_json_encode( wp_create_nonce( 'grunion-post-status-' . $post_id ) ); ?>
			},
			function( r ) {
				$('#post-<?php echo (int) $post_id; ?>')
					.css( {backgroundColor:'#FF7979'} )
					.fadeOut(350, function() {
						$(this).remove();
						$('.subsubsub').html(r);
				});
		});
	});

	$('#feedback-trash-<?php echo (int) $post_id; ?>').click(function(e) {
		e.preventDefault();
		$.post(ajaxurl, {
				action: 'grunion_ajax_spam',
				post_id: '<?php echo (int) $post_id; ?>',
				make_it: 'trash',
				sub_menu: jQuery('.subsubsub .current').attr('href'),
				_ajax_nonce: <?php echo wp_json_encode( wp_create_nonce( 'grunion-post-status-' . $post_id ) ); ?>
			},
			function(r) {
				$('#post-<?php echo (int) $post_id; ?>')
					.css({backgroundColor: '#FF7979'})
					.fadeOut(350, function() {
						$(this).remove();
						$('.subsubsub').html(r);
					});
			}
		);
	});
});
</script>

				<?php
			} elseif ( $post->post_status === 'spam' ) {
				echo '<span class="unspam unapprove" id="feedback-ham-' . esc_attr( $post_id );
				echo '"><a title="';
				echo esc_html__( 'Mark this message as NOT spam', 'jetpack' );
				echo '" href="">Not Spam</a></span>';
				echo ' | ';

				echo "<span class='delete' id='feedback-trash-" . esc_attr( $post_id );
				echo "'> <a class='submitdelete' title='";
				echo esc_attr( __( 'Delete this item permanently', 'jetpack' ) );
				echo "' href='" . get_delete_post_link( $post->ID, '', true );
				echo "'>" . esc_html__( 'Delete Permanently', 'jetpack' ) . '</a></span>';
				?>

<script>
jQuery(document).ready( function($) {
	$('#feedback-ham-<?php echo (int) $post_id; ?>').click( function(e) {
		e.preventDefault();
		$.post( ajaxurl, {
				action: 'grunion_ajax_spam',
				post_id: '<?php echo (int) $post_id; ?>',
				make_it: 'ham',
				sub_menu: jQuery('.subsubsub .current').attr('href'),
				_ajax_nonce: <?php echo wp_json_encode( wp_create_nonce( 'grunion-post-status-' . $post_id ) ); ?>
			},
			function( r ) {
				$('#post-<?php echo (int) $post_id; ?>')
					.css( {backgroundColor:'#59C859'} )
					.fadeOut(350, function() {
						$(this).remove();
						$('.subsubsub').html(r);
				});
			});
	});
});
</script>

				<?php
			}
			break;

		case 'feedback_date':
			// translators: the time the feedback was sent.
			$date_time_format = _x( '%1$s \a\t %2$s', '{$date_format} \a\t {$time_format}', 'jetpack' );
			$date_time_format = sprintf( $date_time_format, get_option( 'date_format' ), get_option( 'time_format' ) );
			$time             = date_i18n( $date_time_format, get_the_time( 'U' ) );

			echo esc_html( $time );
			break;
	}
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
			$attributes[ $attribute ] = stripslashes( sanitize_text_field( wp_unslash( $_POST[ $attribute ] ) ) );
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
	global $post, $grunion_form;// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

	check_ajax_referer( 'grunion_shortcode_to_json' );

	if ( ! empty( $_POST['post_id'] ) && ! current_user_can( 'edit_post', sanitize_text_field( wp_unslash( $_POST['post_id'] ) ) ) ) {
		die( '-1' );
	} elseif ( ! current_user_can( 'edit_posts' ) ) {
		die( '-1' );
	}

	if ( ! isset( $_POST['content'] ) || ! is_numeric( $_POST['post_id'] ) ) {
		die( '-1' );
	}

	$content = stripslashes( sanitize_text_field( wp_unslash( $_POST['content'] ) ) );

	// doesn't look like a post with a [contact-form] already.
	if ( false === has_shortcode( $content, 'contact-form' ) ) {
		die( '' );
	}

	$post = get_post( sanitize_text_field( wp_unslash( $_POST['post_id'] ) ) ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

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

	$to      = $grunion->get_attribute( 'to' );// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	$subject = $grunion->get_attribute( 'subject' );// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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

	$post_id = isset( $_POST['post_id'] ) ? (int) $_POST['post_id'] : null;
	check_ajax_referer( 'grunion-post-status-' . $post_id );
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
			$( '#posts-filter #post-query-submit' ).after( '<?php echo $button_html;  // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- we're building the HTML to echo. ?>' );
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
