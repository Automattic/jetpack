<?php // phpcs:ignore Squiz.Commenting.FileComment.MissingPackageTag
/**
 * File copied from WP.com
 */

add_action(
	'widgets_init',
	function () {
		unregister_widget( 'WP_Widget_Recent_Comments' );

		register_widget( 'WPCOM_Widget_Recent_Comments' );
	}
);

/**
 * A WordPress.com Reservations widget.
 */
class WPCOM_Widget_Recent_Comments extends WP_Widget {
	/**
	 * Alt option name.
	 *
	 * @var string $alt_option_name
	 */
	public $alt_option_name = 'widget_recent_comments';

	/**
	 * Allowed post types.
	 *
	 * @var string[] $allowed_post_types
	 */
	private static $allowed_post_types = null;

	/**
	 * Widget default settings.
	 *
	 * @var array $widget_defaults
	 */
	protected static $widget_defaults = array(
		'title'       => '',
		'number'      => 5,
		'avatar_size' => 48,
		'avatar_bg'   => '',
		'text_bg'     => '',
		'post_types'  => array( 'post' ),
	);

	/**
	 * Constructor
	 */
	public function __construct() {
		parent::__construct(
			'recent-comments',
			__( 'Recent Comments', 'wpcomsh' ),
			array(
				'classname'   => 'widget_recent_comments',
				'description' => __( 'Display your site\'s most recent comments', 'wpcomsh' ),
			)
		);

		if ( is_active_widget( false, false, 'recent-comments', false ) ) {
			add_action( 'wp_head', array( $this, 'style' ) );

			add_action( 'comment_post', array( $this, 'flush_cache' ) );
			add_action( 'wp_set_comment_status', array( $this, 'flush_cache' ) );
			add_action( 'transition_comment_status', array( $this, 'flush_cache' ) );
		}
	}

	/**
	 * Output style tag for widget.
	 */
	public function style() {
		?>
		<style type="text/css">
			.recentcomments a {
				display: inline !important;
				padding: 0 !important;
				margin: 0 !important;
			}

			table.recentcommentsavatartop img.avatar, table.recentcommentsavatarend img.avatar {
				border: 0px;
				margin: 0;
			}

			table.recentcommentsavatartop a, table.recentcommentsavatarend a {
				border: 0px !important;
				background-color: transparent !important;
			}

			td.recentcommentsavatarend, td.recentcommentsavatartop {
				padding: 0px 0px 1px 0px;
				margin: 0px;
			}

			td.recentcommentstextend {
				border: none !important;
				padding: 0px 0px 2px 10px;
			}

			.rtl td.recentcommentstextend {
				padding: 0px 10px 2px 0px;
			}

			td.recentcommentstexttop {
				border: none;
				padding: 0px 0px 0px 10px;
			}

			.rtl td.recentcommentstexttop {
				padding: 0px 10px 0px 0px;
			}
		</style>
		<?php
	}

	/**
	 * Flush cache.
	 */
	public function flush_cache() {
		wp_cache_set( 'recent-comments-cache-buster', time(), 'widget' );
	}

	/**
	 * Get cache key.
	 */
	protected function get_cache_key() {
		$cache_buster = wp_cache_get( 'recent-comments-cache-buster', 'widget' );

		if ( $cache_buster === false ) {
			$cache_buster = time();
			wp_cache_add( 'recent-comments-cache-buster', $cache_buster, 'widget' );
		}

		// recent-comments-{number}-{timestamp}
		return "{$this->id}-{$cache_buster}";
	}

	/**
	 * Check if post is public.
	 *
	 * @param WP_Post            $post Post object.
	 * @param array|string|false $post_types Post type(s) that should have comments.
	 *
	 * @return bool True if post checks out, otherwise false.
	 */
	public function is_post_public( $post, $post_types = false ) {
		// For what post types should we display comments?
		if ( is_string( $post_types ) ) {
			$post_types = array( $post_types );
		} elseif ( ! is_array( $post_types ) || empty( $post_types ) ) {
			$post_types = self::$widget_defaults['post_types'];
		}

		$post_types = array_intersect( $post_types, array_keys( $this->get_allowed_post_types() ) );

		// If we're dealing with a comment on an attachment page, base its display off of the parent post's status, but only if it has a parent.
		if ( 'attachment' === $post->post_type ) {
			if ( ! in_array( 'attachment', $post_types, true ) ) {
				return false;
			}

			$parent_post = get_post( $post->post_parent );
			if ( ! empty( $parent_post ) ) {
				$post = $parent_post;
			}
		}

		// Limit to comments on chosen types of content
		if ( ! in_array( $post->post_type, $post_types, true ) ) {
			return false;
		}

		if ( ! empty( $post->post_password ) ) {
			return false;
		}

		// Hooray, all of our checks passed!
		return true;
	}

