<?php

function grunion_menu_alter() {
	wp_enqueue_style( 'grunion-menu-alter', plugins_url( 'css/menu-alter.css', __FILE__ ) );
}

add_action( 'admin_enqueue_scripts', 'grunion_menu_alter' );

/**
 * Add a contact form button to the post composition screen
 */
add_action( 'media_buttons', 'grunion_media_button', 999 );
function grunion_media_button( ) {
	global $post_ID, $temp_ID;
	$iframe_post_id = (int) (0 == $post_ID ? $temp_ID : $post_ID);
	$title = esc_attr( __( 'Add a custom form', 'jetpack' ) );
	$plugin_url = esc_url( GRUNION_PLUGIN_URL );
	$site_url = esc_url( admin_url( "/admin-ajax.php?post_id={$iframe_post_id}&action=grunion_form_builder&TB_iframe=true&width=768" ) );
	?>

	<a id="insert-jetpack-contact-form" class="button thickbox" title="<?php esc_html_e( 'Add Contact Form', 'jetpack' ); ?>" data-editor="content" href="<?php echo $site_url ?>&id=add_form">
		<span class="jetpack-contact-form-icon"></span> <?php esc_html_e( 'Add Contact Form', 'jetpack' ); ?>
	</a>

	<?php
}

add_action( 'wp_ajax_grunion_form_builder', 'display_form_view' );

function display_form_view() {
	require_once GRUNION_PLUGIN_DIR . 'grunion-form-view.php';
	exit;
}

// feedback specific css items
add_action( 'admin_print_styles', 'grunion_admin_css' );
function grunion_admin_css() {
	global $current_screen;
	if ( ! in_array( $current_screen->id, array( 'edit-feedback', 'jetpack_page_omnisearch', 'dashboard_page_omnisearch' ) ) )
		return;

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

#icon-edit.icon32-posts-feedback, #icon-post.icon32-posts-feedback { background: url("<?php echo GRUNION_PLUGIN_URL; ?>images/grunion-menu-big.png") no-repeat !important; }
@media only screen and (-moz-min-device-pixel-ratio: 1.5), only screen and (-o-min-device-pixel-ratio: 3/2), only screen and (-webkit-min-device-pixel-ratio: 1.5), only screen and (min-device-pixel-ratio: 1.5) {
    #icon-edit.icon32-posts-feedback, #icon-post.icon32-posts-feedback { background: url("<?php echo GRUNION_PLUGIN_URL; ?>images/grunion-menu-big-2x.png") no-repeat !important; background-size: 30px 31px !important; }
}

#icon-edit.icon32-posts-feedback { background-position: 2px 2px !important; }

</style>

<?php
}

/**
 * Hack a 'Bulk Spam' option for bulk edit
 * There isn't a better way to do this until
 * http://core.trac.wordpress.org/changeset/17297 is resolved
 */
add_action( 'admin_head', 'grunion_add_bulk_edit_option' );
function grunion_add_bulk_edit_option() {

	$screen = get_current_screen();

	if ( 'edit-feedback' != $screen->id
	|| ( ! empty( $_GET['post_status'] ) && 'spam' == $_GET['post_status'] ) )
		return;

	$spam_text = __( 'Mark Spam', 'jetpack' );
	?>
		<script type="text/javascript">
			jQuery(document).ready(function($) {
				$('#posts-filter .actions select[name=action] option:first-child').after('<option value="spam"><?php echo esc_attr( $spam_text ); ?></option>' );
			})
		</script>
	<?php
}

/**
 * Handle a bulk spam report
 */
add_action( 'admin_init', 'grunion_handle_bulk_spam' );
function grunion_handle_bulk_spam() {
	global $pagenow;

	if ( 'edit.php' != $pagenow
	|| ( empty( $_REQUEST['post_type'] ) || 'feedback' != $_REQUEST['post_type'] ) )
		return;

	// Slip in a success message
	if ( ! empty( $_REQUEST['message'] ) && 'marked-spam' == $_REQUEST['message'] )
		add_action( 'admin_notices', 'grunion_message_bulk_spam' );

	if ( empty( $_REQUEST['action'] ) || 'spam' != $_REQUEST['action'] )
		return;

	check_admin_referer('bulk-posts');

	if ( empty( $_REQUEST['post'] ) ) {
		wp_safe_redirect( wp_get_referer() );
		exit;
	}

	$post_ids = array_map( 'intval', $_REQUEST['post'] );

	foreach( $post_ids as $post_id ) {
		if ( ! current_user_can( "edit_page", $post_id ) )
			wp_die( __( 'You are not allowed to manage this item.', 'jetpack' ) );

		$post = array(
				'ID'           => $post_id,
				'post_status'  => 'spam',
			);
		$akismet_values = get_post_meta( $post_id, '_feedback_akismet_values', true );
		wp_update_post( $post );
		do_action( 'contact_form_akismet', 'spam', $akismet_values );
	}

	$redirect_url = add_query_arg( 'message', 'marked-spam', wp_get_referer() );
	wp_safe_redirect( $redirect_url );
	exit;
}

