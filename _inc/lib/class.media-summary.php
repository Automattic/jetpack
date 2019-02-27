<?php
/**
 * Class Jetpack_Media_Summary
 *
 * embed [video] > gallery > image > text
 */
class Jetpack_Media_Summary {

	private static $cache = array();

	static function get( $post_id, $blog_id = 0, $args = array() ) {

		$defaults = array(
			'max_words' => 16,
			'max_chars' => 256,
		);
		$args = wp_parse_args( $args, $defaults );

		$switched = false;
		if ( !empty( $blog_id ) && $blog_id != get_current_blog_id() && function_exists( 'switch_to_blog' ) ) {
			switch_to_blog( $blog_id );
			$switched = true;
		} else {
			$blog_id = get_current_blog_id();
		}

		$cache_key = "{$blog_id}_{$post_id}_{$args['max_words']}_{$args['max_chars']}";
		if ( isset( self::$cache[ $cache_key ] ) ) {
			return self::$cache[ $cache_key ];
		}

		if ( ! class_exists( 'Jetpack_Media_Meta_Extractor' ) ) {
			if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
				jetpack_require_lib( 'class.wpcom-media-meta-extractor' );
			} else {
				jetpack_require_lib( 'class.media-extractor' );
			}
		}

		$post      = get_post( $post_id );
		$permalink = get_permalink( $post_id );

		$return = array(
			'type'       => 'standard',
			'permalink'  => $permalink,
			'image'      => '',
			'excerpt'    => '',
			'word_count' => 0,
			'secure'     => array(
				'image'  => '',
			),
			'count'       => array(
				'image' => 0,
				'video' => 0,
				'word'  => 0,
				'link'  => 0,
			),
		);

		if ( empty( $post->post_password ) ) {
			$return['excerpt']       = self::get_excerpt( $post->post_content, $post->post_excerpt, $args['max_words'], $args['max_chars'] , $post);
			$return['count']['word'] = self::get_word_count( $post->post_content );
			$return['count']['word_remaining'] = self::get_word_remaining_count( $post->post_content, $return['excerpt'] );
			$return['count']['link'] = self::get_link_count( $post->post_content );
		}

		$extract = Jetpack_Media_Meta_Extractor::extract( $blog_id, $post_id, Jetpack_Media_Meta_Extractor::ALL );

		if ( empty( $extract['has'] ) )
			return $return;

		// Prioritize [some] video embeds
		if ( !empty( $extract['has']['shortcode'] ) ) {
			foreach ( $extract['shortcode'] as $type => $data ) {
				switch ( $type ) {
					case 'videopress':
					case 'wpvideo':
						if ( 0 == $return['count']['video'] ) {
							// If there is no id on the video, then let's just skip this
							if ( ! isset ( $data['id'][0] ) ) {
								break;
							}

							$guid = $data['id'][0];
							$video_info = videopress_get_video_details( $guid );

							// Only add the video tags if the guid returns a valid videopress object.
							if ( $video_info instanceof stdClass ) {
								// Continue early if we can't find a Video slug.
								if ( empty( $video_info->files->std->mp4 ) ) {
									break;
								}

								$url = sprintf(
									'https://videos.files.wordpress.com/%1$s/%2$s',
									$guid,
									$video_info->files->std->mp4
								);

								$thumbnail = $video_info->poster;
								if ( ! empty( $thumbnail ) ) {
									$return['image'] = $thumbnail;
									$return['secure']['image'] = $thumbnail;
								}

								$return['type'] = 'video';
								$return['video'] = esc_url_raw( $url );
								$return['video_type'] = 'video/mp4';
								$return['secure']['video'] = $return['video'];
							}

						}
						$return['count']['video']++;
						break;
					case 'youtube':
						if ( 0 == $return['count']['video'] ) {
							$return['type'] = 'video';
							$return['video'] = esc_url_raw( 'http://www.youtube.com/watch?feature=player_embedded&v=' . $extract['shortcode']['youtube']['id'][0] );
							$return['image'] = self::get_video_poster( 'youtube', $extract['shortcode']['youtube']['id'][0] );
							$return['secure']['video'] = self::https( $return['video'] );
							$return['secure']['image'] = self::https( $return['image'] );
						}
						$return['count']['video']++;
						break;
					case 'vimeo':
						if ( 0 == $return['count']['video'] ) {
							$return['type'] = 'video';
							$return['video'] = esc_url_raw( 'http://vimeo.com/' . $extract['shortcode']['vimeo']['id'][0] );
							$return['secure']['video'] = self::https( $return['video'] );

							$poster_image = get_post_meta( $post_id, 'vimeo_poster_image', true );
							if ( !empty( $poster_image ) ) {
								$return['image'] = $poster_image;
								$poster_url_parts = parse_url( $poster_image );
								$return['secure']['image'] = 'https://secure-a.vimeocdn.com' . $poster_url_parts['path'];
							}
						}
						$return['count']['video']++;
						break;
				}
			}

		}

