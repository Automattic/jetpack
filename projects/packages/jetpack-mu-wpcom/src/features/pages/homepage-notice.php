<?php
/**
 * Homepage notice for the Pages list.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Adds a notice about homepage settings to the Pages screen.
 */
function wpcom_add_homepage_notice() {
	$screen = get_current_screen();
	if ( ! $screen || 'edit-page' !== $screen->id ) {
		return;
	}

	if ( ! wp_is_block_theme() ) {
		return;
	}

	$show_on_front  = get_option( 'show_on_front' );
	$front_page_id  = get_option( 'page_on_front' );
	$posts_on_front = $show_on_front === 'posts' || ( $show_on_front === 'page' && ! $front_page_id );
	if ( ! $posts_on_front ) {
		return;
	}

	$can_edit     = current_user_can( 'edit_theme_options' );
	$edit_link    = admin_url( 'site-editor.php' );
	$display_text = __( 'Your homepage is set to display latest posts.', 'jetpack-mu-wpcom' );

	wp_register_style( 'wpcom-homepage-notice', false, array(), '20250310' );
	wp_enqueue_style( 'wpcom-homepage-notice' );
	wp_add_inline_style(
		'wpcom-homepage-notice',
		'
        .wpcom-homepage-notice {
            clear: both;
            max-width: none;
            margin: 8px 0;
            padding: 16px 20px;
            background: #fff;
            border: 1px solid #c3c4c7;
            box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04);
        }
        .wpcom-homepage-notice-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .wpcom-homepage-notice-text {
            margin: 0;
            font-size: 14px;
            color: #3c434a;
            line-height: 1.4;
        }
        .wpcom-homepage-notice-edit-link {
            font-size: 13px;
            padding: 4px 0;
        }
        .wpcom-homepage-notice-edit-link:hover {
            text-decoration: underline;
        }
        @media screen and (max-width: 782px) {
            .wpcom-homepage-notice-content {
                flex-direction: column;
                align-items: flex-start;
            }
            .wpcom-homepage-notice-actions {
                margin-top: 12px;
            }
        }
    '
	);

	add_action(
		'admin_footer',
		function () use ( $display_text, $can_edit, $edit_link ) {
			?>
		<script>
		(function() {
			var noticeHTML = '<div class="wpcom-homepage-notice">' +
				'<div class="wpcom-homepage-notice-content">' +
					'<div class="wpcom-homepage-notice-info">' +
						'<p class="wpcom-homepage-notice-text"><?php echo esc_js( $display_text ); ?></p>' +
					'</div>' +
					<?php if ( $can_edit ) : ?>
					'<div class="wpcom-homepage-notice-actions">' +
						'<a href="<?php echo esc_js( $edit_link ); ?>" class="wpcom-homepage-notice-edit-link">' +
							'<?php echo esc_js( __( 'Edit homepage', 'jetpack-mu-wpcom' ) ); ?>' +
						'</a>' +
					'</div>' +
					<?php endif; ?>
				'</div>' +
			'</div>';
			
			function insertNotice() {
				var div = document.createElement('div');
				div.innerHTML = noticeHTML;
				var notice = div.firstChild;
				
				var tablenav = document.querySelector('.tablenav.top');
				if (tablenav) {
					tablenav.parentNode.insertBefore(notice, tablenav);
				}
			}
			
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', insertNotice);
			} else {
				insertNotice();
			}
		})();
		</script>
			<?php
		}
	);
}

add_action( 'admin_init', 'wpcom_add_homepage_notice' );