	/**
	 * Display the widget.
	 *
	 * @param array $args     Widget arguments.
	 * @param array $instance Widget instance.
	 */
	public function widget( $args, $instance ) {
		$instance = wp_parse_args( $instance, self::$widget_defaults );

		if ( empty( $instance['title'] ) ) {
			$instance['title'] = __( 'Recent Comments', 'wpcomsh' );
		} else {
			$instance['title'] = apply_filters( 'widget_title', $instance['title'] );
		}

		$instance['number'] = (int) $instance['number'];

		if ( ! $instance['number'] ) {
			$instance['number'] = 5;
		} else {
			$instance['number'] = max( 1, min( 15, $instance['number'] ) );
		}

		$instance['avatar_size'] = (int) $instance['avatar_size'] ? (int) $instance['avatar_size'] : 48;

		$comments = wp_cache_get( $this->get_cache_key(), 'widget' );

		if ( ! $comments ) {
			$comments        = array();
			$comments_offset = 0;
			$loop_counter    = 0;
			$number_of_items = 30;

			// phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			while ( $comments_scoop = get_comments(
				array(
					'number' => $number_of_items,
					'offset' => $comments_offset,
					'status' => 'approve',
				)
			) ) {
				$posts    = get_posts(
					array(
						'ignore_sticky_posts' => true,
						'orderby'             => 'post__in',
						'posts_per_page'      => $number_of_items,
						'post_type'           => $instance['post_types'],
						'post__in'            => array_unique( wp_list_pluck( $comments_scoop, 'comment_post_ID' ) ),
						'suppress_filters'    => false,
						'post_status'         => array( 'inherit', 'publish' ),
					)
				);
				$post_ids = wp_list_pluck( $posts, 'ID' );

				// get_posts() will not fetch private posts or invalid post types, despite post__in. Filter those out of $comments_scoop.
				if ( $post_ids ) {
					foreach ( $comments_scoop as $index => $comment ) {
						if ( ! in_array( (int) $comment->comment_post_ID, $post_ids, true ) ) {
							unset( $comments_scoop[ $index ] );
						}
					}

					// If no posts were found, we either: 1) requested comments for wrong post type or status, or 2) found orphaned comments.
				} else {
					$comments_scoop = array();
				}

				// Do we have any comments that've passed our initial scrutiny?
				if ( $comments_scoop ) {
					foreach ( $posts as $post ) {
						if ( ! self::is_post_public( $post, $instance['post_types'] ) ) {
							$comments_scoop = wp_filter_object_list( $comments_scoop, array( 'comment_post_ID' => $post->ID ), 'NOT' );
						}
					}
				}

				$comments = array_merge( $comments, $comments_scoop );

				// Do we have enough comments yet?
				if ( count( $comments ) >= $instance['number'] ) {

					// We do. Trim out exactly how many we want, and stop looping.
					$comments = array_slice( $comments, 0, $instance['number'] );
					break;
				}

				$comments_offset += $number_of_items;
				++$loop_counter;

				// Prevent sites with many comments and many blog posts causing many queries for certain widget configs.
				if ( $loop_counter >= 3 ) {
					break;
				}
			}