		if ( !empty( $extract['has']['embed'] ) ) {
			foreach( $extract['embed']['url'] as $embed ) {
				if ( preg_match( '/((youtube|vimeo|dailymotion)\.com|youtu.be)/', $embed ) ) {
					if ( 0 == $return['count']['video'] ) {
						$return['type']   = 'video';
						$return['video']  = 'http://' .  $embed;
						$return['secure']['video'] = self::https( $return['video'] );
						if ( false !== strpos( $embed, 'youtube' ) ) {
							$return['image'] = self::get_video_poster( 'youtube', jetpack_get_youtube_id( $return['video'] ) );
							$return['secure']['image'] = self::https( $return['image'] );
						} else if ( false !== strpos( $embed, 'youtu.be' ) ) {
							$youtube_id = jetpack_get_youtube_id( $return['video'] );
							$return['video'] = 'http://youtube.com/watch?v=' . $youtube_id . '&feature=youtu.be';
							$return['secure']['video'] = self::https( $return['video'] );
							$return['image'] = self::get_video_poster( 'youtube', jetpack_get_youtube_id( $return['video'] ) );
							$return['secure']['image'] = self::https( $return['image'] );
						} else if ( false !== strpos( $embed, 'vimeo' ) ) {
							$poster_image = get_post_meta( $post_id, 'vimeo_poster_image', true );
							if ( !empty( $poster_image ) ) {
								$return['image'] = $poster_image;
								$poster_url_parts = parse_url( $poster_image );
								$return['secure']['image'] = 'https://secure-a.vimeocdn.com' . $poster_url_parts['path'];
							}
						} else if ( false !== strpos( $embed, 'dailymotion' ) ) {
							$return['image'] = str_replace( 'dailymotion.com/video/','dailymotion.com/thumbnail/video/', $embed );
							$return['image'] = parse_url( $return['image'], PHP_URL_SCHEME ) === null ? 'http://' . $return['image'] : $return['image'];
							$return['secure']['image'] = self::https( $return['image'] );
						}

					}
					$return['count']['video']++;
				}
			}
		}

		// Do we really want to make the video the primary focus of the post?
		if ( 'video' == $return['type'] ) {
			$content = wpautop( strip_tags( $post->post_content ) );
			$paragraphs = explode( '</p>', $content );
			$number_of_paragraphs = 0;

			foreach ( $paragraphs as $i => $paragraph ) {
				// Don't include blank lines as a paragraph
				if ( '' == trim( $paragraph ) ) {
					unset( $paragraphs[$i] );
					continue;
				}
				$number_of_paragraphs++;
			}

			$number_of_paragraphs = $number_of_paragraphs - $return['count']['video']; // subtract amount for videos..

			// More than 2 paragraph? The video is not the primary focus so we can do some more analysis
			if ( $number_of_paragraphs > 2 )
				$return['type'] = 'standard';
		}

		// If we don't have any prioritized embed...
		if ( 'standard' == $return['type'] ) {
			if ( ( ! empty( $extract['has']['gallery'] ) || ! empty( $extract['shortcode']['gallery']['count'] ) ) && ! empty( $extract['image'] ) ) {
				//... Then we prioritize galleries first (multiple images returned)
				$return['type']   = 'gallery';
				$return['images'] = $extract['image'];
				foreach ( $return['images'] as $image ) {
					$return['secure']['images'][] = array( 'url' => self::ssl_img( $image['url'] ) );
					$return['count']['image']++;
				}
			} else if ( ! empty( $extract['has']['image'] ) ) {
				// ... Or we try and select a single image that would make sense
				$content = wpautop( strip_tags( $post->post_content ) );
				$paragraphs = explode( '</p>', $content );
				$number_of_paragraphs = 0;

				foreach ( $paragraphs as $i => $paragraph ) {
					// Don't include 'actual' captions as a paragraph
					if ( false !== strpos( $paragraph, '[caption' ) ) {
						unset( $paragraphs[$i] );
						continue;
					}
					// Don't include blank lines as a paragraph
					if ( '' == trim( $paragraph ) ) {
						unset( $paragraphs[$i] );
						continue;
					}
					$number_of_paragraphs++;
				}

				$return['image'] = $extract['image'][0]['url'];
				$return['secure']['image'] = self::ssl_img( $return['image'] );
				$return['count']['image']++;

				if ( $number_of_paragraphs <= 2 && 1 == count( $extract['image'] ) ) {
					// If we have lots of text or images, let's not treat it as an image post, but return its first image
					$return['type']  = 'image';
				}
			}
		}