function grunion_message_bulk_spam() {
	echo '<div class="updated"><p>' . __( 'Feedback(s) marked as spam', 'jetpack' ) . '</p></div>';
}

// remove admin UI parts that we don't support in feedback management
add_action( 'admin_menu', 'grunion_admin_menu' );
function grunion_admin_menu() {
	global $menu, $submenu;
	unset( $submenu['edit.php?post_type=feedback'] );
}

add_filter( 'bulk_actions-edit-feedback', 'grunion_admin_bulk_actions' );
function grunion_admin_bulk_actions( $actions ) {
	global $current_screen;
	if ( 'edit-feedback' != $current_screen->id )
		return $actions;

	unset( $actions['edit'] );
	return $actions;
}

add_filter( 'views_edit-feedback', 'grunion_admin_view_tabs' );
function grunion_admin_view_tabs( $views ) {
	global $current_screen;
	if ( 'edit-feedback' != $current_screen->id )
		return $actions;

	unset( $views['publish'] );

	preg_match( '|post_type=feedback\'( class="current")?\>(.*)\<span class=|', $views['all'], $match );
	if ( !empty( $match[2] ) )
		$views['all'] = str_replace( $match[2], 'Messages ', $views['all'] );

	return $views;
}

add_filter( 'manage_feedback_posts_columns', 'grunion_post_type_columns_filter' );
function grunion_post_type_columns_filter( $cols ) {
	$cols = array(
		'cb'	=> '<input type="checkbox" />',
		'feedback_from'		=> __( 'From', 'jetpack' ),
		'feedback_message'		=> __( 'Message', 'jetpack' ),
		'feedback_date'			=> __( 'Date', 'jetpack' )
	);

	return $cols;
}

