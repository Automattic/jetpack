<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Provides media summary of a post.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Image_CDN\Image_CDN_Core;

/**
 * Class Jetpack_Media_Summary
 *
 * Priority: embed [video] > gallery > image > text
 */
class Jetpack_Media_Summary {

	/**
	 * Media cache.
	 *
	 * @var array
	 */
	private static $cache = array();

	/**
	 * Get media summary for a post.
	 *
	 * @param ?int  $post_id Post ID.
	 * @param int   $blog_id Blog ID, if applicable.
	 * @param array $args {
	 *      Optional. An array of arguments.
	 *      @type int $max_words Maximum number of words.
	 *      @type int $max_chars Maximum number of characters.
	 *      @type bool $include_excerpt Whether to compute the excerpt and return it. Default true.
	 *      @type bool $include_counts  Whether to compute word/link counts. Default true.
	 * }
	 *
	 * @return array|mixed|void
	 */
	public static function get( ?int $post_id, int $blog_id = 0, array $args = array() ) {
		$post_id = (int) $post_id;

		$defaults = array(
			'max_words'       => 16,
			'max_chars'       => 256,
			'include_excerpt' => true,
			'include_counts'  => true,
		);
		$args     = wp_parse_args( $args, $defaults );

		$switched = false;
		if ( ! empty( $blog_id ) && get_current_blog_id() !== $blog_id && function_exists( 'switch_to_blog' ) ) {
			switch_to_blog( $blog_id );
			$switched = true;
		} else {
			$blog_id = get_current_blog_id();
		}

		$cache_key = "{$blog_id}_{$post_id}_{$args['max_words']}_{$args['max_chars']}_"
			. (int) $args['include_excerpt'] . '_' . (int) $args['include_counts'];
		if ( isset( self::$cache[ $cache_key ] ) ) {
			if ( $switched ) {
				restore_current_blog();
			}
			return self::$cache[ $cache_key ];
		}

		if ( ! class_exists( 'Jetpack_Media_Meta_Extractor' ) ) {
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/class.media-extractor.php';
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
				'image' => '',
			),
			'count'      => array(
				'image'          => 0,
				'video'          => 0,
				'word'           => 0,
				'word_remaining' => 0,
				'link'           => 0,
			),
		);

		if ( $post instanceof WP_Post && empty( $post->post_password ) ) {
			if ( $args['include_excerpt'] ) {
				$return['excerpt'] = self::get_excerpt( $post->post_content, $post->post_excerpt, $args['max_words'], $args['max_chars'], $post );
			}
			if ( $args['include_counts'] ) {
				$return['count']['word'] = self::get_word_count( $post->post_content );
				$return['count']['link'] = self::get_link_count( $post->post_content );
				// Only compute word_remaining if we have an excerpt. If not, leave the default of 0.
				if ( $args['include_excerpt'] && '' !== $return['excerpt'] ) {
					$return['count']['word_remaining'] = self::get_word_remaining_count( $post->post_content, $return['excerpt'] );
				}
			}
		}

		$extract = Jetpack_Media_Meta_Extractor::extract( $blog_id, $post_id, Jetpack_Media_Meta_Extractor::ALL );

		$block_videos = array();
		if ( $post instanceof WP_Post && has_blocks( $post->post_content ) ) {
			$block_videos = self::get_block_videos( parse_blocks( $post->post_content ) );
		}

		if ( empty( $extract['has'] ) && empty( $block_videos ) ) {
			if ( $switched ) {
				restore_current_blog();
			}
			self::$cache[ $cache_key ] = $return;
			return $return;
		}