			if ( ! empty( $comments ) ) {
				wp_cache_set( $this->get_cache_key(), $comments, 'widget' );
			}
		}

		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		if ( $comments ) {
			if ( isset( $instance['avatar_size'] ) && $instance['avatar_size'] != 1 ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual
				$avatar_bg = empty( $instance['avatar_bg'] ) ? '' : 'background: ' . $instance['avatar_bg'] . ';';
				$text_bg   = empty( $instance['text_bg'] ) ? '' : 'background: ' . $instance['text_bg'] . ';';

				?>
				<table class="recentcommentsavatar" cellspacing="0" cellpadding="0" border="0">
					<?php
					$comments_printed = 0;

					foreach ( $comments as $comment_index => $comment ) {
						if ( $instance['number'] <= $comments_printed ) {
							break;
						}

						$avatar = get_avatar( $comment, $instance['avatar_size'] );

						if ( $comment->comment_author_url ) {
							$avatar = '<a href="' . esc_url( $comment->comment_author_url ) . '" rel="nofollow">' . $avatar . '</a>';
						}

						echo '<tr><td title="' . esc_attr( $comment->comment_author ) . '" class="' . esc_attr( $comment_index === 0 ? 'recentcommentsavatartop' : 'recentcommentsavatarend' ) . '" style="' . esc_attr( 'height:' . $instance['avatar_size'] . 'px; width:' . $instance['avatar_size'] . 'px;' . $avatar_bg ) . '">';
						echo $avatar; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- as $avatar has <img> tag.
						echo '</td>';
						echo '<td class="' . esc_attr( $comment_index === 0 ? 'recentcommentstexttop' : 'recentcommentstextend' ) . '" style="' . esc_attr( $text_bg ) . '">';

						if ( $comment->comment_author === '' ) {
							$comment->comment_author = __( 'Anonymous', 'wpcomsh' );
						}

						$author  = $comment->comment_author;
						$excerpt = wp_html_excerpt( $author, 20 );

						if ( $author !== $excerpt ) {
							$author = $excerpt . '&hellip;';
						}

						if ( $comment->comment_author_url === '' ) {
							$authorlink = esc_html( $author );
						} else {
							$authorlink = '<a href="' . esc_url( $comment->comment_author_url ) . '" rel="nofollow">' . esc_html( $author ) . '</a>';
						}

						$post_title = get_the_title( $comment->comment_post_ID );
						$excerpt    = wp_html_excerpt( $post_title, 30 );

						if ( $post_title !== $excerpt ) {
							$post_title = $excerpt . '&hellip;';
						}

						if ( empty( $post_title ) ) {
							$post_title = '&hellip;';
						}

						printf(
							wp_kses(
								/* translators: comments widget: 1: comment author, 2: comment link, 3: comment title */
								_x( '%1$s on <a href="%2$s">%3$s</a>', 'widgets', 'wpcomsh' ),
								array(
									'a' => array(
										'href' => array(),
										'rel'  => array(),
									),
								)
							),
							$authorlink, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- may contain HTML but already escaped
							esc_url( get_comment_link( $comment ) ),
							esc_html( $post_title )
						);

						echo '</td></tr>';

						++$comments_printed;
					}

					if ( 0 === $comments_printed ) {
						echo '<tr><td class="recentcommentstexttop" style="' . esc_attr( $text_bg ) . '">';
						esc_html_e( 'There are no public comments available to display.', 'wpcomsh' );
						echo '</td></tr>';
					}

					?>
				</table>
				<?php

			} else {
				?>
				<ul id="recentcomments">
					<?php
					$comments_printed = 0;

					foreach ( $comments as $comment ) {
						if ( $instance['number'] <= $comments_printed ) {
							break;
						}
						?>
						<li class="recentcomments">
							<?php

							printf(
								wp_kses(
									/* translators: comments widget: 1: comment author link HTML, 2: comment link, 3: comment title */
									_x( '%1$s on <a href="%2$s">%3$s</a>', 'widgets', 'wpcomsh' ),
									array(
										'a' => array( 'href' => array() ),
									)
								),
								get_comment_author_link( (int) $comment->comment_ID ), // HTML generated by WordPress
								esc_url( get_comment_link( $comment ) ),
								esc_html( get_the_title( $comment->comment_post_ID ) )
							);

							?>
						</li>

						<?php
						++$comments_printed;
					}

					?>
				</ul>
				<?php
			}
		}

		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Display the widget settings form.
	 *
	 * @param array $instance Current settings.
	 * @return never
	 */
	public function form( $instance ) {
		$instance = wp_parse_args( $instance, self::$widget_defaults );

		// phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual
		if ( $instance['number'] != (int) $instance['number'] ) {
			$instance['number'] = 5;
		}

		$instance['number'] = max( 1, min( 15, $instance['number'] ) );

		if ( empty( $instance['avatar_size'] ) ) {
			$instance['avatar_size'] = 48;
		}

		?>
		<p>
			<label>
				<?php esc_html_e( 'Title:', 'wpcomsh' ); ?>
				<input class="widefat" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
			</label>
		</p>
		<p>
			<label>
				<?php esc_html_e( 'Number of comments to show:', 'wpcomsh' ); ?>
				<select name="<?php echo esc_attr( $this->get_field_name( 'number' ) ); ?>">
					<?php for ( $i = 1; $i <= 15; $i++ ) : ?>
						<option value="<?php echo (int) $i; ?>" <?php selected( $instance['number'], $i ); ?>><?php echo (int) $i; /* @phan-suppress-current-line PhanRedundantConditionInLoop -- phpcs needs the explicit cast. */ ?></option>
					<?php endfor; ?>
				</select>
				<small><?php esc_html_e( '(at most 15)', 'wpcomsh' ); ?></small>
			</label>
		</p>
		<p>
			<label>
				<?php esc_html_e( 'Avatar Size (px):', 'wpcomsh' ); ?>
				<select name="<?php echo esc_attr( $this->get_field_name( 'avatar_size' ) ); ?>">
					<option value="1" <?php selected( $instance['avatar_size'], 1 ); ?>><?php esc_html_e( 'No Avatars', 'wpcomsh' ); ?></option>
					<option value="16" <?php selected( $instance['avatar_size'], 16 ); ?>>16x16</option>
					<option value="32" <?php selected( $instance['avatar_size'], 32 ); ?>>32x32</option>
					<option value="48" <?php selected( $instance['avatar_size'], 48 ); ?>>48x48</option>
					<option value="96" <?php selected( $instance['avatar_size'], 96 ); ?>>96x96</option>
					<option value="128" <?php selected( $instance['avatar_size'], 128 ); ?>>128x128</option>
				</select>
			</label>
		</p>
		<p>
			<label>
				<?php esc_html_e( 'Avatar background color:', 'wpcomsh' ); ?>
				<input name="<?php echo esc_attr( $this->get_field_name( 'avatar_bg' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['avatar_bg'] ); ?>" size="3" />
			</label>
		</p>
		<p>
			<label>
				<?php esc_html_e( 'Text background color:', 'wpcomsh' ); ?>
				<input name="<?php echo esc_attr( $this->get_field_name( 'text_bg' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['text_bg'] ); ?>" size="3" />
			</label>
		</p>
		<p>
			<label><?php esc_html_e( 'Show comments from:', 'wpcomsh' ); ?></label><br />

			<?php foreach ( $this->get_allowed_post_types() as $post_type => $label ) : ?>
				<input type="checkbox" name="<?php echo esc_attr( $this->get_field_name( 'post_types' ) ); ?>[]" id="<?php echo esc_attr( $this->get_field_id( 'post_types' ) ); ?>-<?php echo esc_attr( $post_type ); ?>" value="<?php echo esc_attr( $post_type ); ?>"<?php checked( in_array( $post_type, (array) $instance['post_types'], true ) ); ?> /> <label for="<?php echo esc_attr( $this->get_field_id( 'post_types' ) ); ?>-<?php echo esc_attr( $post_type ); ?>"><?php echo esc_html( $label ); // Don't translate as it's already translated. ?></label><br />
			<?php endforeach; ?>
		</p>
		<?php
	}

	/**
	 * Update the widget settings.
	 *
	 * @param array $new_instance New settings.
	 * @param array $old_instance Old settings.
	 */
	public function update( $new_instance, $old_instance ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$new_instance['title']       = wp_strip_all_tags( $new_instance['title'] );
		$new_instance['number']      = (int) $new_instance['number'];
		$new_instance['avatar_size'] = (int) $new_instance['avatar_size'];
		$new_instance['avatar_bg']   = preg_replace( '/[^a-z0-9#]/i', '', $new_instance['avatar_bg'] );
		$new_instance['text_bg']     = preg_replace( '/[^a-z0-9#]/i', '', $new_instance['text_bg'] );
		$new_instance['post_types']  = array_intersect( $new_instance['post_types'], array_keys( $this->get_allowed_post_types() ) );

		$this->flush_cache();

		return $new_instance;
	}

	/**
	 * Retrieve list of public post types that can have their comments displayed
	 *
	 * Returned array is keyed by the post type name, with its translated label as the value
	 *
	 * @return array
	 */
	protected function get_allowed_post_types() {
		if ( self::$allowed_post_types === null ) {
			$post_types = get_post_types(
				array(
					'public' => true,
				),
				'objects'
			);

			// Only those post types that support comments should be considered. :)
			foreach ( $post_types as $post_type => $object ) {
				if ( post_type_supports( $post_type, 'comments' ) ) {
					$post_types[ $post_type ] = $object->labels->name;
				} else {
					unset( $post_types[ $post_type ] );
				}
			}

			self::$allowed_post_types = $post_types;
			unset( $post_types );
		}

		return self::$allowed_post_types;
	}
}