add_action( 'manage_posts_custom_column', 'grunion_manage_post_columns', 10, 2 );
function grunion_manage_post_columns( $col, $post_id ) {
	global $post;

	switch ( $col ) {
		case 'feedback_from':
			$author_name = get_post_meta( $post_id, '_feedback_author', TRUE );
			$author_email = get_post_meta( $post_id, '_feedback_author_email', TRUE );
			$author_url = get_post_meta( $post_id, '_feedback_author_url', TRUE );
			$author_ip = get_post_meta( $post_id, '_feedback_ip', TRUE );
			$form_url = get_post_meta( $post_id, '_feedback_contact_form_url', TRUE );

			$author_name_line = '';
			if ( !empty( $author_name ) ) {
				if ( !empty( $author_email ) )
					$author_name_line = get_avatar( $author_email, 32 );

				$author_name_line .= "<strong>{$author_name}</strong><br />";
			}

			$author_email_line = '';
			if ( !empty( $author_email ) ) {
				$author_email_line = "<a href='mailto:{$author_email}'>";
				$author_email_line .= "{$author_email}</a><br />";
			}

			$author_url_line = '';
			if ( !empty( $author_url ) ) {
				$author_url_line = "<a href='{$author_url}'>";
				$author_url_line .= "{$author_url}</a><br />";

			}

			echo $author_name_line;
			echo $author_email_line;
			echo $author_url_line;
			echo "<a href='edit.php?post_type=feedback&s={$author_ip}";
			echo "&mode=detail'>{$author_ip}</a><br />";
			echo "<a href='{$form_url}'>{$form_url}</a>";
			break;

		case 'feedback_message':
			$post = get_post( $post_id );
			$post_type_object = get_post_type_object( $post->post_type );
			echo '<strong>';
			echo esc_html( get_post_meta( $post_id, '_feedback_subject', TRUE ) );
			echo '</strong><br />';
			echo sanitize_text_field( get_the_content( '' ) );
			echo '<br />';

			$extra_fields = get_post_meta( $post_id, '_feedback_extra_fields', TRUE );
			if ( !empty( $extra_fields ) ) {
				echo '<br /><hr />';
				echo '<table cellspacing="0" cellpadding="0" style="">' . "\n";
				foreach ( (array) $extra_fields as $k => $v ) {
					echo "<tr><td align='right'><b>". esc_html( $k ) ."</b></td><td>". sanitize_text_field( $v ) ."</td></tr>\n";
				}
				echo '</table>';
			}

			echo '<div class="row-actions">';
			if ( $post->post_status == 'trash' ) {
				echo '<span class="untrash" id="feedback-restore-' . $post_id;
				echo '"><a title="';
				echo esc_attr__( 'Restore this item from the Trash', 'jetpack' );
				echo '" href="' . wp_nonce_url( admin_url( sprintf( $post_type_object->_edit_link . '&amp;action=untrash', $post->ID ) ), 'untrash-' . $post->post_type . '_' . $post->ID );
				echo '">' . __( 'Restore', 'jetpack' ) . '</a></span> | ';

				echo "<span class='delete'> <a class='submitdelete' title='";
				echo esc_attr( __( 'Delete this item permanently', 'jetpack' ) );
				echo "' href='" . get_delete_post_link( $post->ID, '', true );
				echo "'>" . __( 'Delete Permanently', 'jetpack' ) . "</a></span>";
?>

<script>
jQuery(document).ready(function($) {
$('#feedback-restore-<?php echo $post_id; ?>').click(function(e) {
	e.preventDefault();
	$.post(ajaxurl, {
			action: 'grunion_ajax_spam',
			post_id: '<?php echo $post_id; ?>',
			make_it: 'publish',
			sub_menu: jQuery('.subsubsub .current').attr('href'),
			_ajax_nonce: '<?php echo wp_create_nonce( 'grunion-post-status-' . $post_id ); ?>'
		},
		function(r) {
			$('#post-<?php echo $post_id; ?>')
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
			} elseif ( $post->post_status == 'publish' ) {
				echo '<span class="spam" id="feedback-spam-' . $post_id;
				echo '"><a title="';
				echo __( 'Mark this message as spam', 'jetpack' );
				echo '" href="' . wp_nonce_url( admin_url( 'admin-ajax.php?post_id=' . $post_id . '&amp;action=spam' ), 'spam-feedback_' . $post_id );
				echo '">Spam</a></span>';
				echo ' | ';

				echo '<span class="delete" id="feedback-trash-' . $post_id;
				echo '">';
				echo '<a class="submitdelete" title="' . esc_attr__( 'Trash', 'jetpack' );
				echo '" href="' . get_delete_post_link( $post_id );
				echo '">' . __( 'Trash', 'jetpack' ) . '</a></span>';

?>

<script>
jQuery(document).ready( function($) {
	$('#feedback-spam-<?php echo $post_id; ?>').click( function(e) {
		e.preventDefault();
		$.post( ajaxurl, {
				action: 'grunion_ajax_spam',
				post_id: '<?php echo $post_id; ?>',
				make_it: 'spam',
				sub_menu: jQuery('.subsubsub .current').attr('href'),
				_ajax_nonce: '<?php echo wp_create_nonce( 'grunion-post-status-' . $post_id ); ?>'
			},
			function( r ) {
				$('#post-<?php echo $post_id; ?>')
					.css( {backgroundColor:'#FF7979'} )
					.fadeOut(350, function() {
						$(this).remove();
						$('.subsubsub').html(r);
				});
		});
	});

	$('#feedback-trash-<?php echo $post_id; ?>').click(function(e) {
		e.preventDefault();
		$.post(ajaxurl, {
				action: 'grunion_ajax_spam',
				post_id: '<?php echo $post_id; ?>',
				make_it: 'trash',
				sub_menu: jQuery('.subsubsub .current').attr('href'),
				_ajax_nonce: '<?php echo wp_create_nonce( 'grunion-post-status-' . $post_id ); ?>'
			},
			function(r) {
				$('#post-<?php echo $post_id; ?>')
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
			} elseif ( $post->post_status == 'spam' ) {
				echo '<span class="unspam unapprove" id="feedback-ham-' . $post_id;
				echo '"><a title="';
				echo __( 'Mark this message as NOT spam', 'jetpack' );
				echo '" href="">Not Spam</a></span>';
				echo ' | ';

				echo "<span class='delete' id='feedback-trash-" . $post_id;
				echo "'> <a class='submitdelete' title='";
				echo esc_attr( __( 'Delete this item permanently', 'jetpack' ) );
				echo "' href='" . get_delete_post_link( $post->ID, '', true );
				echo "'>" . __( 'Delete Permanently', 'jetpack' ) . "</a></span>";
?>

<script>
jQuery(document).ready( function($) {
	$('#feedback-ham-<?php echo $post_id; ?>').click( function(e) {
		e.preventDefault();
		$.post( ajaxurl, {
				action: 'grunion_ajax_spam',
				post_id: '<?php echo $post_id; ?>',
				make_it: 'ham',
				sub_menu: jQuery('.subsubsub .current').attr('href'),
				_ajax_nonce: '<?php echo wp_create_nonce( 'grunion-post-status-' . $post_id ); ?>'
			},
			function( r ) {
				$('#post-<?php echo $post_id; ?>')
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

			$date_time_format = _x( '%1$s \a\t %2$s', '{$date_format} \a\t {$time_format}', 'jetpack' );
			$date_time_format = sprintf( $date_time_format, get_option( 'date_format' ), get_option( 'time_format' ) );
			$time = date_i18n( $date_time_format, get_the_time( 'U' ) );

			echo $time;
			break;
	}
}

function grunion_esc_attr( $attr ) {
	$out = esc_attr( $attr );
	// we also have to entity-encode square brackets so they don't interfere with the shortcode parser
	// FIXME: do this better - just stripping out square brackets for now since they mysteriously keep reappearing
	$out = str_replace( '[', '', $out );
	$out = str_replace( ']', '', $out );
	return $out;
}

function grunion_sort_objects( $a, $b ) {
	if ( isset($a['order']) && isset($b['order']) )
		return $a['order'] - $b['order'];
	return 0;
}

// take an array of field types from the form builder, and construct a shortcode form
// returns both the shortcode form, and HTML markup representing a preview of the form
function grunion_ajax_shortcode() {
	check_ajax_referer( 'grunion_shortcode' );

	$attributes = array();

	foreach ( array( 'subject', 'to' ) as $attribute ) {
		if ( isset( $_POST[$attribute] ) && strlen( $_POST[$attribute] ) ) {
			$attributes[$attribute] = stripslashes( $_POST[$attribute] );
		}
	}

	if ( is_array( $_POST['fields'] ) ) {
		$fields = stripslashes_deep( $_POST['fields'] );
		usort( $fields, 'grunion_sort_objects' );

		$field_shortcodes = array();

		foreach ( $fields as $field ) {
			$field_attributes = array();

			if ( isset( $field['required'] ) && 'true' === $field['required'] ) {
				$field_attributes['required'] = 'true';
			}

			foreach ( array( 'options', 'label', 'type' ) as $attribute ) {
				if ( isset( $field[$attribute] ) ) {
					$field_attributes[$attribute] = $field[$attribute];
				}
			}

			$field_shortcodes[] = new Grunion_Contact_Form_Field( $field_attributes );
		}
	}

	$grunion = new Grunion_Contact_Form( $attributes, $field_shortcodes );

	die( "\n$grunion\n" );
}

// takes a post_id, extracts the contact-form shortcode from that post (if there is one), parses it,
// and constructs a json object representing its contents and attributes
function grunion_ajax_shortcode_to_json() {
	global $post, $grunion_form;

	check_ajax_referer( 'grunion_shortcode_to_json' );

	if ( !isset( $_POST['content'] ) || !is_numeric( $_POST['post_id'] ) ) {
		die( '-1' );
	}

	$content = stripslashes( $_POST['content'] );

	// doesn't look like a post with a [contact-form] already.
	if ( false === strpos( $content, '[contact-form' ) ) {
		die( '' );
	}

	$post = get_post( $_POST['post_id'] );

	do_shortcode( $content );

	$grunion = Grunion_Contact_Form::$last;

	$out = array(
		'to'      => '',
		'subject' => '',
		'fields'  => array(),
	);

	foreach ( $grunion->fields as $field ) {
		$out['fields'][$field->get_attribute( 'id' )] = $field->attributes;
	}

	$to = $grunion->get_attribute( 'to' );
	$subject = $grunion->get_attribute( 'subject' );
	foreach ( array( 'to', 'subject' ) as $attribute ) {
		$value = $grunion->get_attribute( $attribute );
		if ( isset( $grunion->defaults[$attribute] ) && $value == $grunion->defaults[$attribute] ) {
			$value = '';
		}
		$out[$attribute] = $value;
	}

	die( json_encode( $out ) );
}


add_action( 'wp_ajax_grunion_shortcode', 'grunion_ajax_shortcode' );
add_action( 'wp_ajax_grunion_shortcode_to_json', 'grunion_ajax_shortcode_to_json' );


// process row-action spam/not spam clicks
add_action( 'wp_ajax_grunion_ajax_spam', 'grunion_ajax_spam' );
function grunion_ajax_spam() {
	global $wpdb;

	if ( empty( $_POST['make_it'] ) )
		return;

	$post_id = (int) $_POST['post_id'];
	check_ajax_referer( 'grunion-post-status-' . $post_id );
	if ( !current_user_can("edit_page", $post_id) )
		wp_die( __( 'You are not allowed to manage this item.', 'jetpack' ) );

	require_once dirname( __FILE__ ) . '/grunion-contact-form.php';

	$current_menu = '';
	if ( preg_match( '|post_type=feedback|', $_POST['sub_menu'] ) ) {
		if ( preg_match( '|post_status=spam|', $_POST['sub_menu'] ) )
			$current_menu = 'spam';
		else if ( preg_match( '|post_status=trash|', $_POST['sub_menu'] ) )
			$current_menu = 'trash';
		else
			$current_menu = 'messages';

	}

	$post = get_post( $post_id );
	$post_type_object = get_post_type_object( $post->post_type );
	$akismet_values = get_post_meta( $post_id, '_feedback_akismet_values', TRUE );
	if ( $_POST['make_it'] == 'spam' ) {
		$post->post_status = 'spam';
		$status = wp_insert_post( $post );
		wp_transition_post_status( 'spam', 'publish', $post );
		do_action( 'contact_form_akismet', 'spam', $akismet_values );
	} elseif ( $_POST['make_it'] == 'ham' ) {
		$post->post_status = 'publish';
		$status = wp_insert_post( $post );
		wp_transition_post_status( 'publish', 'spam', $post );
		do_action( 'contact_form_akismet', 'spam', $akismet_values );

		// resend the original email
		$email = get_post_meta( $post_id, '_feedback_email', TRUE );
		wp_mail( $email['to'], $email['subject'], $email['message'], $email['headers'] );
	} elseif( $_POST['make_it'] == 'publish' ) {
		if ( !current_user_can($post_type_object->cap->delete_post, $post_id) )
			wp_die( __( 'You are not allowed to move this item out of the Trash.', 'jetpack' ) );

		if ( ! wp_untrash_post($post_id) )
			wp_die( __( 'Error in restoring from Trash.', 'jetpack' ) );

	} elseif( $_POST['make_it'] == 'trash' ) {
		if ( !current_user_can($post_type_object->cap->delete_post, $post_id) )
			wp_die( __( 'You are not allowed to move this item to the Trash.', 'jetpack' ) );

		if ( ! wp_trash_post($post_id) )
			wp_die( __( 'Error in moving to Trash.', 'jetpack' ) );

	}

	$sql = "
		SELECT post_status,
			COUNT( * ) AS post_count
		FROM `{$wpdb->posts}`
		WHERE post_type =  'feedback'
		GROUP BY post_status
	";
	$status_count = (array) $wpdb->get_results( $sql, ARRAY_A );

	$status = array();
	$status_html = '';
	foreach ( $status_count as $i => $row ) {
		$status[$row['post_status']] = $row['post_count'];
	}

	if ( isset( $status['publish'] ) ) {
		$status_html .= '<li><a href="edit.php?post_type=feedback"';
		if ( $current_menu == 'messages' )
			$status_html .= ' class="current"';

		$status_html .= '>' . __( 'Messages', 'jetpack' ) . ' <span class="count">';
		$status_html .= '(' . number_format( $status['publish'] ) . ')';
		$status_html .= '</span></a> |</li>';
	}

	if ( isset( $status['trash'] ) ) {
		$status_html .= '<li><a href="edit.php?post_status=trash&amp;post_type=feedback"';
		if ( $current_menu == 'trash' )
			$status_html .= ' class="current"';

		$status_html .= '>' . __( 'Trash', 'jetpack' ) . ' <span class="count">';
		$status_html .= '(' . number_format( $status['trash'] ) . ')';
		$status_html .= '</span></a>';
		if ( isset( $status['spam'] ) )
			$status_html .= ' |';
		$status_html .= '</li>';
	}

	if ( isset( $status['spam'] ) ) {
		$status_html .= '<li><a href="edit.php?post_status=spam&amp;post_type=feedback"';
		if ( $current_menu == 'spam' )
			$status_html .= ' class="current"';

		$status_html .= '>' . __( 'Spam', 'jetpack' ) . ' <span class="count">';
		$status_html .= '(' . number_format( $status['spam'] ) . ')';
		$status_html .= '</span></a></li>';
	}

	echo $status_html;
	exit;
}

add_action( 'omnisearch_add_providers', 'grunion_omnisearch_add_providers' );
function grunion_omnisearch_add_providers() {
	// Feedback uses capability_type 'page'
	if ( current_user_can( 'edit_pages' ) ) {
		require_once( GRUNION_PLUGIN_DIR . '/grunion-omnisearch.php' );
		new Jetpack_Omnisearch_Grunion;
	}
}
