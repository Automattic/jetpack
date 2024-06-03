<?php
/**
 * User administration panel
 *
 * @package WordPress
 * @subpackage Administration
 * @since 1.0.0
 */

/** WordPress Administration Bootstrap */
require_once __DIR__ . '/admin.php';

if ( ! current_user_can( 'list_users' ) ) {
	wp_die(
		'<h1>' . __( 'You need a higher level of permission.' ) . '</h1>' .
		'<p>' . __( 'Sorry, you are not allowed to list users.' ) . '</p>',
		403
	);
}

$wp_list_table = _get_list_table( 'WP_Users_List_Table' );
$pagenum       = $wp_list_table->get_pagenum();

// Used in the HTML title tag.
$title       = __( 'Users' );
$parent_file = 'users.php';

add_screen_option( 'per_page' );

// Contextual help - choose Help on the top right of admin panel to preview this.
get_current_screen()->add_help_tab(
	array(
		'id'      => 'overview',
		'title'   => __( 'Overview' ),
		'content' => '<p>' . __( 'This screen lists all the existing users for your site. Each user has one of five defined roles as set by the site admin: Site Administrator, Editor, Author, Contributor, or Subscriber. Users with roles other than Administrator will see fewer options in the dashboard navigation when they are logged in, based on their role.' ) . '</p>' .
						'<p>' . __( 'To add a new user for your site, click the Add New button at the top of the screen or Add New in the Users menu section.' ) . '</p>',
	)
);

get_current_screen()->add_help_tab(
	array(
		'id'      => 'screen-content',
		'title'   => __( 'Screen Content' ),
		'content' => '<p>' . __( 'You can customize the display of this screen in a number of ways:' ) . '</p>' .
						'<ul>' .
						'<li>' . __( 'You can hide/display columns based on your needs and decide how many users to list per screen using the Screen Options tab.' ) . '</li>' .
						'<li>' . __( 'You can filter the list of users by User Role using the text links above the users list to show All, Administrator, Editor, Author, Contributor, or Subscriber. The default view is to show all users. Unused User Roles are not listed.' ) . '</li>' .
						'<li>' . __( 'You can view all posts made by a user by clicking on the number under the Posts column.' ) . '</li>' .
						'</ul>',
	)
);

$help = '<p>' . __( 'Hovering over a row in the users list will display action links that allow you to manage users. You can perform the following actions:' ) . '</p>' .
	'<ul>' .
	'<li>' . __( '<strong>Edit</strong> takes you to the editable profile screen for that user. You can also reach that screen by clicking on the username.' ) . '</li>';

if ( is_multisite() ) {
	$help .= '<li>' . __( '<strong>Remove</strong> allows you to remove a user from your site. It does not delete their content. You can also remove multiple users at once by using bulk actions.' ) . '</li>';
} else {
	$help .= '<li>' . __( '<strong>Delete</strong> brings you to the Delete Users screen for confirmation, where you can permanently remove a user from your site and delete their content. You can also delete multiple users at once by using bulk actions.' ) . '</li>';
}

$help .= '<li>' . __( '<strong>View</strong> takes you to a public author archive which lists all the posts published by the user.' ) . '</li>';

if ( current_user_can( 'edit_users' ) ) {
	$help .= '<li>' . __( '<strong>Send password reset</strong> sends the user an email with a link to set a new password.' ) . '</li>';
}

$help .= '</ul>';

get_current_screen()->add_help_tab(
	array(
		'id'      => 'action-links',
		'title'   => __( 'Available Actions' ),
		'content' => $help,
	)
);
unset( $help );

get_current_screen()->set_help_sidebar(
	'<p><strong>' . __( 'For more information:' ) . '</strong></p>' .
	'<p>' . __( '<a href="https://wordpress.org/documentation/article/users-screen/">Documentation on Managing Users</a>' ) . '</p>' .
	'<p>' . __( '<a href="https://wordpress.org/documentation/article/roles-and-capabilities/">Descriptions of Roles and Capabilities</a>' ) . '</p>' .
	'<p>' . __( '<a href="https://wordpress.org/support/forums/">Support forums</a>' ) . '</p>'
);