		// Prioritize [some] video embeds.
		if ( ! empty( $extract['has']['shortcode'] ) ) {
			foreach ( $extract['shortcode'] as $type => $data ) {
				switch ( $type ) {
					case 'videopress':
					case 'wpvideo':
						if ( 0 === $return['count']['video'] ) {
							// If there is no id on the video, then let's just skip this.
							if ( ! isset( $data['id'][0] ) ) {
								break;
							}

							$video = self::get_videopress_video( $data['id'][0] );
							if ( null === $video ) {
								break;
							}
							$return = self::set_video( $return, $video );
						}
						++$return['count']['video'];
						break;
					case 'youtube':
						if ( 0 === $return['count']['video'] ) {
							if ( ! isset( $extract['shortcode']['youtube']['id'][0] ) ) {
								break;
							}
							$return['type']            = 'video';
							$return['video']           = esc_url_raw( 'http://www.youtube.com/watch?feature=player_embedded&v=' . $extract['shortcode']['youtube']['id'][0] );
							$return['image']           = self::get_video_poster( 'youtube', $extract['shortcode']['youtube']['id'][0] );
							$return['secure']['video'] = self::https( $return['video'] );
							$return['secure']['image'] = self::https( $return['image'] );
						}
						++$return['count']['video'];
						break;
					case 'vimeo':
						if ( 0 === $return['count']['video'] ) {
							if ( ! isset( $extract['shortcode']['vimeo']['id'][0] ) ) {
								break;
							}
							$return['type']            = 'video';
							$return['video']           = esc_url_raw( 'http://vimeo.com/' . $extract['shortcode']['vimeo']['id'][0] );
							$return['secure']['video'] = self::https( $return['video'] );

							$poster_image = get_post_meta( $post_id, 'vimeo_poster_image', true );
							if ( ! empty( $poster_image ) ) {
								$return['image']           = $poster_image;
								$poster_url_parts          = wp_parse_url( $poster_image );
								$return['secure']['image'] = 'https://secure-a.vimeocdn.com' . $poster_url_parts['path'];
							}
						}
						++$return['count']['video'];
						break;
				}
			}
		}

		if ( ! empty( $extract['has']['embed'] ) ) {
			foreach ( $extract['embed']['url'] as $embed ) {
				if ( preg_match( '/((youtube|vimeo|dailymotion)\.com|youtu.be)/', $embed ) ) {
					if ( 0 === $return['count']['video'] ) {
						$return['type']            = 'video';
						$return['video']           = 'http://' . $embed;
						$return['secure']['video'] = self::https( $return['video'] );
						if ( str_contains( $embed, 'youtube' ) ) {
							$return['image']           = self::get_video_poster( 'youtube', jetpack_get_youtube_id( $return['video'] ) );
							$return['secure']['image'] = self::https( $return['image'] );
						} elseif ( str_contains( $embed, 'youtu.be' ) ) {
							$youtube_id                = jetpack_get_youtube_id( $return['video'] );
							$return['video']           = 'http://youtube.com/watch?v=' . $youtube_id . '&feature=youtu.be';
							$return['secure']['video'] = self::https( $return['video'] );
							$return['image']           = self::get_video_poster( 'youtube', jetpack_get_youtube_id( $return['video'] ) );
							$return['secure']['image'] = self::https( $return['image'] );
						} elseif ( str_contains( $embed, 'vimeo' ) ) {
							$poster_image = get_post_meta( $post_id, 'vimeo_poster_image', true );
							if ( ! empty( $poster_image ) ) {
								$return['image']           = $poster_image;
								$poster_url_parts          = wp_parse_url( $poster_image );
								$return['secure']['image'] = 'https://secure-a.vimeocdn.com' . $poster_url_parts['path'];
							}
						} elseif ( str_contains( $embed, 'dailymotion' ) ) {
							$return['image']           = str_replace( 'dailymotion.com/video/', 'dailymotion.com/thumbnail/video/', $embed );
							$return['image']           = wp_parse_url( $return['image'], PHP_URL_SCHEME ) === null ? 'http://' . $return['image'] : $return['image'];
							$return['secure']['image'] = self::https( $return['image'] );
						}
					}
					++$return['count']['video'];
				}
			}
		}

		$videopress_looked_up = false;
		foreach ( $block_videos as $video ) {
			if ( 0 === $return['count']['video'] ) {
				// Each lookup can be a remote request, so only try the first VideoPress video.
				if ( isset( $video['guid'] ) ) {
					if ( $videopress_looked_up ) {
						continue;
					}
					$videopress_looked_up = true;
					$video                = self::get_videopress_video( $video['guid'] );
					if ( null === $video ) {
						continue;
					}
				}
				$return = self::set_video( $return, $video );
			}
			++$return['count']['video'];
		}