		if ( $switched ) {
			restore_current_blog();
		}

		/**
		 * Allow a theme or plugin to inspect and ultimately change the media summary.
		 *
		 * @since 4.4.0
		 *
		 * @param array $data The calculated media summary data.
		 * @param int $post_id The id of the post this data applies to.
		 */
		$return = apply_filters( 'jetpack_media_summary_output', $return, $post_id );

		self::$cache[ $cache_key ] = $return;

		return $return;
	}

	static function https( $str ) {
		return str_replace( 'http://', 'https://', $str );
	}

	static function ssl_img( $url ) {
		if ( false !== strpos( $url, 'files.wordpress.com' ) ) {
			return self::https( $url );
		} else {
			return self::https( jetpack_photon_url( $url ) );
		}
	}

	static function get_video_poster( $type, $id ) {
		if ( 'videopress' == $type ) {
			if ( function_exists( 'video_get_highest_resolution_image_url' ) ) {
				return video_get_highest_resolution_image_url( $id );
			} else if ( class_exists( 'VideoPress_Video' ) ) {
				$video = new VideoPress_Video( $id );
				return $video->poster_frame_uri;
			}
		} else if ( 'youtube' == $type ) {
			return  'http://img.youtube.com/vi/'.$id.'/0.jpg';
		}
	}

	static function clean_text( $text ) {
		return trim(
			preg_replace(
				'/[\s]+/',
				' ',
				preg_replace(
					'@https?://[\S]+@',
					'',
					strip_shortcodes(
						strip_tags(
							$text
						)
					)
				)
			)
		);
	}

	/**
	 * Retrieve an excerpt for the post summary.
	 *
	 * This function works around a suspected problem with Core. If resolved, this function should be simplified.
	 * @link https://github.com/Automattic/jetpack/pull/8510
	 * @link https://core.trac.wordpress.org/ticket/42814
	 *
	 * @param  string  $post_content The post's content.
	 * @param  string  $post_excerpt The post's excerpt. Empty if none was explicitly set.
	 * @param  int     $max_words Maximum number of words for the excerpt. Used on wp.com. Default 16.
	 * @param  int     $max_chars Maximum characters in the excerpt. Used on wp.com. Default 256.
	 * @param  WP_Post $requested_post The post object.
	 * @return string Post excerpt.
	 **/
	static function get_excerpt( $post_content, $post_excerpt, $max_words = 16, $max_chars = 256, $requested_post = null ) {
		global $post;
		$original_post = $post; // Saving the global for later use.
		if ( function_exists( 'wpcom_enhanced_excerpt_extract_excerpt' ) ) {
			return self::clean_text( wpcom_enhanced_excerpt_extract_excerpt( array(
				'text'                => $post_content,
				'excerpt_only'        => true,
				'show_read_more'      => false,
				'max_words'           => $max_words,
				'max_chars'           => $max_chars,
				'read_more_threshold' => 25,
			) ) );
		} elseif ( $requested_post instanceof WP_Post ) {
			$post = $requested_post; // setup_postdata does not set the global.
			setup_postdata( $post );
			/** This filter is documented in core/src/wp-includes/post-template.php */
			$post_excerpt = apply_filters( 'get_the_excerpt', $post_excerpt, $post );
			$post         = $original_post; // wp_reset_postdata uses the $post global.
			wp_reset_postdata();
			return self::clean_text( $post_excerpt );
		}
		return '';
	}

	static function get_word_count( $post_content ) {
		return str_word_count( self::clean_text( $post_content ) );
	}

	static function get_word_remaining_count( $post_content, $excerpt_content ) {
		return str_word_count( self::clean_text( $post_content ) ) - str_word_count( self::clean_text( $excerpt_content ) );
	}

	static function get_link_count( $post_content ) {
		return preg_match_all( '/\<a[\> ]/', $post_content, $matches );
	}
}