get_current_screen()->set_screen_reader_content(
	array(
		'heading_views'      => __( 'Filter users list' ),
		'heading_pagination' => __( 'Users list navigation' ),
		'heading_list'       => __( 'Users list' ),
	)
);

if ( empty( $_REQUEST ) ) {
	$referer = '<input type="hidden" name="wp_http_referer" value="' . esc_attr( wp_unslash( $_SERVER['REQUEST_URI'] ) ) . '" />';
} elseif ( isset( $_REQUEST['wp_http_referer'] ) ) {
	$redirect = remove_query_arg( array( 'wp_http_referer', 'updated', 'delete_count' ), wp_unslash( $_REQUEST['wp_http_referer'] ) );
	$referer  = '<input type="hidden" name="wp_http_referer" value="' . esc_attr( $redirect ) . '" />';
} else {
	$redirect = 'users.php';
	$referer  = '';
}

$update = '';

switch ( $wp_list_table->current_action() ) {

	/* Bulk Dropdown menu Role changes */
	case 'promote':
		check_admin_referer( 'bulk-users' );

		if ( ! current_user_can( 'promote_users' ) ) {
			wp_die( __( 'Sorry, you are not allowed to edit this user.' ), 403 );
		}

		if ( empty( $_REQUEST['users'] ) ) {
			wp_redirect( $redirect );
			exit;
		}

		$editable_roles = get_editable_roles();
		$role           = $_REQUEST['new_role'];

		// Mocking the `none` role so we are able to save it to the database
		$editable_roles['none'] = array(
			'name' => __( '&mdash; No role for this site &mdash;' ),
		);

		if ( ! $role || empty( $editable_roles[ $role ] ) ) {
			wp_die( __( 'Sorry, you are not allowed to give users that role.' ), 403 );
		}

		if ( 'none' === $role ) {
			$role = '';
		}

		$userids = $_REQUEST['users'];
		$update  = 'promote';
		foreach ( $userids as $id ) {
			$id = (int) $id;

			if ( ! current_user_can( 'promote_user', $id ) ) {
				wp_die( __( 'Sorry, you are not allowed to edit this user.' ), 403 );
			}

			// The new role of the current user must also have the promote_users cap or be a multisite super admin.
			if ( $id == $current_user->ID && ! $wp_roles->role_objects[ $role ]->has_cap( 'promote_users' )
			&& ! ( is_multisite() && current_user_can( 'manage_network_users' ) ) ) {
					$update = 'err_admin_role';
					continue;
			}

			// If the user doesn't already belong to the blog, bail.
			if ( is_multisite() && ! is_user_member_of_blog( $id ) ) {
				wp_die(
					'<h1>' . __( 'Something went wrong.' ) . '</h1>' .
					'<p>' . __( 'One of the selected users is not a member of this site.' ) . '</p>',
					403
				);
			}

			$user = get_userdata( $id );
			$user->set_role( $role );
		}

		wp_redirect( add_query_arg( 'update', $update, $redirect ) );
		exit;

	case 'dodelete':
		if ( is_multisite() ) {
			wp_die( __( 'User deletion is not allowed from this screen.' ), 400 );
		}

		check_admin_referer( 'delete-users' );

		if ( empty( $_REQUEST['users'] ) ) {
			wp_redirect( $redirect );
			exit;
		}

		$userids = array_map( 'intval', (array) $_REQUEST['users'] );

		if ( empty( $_REQUEST['delete_option'] ) ) {
			$url = self_admin_url( 'users.php?action=delete&users[]=' . implode( '&users[]=', $userids ) . '&error=true' );
			$url = str_replace( '&amp;', '&', wp_nonce_url( $url, 'bulk-users' ) );
			wp_redirect( $url );
			exit;
		}

		if ( ! current_user_can( 'delete_users' ) ) {
			wp_die( __( 'Sorry, you are not allowed to delete users.' ), 403 );
		}

		$update       = 'del';
		$delete_count = 0;

		foreach ( $userids as $id ) {
			if ( ! current_user_can( 'delete_user', $id ) ) {
				wp_die( __( 'Sorry, you are not allowed to delete that user.' ), 403 );
			}

			if ( $id == $current_user->ID ) {
				$update = 'err_admin_del';
				continue;
			}
			switch ( $_REQUEST['delete_option'] ) {
				case 'delete':
					wp_delete_user( $id );
					break;
				case 'reassign':
					wp_delete_user( $id, $_REQUEST['reassign_user'] );
					break;
			}
			++$delete_count;
		}

		$redirect = add_query_arg(
			array(
				'delete_count' => $delete_count,
				'update'       => $update,
			),
			$redirect
		);
		wp_redirect( $redirect );
		exit;

	case 'resetpassword':
		check_admin_referer( 'bulk-users' );
		if ( ! current_user_can( 'edit_users' ) ) {
			$errors = new WP_Error( 'edit_users', __( 'Sorry, you are not allowed to edit users.' ) );
		}
		if ( empty( $_REQUEST['users'] ) ) {
			wp_redirect( $redirect );
			exit();
		}
		$userids = array_map( 'intval', (array) $_REQUEST['users'] );

		$reset_count = 0;

		foreach ( $userids as $id ) {
			if ( ! current_user_can( 'edit_user', $id ) ) {
				wp_die( __( 'Sorry, you are not allowed to edit this user.' ) );
			}

			if ( $id === $current_user->ID ) {
				$update = 'err_admin_reset';
				continue;
			}

			// Send the password reset link.
			$user = get_userdata( $id );
			if ( retrieve_password( $user->user_login ) ) {
				++$reset_count;
			}
		}

		$redirect = add_query_arg(
			array(
				'reset_count' => $reset_count,
				'update'      => 'resetpassword',
			),
			$redirect
		);
		wp_redirect( $redirect );
		exit;

	case 'delete':
		if ( is_multisite() ) {
			wp_die( __( 'User deletion is not allowed from this screen.' ), 400 );
		}

		check_admin_referer( 'bulk-users' );

		if ( empty( $_REQUEST['users'] ) && empty( $_REQUEST['user'] ) ) {
			wp_redirect( $redirect );
			exit;
		}

		if ( ! current_user_can( 'delete_users' ) ) {
			$errors = new WP_Error( 'edit_users', __( 'Sorry, you are not allowed to delete users.' ) );
		}

		if ( empty( $_REQUEST['users'] ) ) {
			$userids = array( (int) $_REQUEST['user'] );
		} else {
			$userids = array_map( 'intval', (array) $_REQUEST['users'] );
		}

		$all_userids = $userids;

		if ( in_array( $current_user->ID, $userids, true ) ) {
			$userids = array_diff( $userids, array( $current_user->ID ) );
		}

		/**
		 * Filters whether the users being deleted have additional content
		 * associated with them outside of the `post_author` and `link_owner` relationships.
		 *
		 * @since 5.2.0
		 *
		 * @param bool  $users_have_additional_content Whether the users have additional content. Default false.
		 * @param int[] $userids                       Array of IDs for users being deleted.
		 */
		$users_have_content = (bool) apply_filters( 'users_have_additional_content', false, $userids );

		if ( $userids && ! $users_have_content ) {
			if ( $wpdb->get_var( "SELECT ID FROM {$wpdb->posts} WHERE post_author IN( " . implode( ',', $userids ) . ' ) LIMIT 1' ) ) {
				$users_have_content = true;
			} elseif ( $wpdb->get_var( "SELECT link_id FROM {$wpdb->links} WHERE link_owner IN( " . implode( ',', $userids ) . ' ) LIMIT 1' ) ) {
				$users_have_content = true;
			}
		}

		if ( $users_have_content ) {
			add_action( 'admin_head', 'delete_users_add_js' );
		}

		require_once ABSPATH . 'wp-admin/admin-header.php';
		?>
	<form method="post" name="updateusers" id="updateusers">
		<?php wp_nonce_field( 'delete-users' ); ?>
		<?php echo $referer; ?>

<div class="wrap">
<h1><?php _e( 'Delete Users' ); ?></h1>
		<?php if ( isset( $_REQUEST['error'] ) ) : ?>
	<div class="error">
		<p><strong><?php _e( 'Error:' ); ?></strong> <?php _e( 'Please select an option.' ); ?></p>
	</div>
		<?php endif; ?>

		<?php if ( 1 === count( $all_userids ) ) : ?>
	<p><?php _e( 'You have specified this user for deletion:' ); ?></p>
		<?php else : ?>
	<p><?php _e( 'You have specified these users for deletion:' ); ?></p>
		<?php endif; ?>

<ul>
		<?php
		$go_delete = 0;
		foreach ( $all_userids as $id ) {
			$user = get_userdata( $id );
			if ( $id == $current_user->ID ) {
				/* translators: 1: User ID, 2: User login. */
				echo '<li>' . sprintf( __( 'ID #%1$s: %2$s <strong>The current user will not be deleted.</strong>' ), $id, $user->user_login ) . "</li>\n";
			} else {
				/* translators: 1: User ID, 2: User login. */
				echo '<li><input type="hidden" name="users[]" value="' . esc_attr( $id ) . '" />' . sprintf( __( 'ID #%1$s: %2$s' ), $id, $user->user_login ) . "</li>\n";
				$go_delete++;
			}
		}
		?>
	</ul>
		<?php
		if ( $go_delete ) :

			if ( ! $users_have_content ) :
				?>
			<input type="hidden" name="delete_option" value="delete" />
			<?php else : ?>
				<?php if ( 1 == $go_delete ) : ?>
			<fieldset><p><legend><?php _e( 'What should be done with content owned by this user?' ); ?></legend></p>
		<?php else : ?>
			<fieldset><p><legend><?php _e( 'What should be done with content owned by these users?' ); ?></legend></p>
		<?php endif; ?>
		<ul style="list-style:none;">
			<li><label><input type="radio" id="delete_option0" name="delete_option" value="delete" />
				<?php _e( 'Delete all content.' ); ?></label></li>
			<li><input type="radio" id="delete_option1" name="delete_option" value="reassign" />
				<?php
				echo '<label for="delete_option1">' . __( 'Attribute all content to:' ) . '</label> ';
				wp_dropdown_users(
					array(
						'name'    => 'reassign_user',
						'exclude' => $userids,
						'show'    => 'display_name_with_login',
					)
				);
				?>
			</li>
		</ul></fieldset>
				<?php
	endif;
			/**
			 * Fires at the end of the delete users form prior to the confirm button.
			 *
			 * @since 4.0.0
			 * @since 4.5.0 The `$userids` parameter was added.
			 *
			 * @param WP_User $current_user WP_User object for the current user.
			 * @param int[]   $userids      Array of IDs for users being deleted.
			 */
			do_action( 'delete_user_form', $current_user, $userids );
			?>
	<input type="hidden" name="action" value="dodelete" />
			<?php submit_button( __( 'Confirm Deletion' ), 'primary' ); ?>
	<?php else : ?>
	<p><?php _e( 'There are no valid users selected for deletion.' ); ?></p>
	<?php endif; ?>
	</div>
	</form>
		<?php

		break;

	case 'doremove':
		check_admin_referer( 'remove-users' );

		if ( ! is_multisite() ) {
			wp_die( __( 'You cannot remove users.' ), 400 );
		}

		if ( empty( $_REQUEST['users'] ) ) {
			wp_redirect( $redirect );
			exit;
		}

		if ( ! current_user_can( 'remove_users' ) ) {
			wp_die( __( 'Sorry, you are not allowed to remove users.' ), 403 );
		}

		$userids = $_REQUEST['users'];

		$update = 'remove';
		foreach ( $userids as $id ) {
			$id = (int) $id;
			if ( ! current_user_can( 'remove_user', $id ) ) {
				$update = 'err_admin_remove';
				continue;
			}
			remove_user_from_blog( $id, $blog_id );
		}

		$redirect = add_query_arg( array( 'update' => $update ), $redirect );
		wp_redirect( $redirect );
		exit;

	case 'remove':
		check_admin_referer( 'bulk-users' );

		if ( ! is_multisite() ) {
			wp_die( __( 'You cannot remove users.' ), 400 );
		}

		if ( empty( $_REQUEST['users'] ) && empty( $_REQUEST['user'] ) ) {
			wp_redirect( $redirect );
			exit;
		}

		if ( ! current_user_can( 'remove_users' ) ) {
			$error = new WP_Error( 'edit_users', __( 'Sorry, you are not allowed to remove users.' ) );
		}

		if ( empty( $_REQUEST['users'] ) ) {
			$userids = array( (int) $_REQUEST['user'] );
		} else {
			$userids = $_REQUEST['users'];
		}

		require_once ABSPATH . 'wp-admin/admin-header.php';
		?>
	<form method="post" name="updateusers" id="updateusers">
		<?php wp_nonce_field( 'remove-users' ); ?>
		<?php echo $referer; ?>

<div class="wrap">
<h1><?php _e( 'Remove Users from Site' ); ?></h1>

		<?php if ( 1 === count( $userids ) ) : ?>
	<p><?php _e( 'You have specified this user for removal:' ); ?></p>
		<?php else : ?>
	<p><?php _e( 'You have specified these users for removal:' ); ?></p>
		<?php endif; ?>

<ul>
		<?php
		$go_remove = false;
		foreach ( $userids as $id ) {
			$id   = (int) $id;
			$user = get_userdata( $id );
			if ( ! current_user_can( 'remove_user', $id ) ) {
				/* translators: 1: User ID, 2: User login. */
				echo '<li>' . sprintf( __( 'ID #%1$s: %2$s <strong>Sorry, you are not allowed to remove this user.</strong>' ), $id, $user->user_login ) . "</li>\n";
			} else {
				/* translators: 1: User ID, 2: User login. */
				echo "<li><input type=\"hidden\" name=\"users[]\" value=\"{$id}\" />" . sprintf( __( 'ID #%1$s: %2$s' ), $id, $user->user_login ) . "</li>\n";
				$go_remove = true;
			}
		}
		?>
	</ul>
		<?php if ( $go_remove ) : ?>
		<input type="hidden" name="action" value="doremove" />
			<?php submit_button( __( 'Confirm Removal' ), 'primary' ); ?>
	<?php else : ?>
	<p><?php _e( 'There are no valid users selected for removal.' ); ?></p>
	<?php endif; ?>
	</div>
	</form>
		<?php

		break;

	default:
		if ( ! empty( $_GET['_wp_http_referer'] ) ) {
			wp_redirect( remove_query_arg( array( '_wp_http_referer', '_wpnonce' ), wp_unslash( $_SERVER['REQUEST_URI'] ) ) );
			exit;
		}

		if ( $wp_list_table->current_action() && ! empty( $_REQUEST['users'] ) ) {
			$screen   = get_current_screen()->id;
			$sendback = wp_get_referer();
			$userids  = $_REQUEST['users'];

			/** This action is documented in wp-admin/edit.php */
			$sendback = apply_filters( "handle_bulk_actions-{$screen}", $sendback, $wp_list_table->current_action(), $userids ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores

			wp_safe_redirect( $sendback );
			exit;
		}

		$wp_list_table->prepare_items();
		$total_pages = $wp_list_table->get_pagination_arg( 'total_pages' );
		if ( $pagenum > $total_pages && $total_pages > 0 ) {
			wp_redirect( add_query_arg( 'paged', $total_pages ) );
			exit;
		}

		require_once ABSPATH . 'wp-admin/admin-header.php';

		$messages = array();
		if ( isset( $_GET['update'] ) ) :
			switch ( $_GET['update'] ) {
				case 'del':
				case 'del_many':
					$delete_count = isset( $_GET['delete_count'] ) ? (int) $_GET['delete_count'] : 0;
					if ( 1 == $delete_count ) {
						$message = __( 'User deleted.' );
					} else {
						/* translators: %s: Number of users. */
						$message = _n( '%s user deleted.', '%s users deleted.', $delete_count );
					}
					$messages[] = '<div id="message" class="updated notice is-dismissible"><p>' . sprintf( $message, number_format_i18n( $delete_count ) ) . '</p></div>';
					break;
				case 'add':
					$message = __( 'New user created.' );

					$user_id = isset( $_GET['id'] ) ? $_GET['id'] : false;
					if ( $user_id && current_user_can( 'edit_user', $user_id ) ) {
						$message .= sprintf(
							' <a href="%s">%s</a>',
							esc_url(
								add_query_arg(
									'wp_http_referer',
									urlencode( wp_unslash( $_SERVER['REQUEST_URI'] ) ),
									self_admin_url( 'user-edit.php?user_id=' . $user_id )
								)
							),
							__( 'Edit user' )
						);
					}

					$messages[] = '<div id="message" class="updated notice is-dismissible"><p>' . $message . '</p></div>';
					break;
				case 'resetpassword':
					$reset_count = isset( $_GET['reset_count'] ) ? (int) $_GET['reset_count'] : 0;
					if ( 1 === $reset_count ) {
						$message = __( 'Password reset link sent.' );
					} else {
						/* translators: %s: Number of users. */
						$message = _n( 'Password reset links sent to %s user.', 'Password reset links sent to %s users.', $reset_count );
					}
					$messages[] = '<div id="message" class="updated notice is-dismissible"><p>' . sprintf( $message, number_format_i18n( $reset_count ) ) . '</p></div>';
					break;
				case 'promote':
					$messages[] = '<div id="message" class="updated notice is-dismissible"><p>' . __( 'Changed roles.' ) . '</p></div>';
					break;
				case 'err_admin_role':
					$messages[] = '<div id="message" class="error notice is-dismissible"><p>' . __( 'The current user&#8217;s role must have user editing capabilities.' ) . '</p></div>';
					$messages[] = '<div id="message" class="updated notice is-dismissible"><p>' . __( 'Other user roles have been changed.' ) . '</p></div>';
					break;
				case 'err_admin_del':
					$messages[] = '<div id="message" class="error notice is-dismissible"><p>' . __( 'You cannot delete the current user.' ) . '</p></div>';
					$messages[] = '<div id="message" class="updated notice is-dismissible"><p>' . __( 'Other users have been deleted.' ) . '</p></div>';
					break;
				case 'remove':
					$messages[] = '<div id="message" class="updated notice is-dismissible fade"><p>' . __( 'User removed from this site.' ) . '</p></div>';
					break;
				case 'err_admin_remove':
					$messages[] = '<div id="message" class="error notice is-dismissible"><p>' . __( 'You cannot remove the current user.' ) . '</p></div>';
					$messages[] = '<div id="message" class="updated notice is-dismissible fade"><p>' . __( 'Other users have been removed.' ) . '</p></div>';
					break;
			}
		endif;
		?>

		<?php if ( isset( $errors ) && is_wp_error( $errors ) ) : ?>
		<div class="error">
			<ul>
			<?php
			foreach ( $errors->get_error_messages() as $err ) {
				echo "<li>$err</li>\n";
			}
			?>
			</ul>
		</div>
			<?php
	endif;

		if ( ! empty( $messages ) ) {
			foreach ( $messages as $msg ) {
				echo $msg;
			}
		}
		?>

	<div class="wrap">
	<h1 class="wp-heading-inline">
		<?php
		echo esc_html( $title );
		?>
</h1>

		<?php
		if ( current_user_can( 'create_users' ) ) {
			?>
	<a href="<?php echo esc_url( admin_url( 'user-new.php' ) ); ?>" class="page-title-action"><?php echo esc_html_x( 'Add New', 'user' ); ?></a>
<?php } elseif ( is_multisite() && current_user_can( 'promote_users' ) ) { ?>
	<a href="<?php echo esc_url( admin_url( 'user-new.php' ) ); ?>" class="page-title-action"><?php echo esc_html_x( 'Add Existing', 'user' ); ?></a>
			<?php
}

if ( strlen( $usersearch ) ) {
	echo '<span class="subtitle">';
	printf(
		/* translators: %s: Search query. */
		__( 'Search results for: %s' ),
		'<strong>' . esc_html( $usersearch ) . '</strong>'
	);
	echo '</span>';
}
?>

<hr class="wp-header-end">

		<?php $wp_list_table->views(); ?>

<form method="get">

		<?php $wp_list_table->search_box( __( 'Search Users' ), 'user' ); ?>

		<?php if ( ! empty( $_REQUEST['role'] ) ) { ?>
<input type="hidden" name="role" value="<?php echo esc_attr( $_REQUEST['role'] ); ?>" />
<?php } ?>

		<?php $wp_list_table->display(); ?>
</form>

<div class="clear"></div>
</div>
		<?php
		break;

} // End of the $doaction switch.

require_once ABSPATH . 'wp-admin/admin-footer.php';