		// Do we really want to make the video the primary focus of the post?
		if ( 'video' === $return['type'] ) {
			$content              = wpautop( wp_strip_all_tags( $post->post_content ) );
			$paragraphs           = explode( '</p>', $content );
			$number_of_paragraphs = 0;

			foreach ( $paragraphs as $i => $paragraph ) {
				// Don't include blank lines as a paragraph.
				if ( '' === trim( $paragraph ) ) {
					unset( $paragraphs[ $i ] );
					continue;
				}
				++$number_of_paragraphs;
			}

			$number_of_paragraphs -= $return['count']['video']; // subtract amount for videos.

			// More than 2 paragraph? The video is not the primary focus so we can do some more analysis.
			if ( $number_of_paragraphs > 2 ) {
				$return['type'] = 'standard';
			}
		}

		// If we don't have any prioritized embed...
		if ( 'standard' === $return['type'] ) {
			if ( ( ! empty( $extract['has']['gallery'] ) || ! empty( $extract['shortcode']['gallery']['count'] ) ) && ! empty( $extract['image'] ) ) {
				// ... Then we prioritize galleries first (multiple images returned)
				$return['type']   = 'gallery';
				$return['images'] = $extract['image'];
				foreach ( $return['images'] as $image ) {
					$return['secure']['images'][] = array( 'url' => self::ssl_img( $image['url'] ) );
					++$return['count']['image'];
				}
			} elseif ( ! empty( $extract['has']['image'] ) ) {
				// ... Or we try and select a single image that would make sense.
				$content              = wpautop( wp_strip_all_tags( $post->post_content ) );
				$paragraphs           = explode( '</p>', $content );
				$number_of_paragraphs = 0;

				foreach ( $paragraphs as $i => $paragraph ) {
					// Don't include 'actual' captions as a paragraph.
					if ( str_contains( $paragraph, '[caption' ) ) {
						unset( $paragraphs[ $i ] );
						continue;
					}
					// Don't include blank lines as a paragraph.
					if ( '' === trim( $paragraph ) ) {
						unset( $paragraphs[ $i ] );
						continue;
					}
					++$number_of_paragraphs;
				}

				// @phan-suppress-next-line PhanTypeMismatchDimFetch -- Phan is understandably confused, as $extract has many forms, including this one.
				if ( ! empty( $extract['image'][0]['url'] ) ) {
					$return['image']           = $extract['image'][0]['url'];
					$return['secure']['image'] = self::ssl_img( $return['image'] );
					++$return['count']['image'];
				}

				if ( $number_of_paragraphs <= 2 && is_countable( $extract['image'] ) && 1 === count( $extract['image'] ) ) {
					// If we have lots of text or images, let's not treat it as an image post, but return its first image.
					$return['type'] = 'image';
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

	/**
	 * Set a video as the post's primary media.
	 *
	 * @param array $summary Media summary being built.
	 * @param array $video   Video data with `video`, and optionally `video_type` and `image` keys.
	 *
	 * @return array Media summary.
	 */
	private static function set_video( $summary, $video ) {
		$summary['type']            = 'video';
		$summary['video']           = esc_url_raw( $video['video'] );
		$summary['secure']['video'] = $summary['video'];
		if ( ! empty( $video['video_type'] ) ) {
			$summary['video_type'] = $video['video_type'];
		}
		if ( ! empty( $video['image'] ) ) {
			$summary['image']           = $video['image'];
			$summary['secure']['image'] = $video['image'];
		}
		return $summary;
	}

	/**
	 * Get the MP4 file and poster of a VideoPress video.
	 *
	 * @param string $guid VideoPress video GUID.
	 *
	 * @return array|null Video data, or null if the video has no public MP4 file.
	 */
	private static function get_videopress_video( $guid ) {
		if ( ! function_exists( 'videopress_get_video_details' ) ) {
			return null;
		}

		$video_info = videopress_get_video_details( $guid );
		if ( ! $video_info instanceof stdClass || empty( $video_info->files->std->mp4 ) ) {
			return null;
		}

		return array(
			'video'      => sprintf( 'https://videos.files.wordpress.com/%1$s/%2$s', $guid, $video_info->files->std->mp4 ),
			'video_type' => 'video/mp4',
			'image'      => empty( $video_info->poster ) ? '' : $video_info->poster,
		);
	}

	/**
	 * Find the videos in VideoPress and core Video blocks, including nested ones.
	 *
	 * @param array $blocks Parsed blocks.
	 *
	 * @return array[] A `guid` for each VideoPress video, or video data for each self-hosted one.
	 */
	private static function get_block_videos( $blocks ) {
		$videos = array();
		foreach ( $blocks as $block ) {
			if ( in_array( $block['blockName'], array( 'videopress/video', 'core/video' ), true ) ) {
				$guid = $block['attrs']['guid'] ?? '';
				if ( is_string( $guid ) && '' !== $guid ) {
					$videos[] = array( 'guid' => $guid );
				} elseif ( 'core/video' === $block['blockName'] ) {
					$video = self::get_core_video( $block['innerHTML'] );
					if ( null !== $video ) {
						$videos[] = $video;
					}
				}
			}

			if ( ! empty( $block['innerBlocks'] ) ) {
				$videos = array_merge( $videos, self::get_block_videos( $block['innerBlocks'] ) );
			}
		}
		return $videos;
	}

	/**
	 * Get the file and poster of a self-hosted video from a core Video block.
	 *
	 * @param string $html The block's saved markup.
	 *
	 * @return array|null Video data, or null without a poster (share cards need an image) or a known video file type.
	 */
	private static function get_core_video( $html ) {
		$tags = new WP_HTML_Tag_Processor( $html );
		if ( ! $tags->next_tag( 'video' ) ) {
			return null;
		}

		$src    = $tags->get_attribute( 'src' );
		$poster = $tags->get_attribute( 'poster' );
		if ( ! is_string( $src ) || '' === $src || ! is_string( $poster ) || '' === $poster ) {
			return null;
		}

		// Check against all known types, not the upload allow-list, which hosts can restrict.
		$filetype = wp_check_filetype( (string) wp_parse_url( $src, PHP_URL_PATH ), wp_get_mime_types() );
		// Open Graph would otherwise label the file text/html.
		if ( ! is_string( $filetype['type'] ) || ! str_starts_with( $filetype['type'], 'video/' ) ) {
			return null;
		}

		return array(
			'video'      => $src,
			'video_type' => $filetype['type'],
			'image'      => $poster,
		);
	}

	/**
	 * Converts http to https://
	 *
	 * @param string $str URL.
	 *
	 * @return string URL.
	 */
	public static function https( $str ) {
		return str_replace( 'http://', 'https://', $str );
	}

	/**
	 * Returns a Photonized version of the URL.
	 *
	 * @param string $url URL.
	 *
	 * @return string URL.
	 */
	public static function ssl_img( $url ) {
		if ( str_contains( $url, 'files.wordpress.com' ) ) {
			return self::https( $url );
		} else {
			return self::https( Image_CDN_Core::cdn_url( $url ) );
		}
	}

	/**
	 * Get the video poster.
	 *
	 * @param string $type Video service.
	 * @param string $id Video ID for the service.
	 *
	 * @return string URL of image thumbnail for the video.
	 */
	public static function get_video_poster( $type, $id ) {
		if ( 'videopress' === $type ) {
			if ( function_exists( 'video_get_highest_resolution_image_url' ) ) {
				return video_get_highest_resolution_image_url( $id );
			} elseif ( class_exists( 'VideoPress_Video' ) ) {
				$video = new VideoPress_Video( $id );
				return $video->poster_frame_uri;
			}
		} elseif ( 'youtube' === $type ) {
			return 'http://img.youtube.com/vi/' . $id . '/0.jpg';
		}
	}

	/**
	 * Clean text of shortcodes and tags.
	 *
	 * @param string $text Dirty text.
	 * @param bool   $preserve_urls When true, keep http(s) URLs in the text instead of stripping them. Default false.
	 *
	 * @return string Clean text.
	 */
	public static function clean_text( $text, $preserve_urls = false ) {
		$text = strip_shortcodes( wp_strip_all_tags( $text ) );

		if ( ! $preserve_urls ) {
			$text = preg_replace( '@https?://[\S]+@', '', $text );
		}

		return trim( preg_replace( '/[\s]+/', ' ', $text ) );
	}

	/**
	 * Retrieve an excerpt for the post summary.
	 *
	 * This function works around a suspected problem with Core. If resolved, this function should be simplified.
	 *
	 * @link https://github.com/Automattic/jetpack/pull/8510
	 * @link https://core.trac.wordpress.org/ticket/42814
	 *
	 * @param  string  $post_content The post's content.
	 * @param  string  $post_excerpt The post's excerpt. Empty if none was explicitly set.
	 * @param  int     $max_words Maximum number of words for the excerpt. Used on wp.com. Default 16.
	 * @param  int     $max_chars Maximum characters in the excerpt. Used on wp.com. Default 256.
	 * @param  WP_Post $requested_post The post object.
	 * @param  bool    $preserve_urls When true, keep http(s) URLs in the excerpt instead of stripping them. Default false.
	 * @return string Post excerpt.
	 **/
	public static function get_excerpt( $post_content, $post_excerpt, $max_words = 16, $max_chars = 256, $requested_post = null, $preserve_urls = false ) {
		global $post;
		$original_post = $post; // Saving the global for later use.
		if ( empty( $post_excerpt ) && function_exists( 'wpcom_enhanced_excerpt_extract_excerpt' ) ) {
			return self::clean_text(
				wpcom_enhanced_excerpt_extract_excerpt(
					array(
						'text'                => $post_content,
						'excerpt_only'        => true,
						'show_read_more'      => false,
						'max_words'           => $max_words,
						'max_chars'           => $max_chars,
						'read_more_threshold' => 25,
					)
				),
				$preserve_urls
			);
		} elseif ( $requested_post instanceof WP_Post ) {
			// @todo Refactor to not need to override the global.
			// phpcs:ignore: WordPress.WP.GlobalVariablesOverride.Prohibited
			$post = $requested_post; // setup_postdata does not set the global.
			setup_postdata( $post );
			/** This filter is documented in core/src/wp-includes/post-template.php */
			$post_excerpt = apply_filters( 'get_the_excerpt', $post_excerpt, $post );
			// phpcs:ignore: WordPress.WP.GlobalVariablesOverride.Prohibited
			$post = $original_post; // wp_reset_postdata uses the $post global.
			wp_reset_postdata();
			return self::clean_text( $post_excerpt, $preserve_urls );
		}
		return '';
	}

	/**
	 * Split a string into an array of words.
	 *
	 * @param string $text Post content or excerpt.
	 *
	 * @return array Array of words.
	 */
	public static function split_content_in_words( $text ) {
		$words = preg_split( '/[\s!?;,.]+/', $text, -1, PREG_SPLIT_NO_EMPTY );

		// Return an empty array if the split above fails.
		return $words ? $words : array();
	}

	/**
	 * Get the word count.
	 *
	 * @param string $post_content Post content.
	 *
	 * @return int Word count.
	 */
	public static function get_word_count( $post_content ) {
		return count( self::split_content_in_words( self::clean_text( $post_content ) ) );
	}

	/**
	 * Get remainder word count (after the excerpt).
	 *
	 * @param string $post_content Post content.
	 * @param string $excerpt_content Excerpt content.
	 *
	 * @return int Number of words after the excerpt.
	 */
	public static function get_word_remaining_count( $post_content, $excerpt_content ) {
		$content_word_count = count( self::split_content_in_words( self::clean_text( $post_content ) ) );
		$excerpt_word_count = count( self::split_content_in_words( self::clean_text( $excerpt_content ) ) );

		return $content_word_count - $excerpt_word_count;
	}

	/**
	 * Counts the number of links in a post.
	 *
	 * @param string $post_content Post content.
	 *
	 * @return false|int Number of links.
	 */
	public static function get_link_count( $post_content ) {
		return preg_match_all( '/\<a[\> ]/', $post_content, $matches );
	}
}
