<?php
/**
 * Class Jetpack_Media_Summary
 *
 * embed [video] > gallery > image > text
 */
class Jetpack_Media_Summary {

	static function get( $post_id, $blog_id = 0, $args = array() ) {
		$defaults = array(
			'trigger_mshot' => false
		);
		$args = wp_parse_args( $args, $defaults );

		$switched = false;
		if ( !empty( $blog_id ) && $blog_id != get_current_blog_id() && function_exists( 'switch_to_blog' ) ) {
			switch_to_blog( $blog_id );
			$switched = true;
		} else {
			$blog_id = get_current_blog_id();
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
			$return['excerpt']       = self::get_excerpt( $post->post_content, $post->post_excerpt );
			$return['count']['word'] = self::get_word_count( $post->post_content );
			$return['count']['word_remaining'] = self::get_word_remaining_count( $post->post_content, self::get_excerpt( $post->post_content, $post->post_excerpt ) );
			$return['count']['link'] = self::get_link_count( $post->post_content );
		}

		$extract = Jetpack_Media_Meta_Extractor::extract( $blog_id, $post_id, Jetpack_Media_Meta_Extractor::ALL );

		if ( empty( $extract['has'] ) )
			return $return;

		// Prioritize [some] video embeds
		if ( !empty( $extract['has']['shortcode'] ) ) {
			foreach ( $extract['shortcode'] as $type => $data ) {
				switch ( $type ) {
					case 'wpvideo':
						if ( 0 == $return['count']['video'] ) {
							$return['type'] = 'video';
							$return['video'] = esc_url_raw( 'http://s0.videopress.com/player.swf?guid=' . $extract['shortcode']['wpvideo']['id'][0] . '&isDynamicSeeking=true' );
							$return['image'] = self::get_video_poster( 'videopress', $extract['shortcode']['wpvideo']['id'][0] );
							$return['secure']['video'] = preg_replace( '@http://[^\.]+.videopress.com/@', 'https://v0.wordpress.com/', $return['video'] );
							$return['secure']['image'] = str_replace( 'http://videos.videopress.com', 'https://videos.files.wordpress.com', $return['image'] );
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
				if ( preg_match( '/((youtube|vimeo)\.com|youtu.be)/', $embed ) ) {
					if ( 0 == $return['count']['video'] ) {
						$return['type']   = 'video';
						$return['video']  = 'http://' .  $embed;
						$return['secure']['video'] = self::https( $return['video'] );
						if ( strstr( $embed, 'youtube' ) ) {
							$return['image'] = self::get_video_poster( 'youtube', get_youtube_id( $return['video'] ) );
							$return['secure']['image'] = self::https( $return['image'] );
						} else if ( strstr( $embed, 'vimeo' ) ) {
							$poster_image = get_post_meta( $post_id, 'vimeo_poster_image', true );
							if ( !empty( $poster_image ) ) {
								$return['image'] = $poster_image;
								$poster_url_parts = parse_url( $poster_image );
								$return['secure']['image'] = 'https://secure-a.vimeocdn.com' . $poster_url_parts['path'];
							}
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
			if ( !empty( $extract['has']['gallery'] ) || ! empty( $extract['shortcode']['gallery']['count'] ) ) {
				//... Then we prioritize galleries first (multiple images returned)
				$return['type']   = 'gallery';
				$return['images'] = $extract['image'];
				if ( ! empty( $return['images'] ) ) {
					foreach ( $return['images'] as $image ) {
						$return['secure']['images'][] = array( 'url' => self::ssl_img( $image['url'] ) );
						$return['count']['image']++;
					}
				}
			} else if ( !empty( $extract['has']['image'] ) ) {
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

		return $return;
	}

	static function https( $str ) {
		return str_replace( 'http://', 'https://', $str );
	}

	static function ssl_img( $url ) {
		if ( strstr( $url, 'files.wordpress.com' ) ) {
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

	static function get_excerpt( $post_content, $post_excerpt ) {
		if ( function_exists( 'wpcom_enhanced_excerpt_extract_excerpt' ) ) {
			return self::clean_text( wpcom_enhanced_excerpt_extract_excerpt( array(
				'text'           => $post_content,
				'excerpt_only'   => true,
				'show_read_more' => false,
				'max_words'      => 16,
				'max_chars'      => 100,
			) ) );
		} else {
			$post_excerpt = apply_filters( 'get_the_excerpt', $post_excerpt );
			return self::clean_text( $post_excerpt );
		}
	}

	static function get_word_count( $post_content ) {
		return str_word_count( self::clean_text( $post_content ) );
	}

	static function get_word_remaining_count( $post_content, $excerpt_content ) {
		return str_word_count( self::clean_text( $post_content ) ) - str_word_count( self::clean_text( $excerpt_content ) );
	}

	static function get_link_count( $post_content ) {
		return substr_count( $post_content, '<a' );
	}
}
