<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis;

class Image_Size_Analysis_Fixer {

	public static function setup() {
		add_filter( 'the_content', array( __CLASS__, 'fix_content' ), 99 );
		add_filter( 'wp_calculate_image_srcset', array( __CLASS__, 'fix_image_attachments' ), 10, 5 );
		add_filter( 'wp_calculate_image_sizes', array( __CLASS__, 'fix_image_sizes' ), 10, 5 );
	}

	/**
	 * Clean up image URLs, removing image dimensions and Photon parts from them.
	 * Before: https://i0.wp.com/example.com/test-1024x768.jpg
	 * After: https://example.com/test.jpg
	 *
	 * @param string $url
	 * @return string
	 */
	public static function fix_url( $url ) {
		$parsed_url = wp_parse_url( $url );
		if ( ! isset( $parsed_url['host'] ) ) {
			return $url;
		}

		$path = preg_replace( '/-\d+x\d+\.jpg/', '.jpg', $parsed_url['path'] ); // remove "-1024x768" from the end of the URL.
		$host = str_replace( 'i0.wp.com/', '', $parsed_url['host'] );
		return $parsed_url['scheme'] . '://' . $host . $path;
	}

	public static function get_fixes( $post_id ) {
		static $fixes = array();

		if ( isset( $fixes[ $post_id ] ) ) {
			return $fixes[ $post_id ];
		}

		$fixes[ $post_id ] = get_post_meta( $post_id, '_jb_image_fixes', true );
		if ( ! $fixes[ $post_id ] ) {
			$fixes[ $post_id ] = array();
		}

		return $fixes[ $post_id ];
	}

	public static function get_all_fixes() {
		$fixes = array();
		$posts = get_posts(
			array(
				'posts_per_page' => -1,
				'meta_key'       => '_jb_image_fixes',
				'meta_compare'   => 'EXISTS',
			)
		);

		foreach ( $posts as $post ) {
			$fix = get_post_meta( $post->ID, '_jb_image_fixes', true );
			if ( ! empty( $fix ) ) {
				$fixes[ $post->ID ] = $fix;
			}
		}

		return $fixes;
	}

	public static function get_post_id( $edit_url ) {

		if ( empty( $edit_url ) ) {
			return 0;
		}

		$query_string = wp_parse_url( esc_url_raw( $edit_url ), PHP_URL_QUERY );
		parse_str( $query_string, $query_args );
		if ( ! isset( $query_args['post'] ) ) {
			return 0;
		}

		return absint( $query_args['post'] );
	}

	public static function is_fixed( $post_id, $image_url ) {
		$fixes = self::get_fixes( $post_id );
		if ( ! $fixes ) {
			return false;
		}

		$image_url     = self::fix_url( $image_url );
		$attachment_id = attachment_url_to_postid( esc_url_raw( $image_url ) );
		if ( $attachment_id && isset( $fixes[ $attachment_id ] ) ) {
			return true;
		}

		$url_key = md5( $image_url );
		return isset( $fixes[ $url_key ] );
	}

	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public static function fix_image_attachments( $sources, $size_array, $image_url, $image_meta, $attachment_id ) {

		$post = get_post();
		// If we're not in a post context, skip.
		if ( $post === null ) {
			return $sources;
		}
		$post_id = $post->ID;

		$fixes = self::get_fixes( $post_id );

		$image_width = 0;

		// remove XxY dimension from $image_url as that's what's recorded by Image_Size_Analysis.
		$image_url_key = self::fix_url( $image_url );

		if ( $attachment_id && isset( $fixes[ $attachment_id ] ) && ! empty( $fixes[ $attachment_id ] ) ) {
			$image_width = $fixes[ $attachment_id ]['image_width'];
		} elseif ( isset( $fixes[ $image_url_key ] ) ) {
			$image_width = $fixes[ $image_url_key ]['image_width'];
		}

		if ( $image_width ) {
			$sources [ $image_width ] = array(
				'url'        => \Automattic\Jetpack\Image_CDN\Image_CDN_Core::cdn_url( $image_url, array( 'w' => $image_width ) ),
				'descriptor' => 'w',
				'value'      => $image_width,
			);
		}

		return $sources;
	}

	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public static function fix_image_sizes( $sizes, $size, $image_url, $image_meta, $attachment_id ) {

		$post = get_post();
		// If we're not in a post context, skip as there won't be any fixes.
		if ( $post === null ) {
			return $sizes;
		}
		$post_id = $post->ID;

		$fixes         = self::get_fixes( $post_id );
		$image_width   = 0;
		$image_url_key = self::fix_url( $image_url );

		if ( $attachment_id && isset( $fixes[ $attachment_id ]['image_width'] ) ) {
			$image_width = $fixes[ $attachment_id ]['image_width'];
		} elseif ( isset( $fixes[ $image_url_key ]['image_width'] ) ) {
			$image_width = $fixes[ $image_url_key ]['image_width'];
		}
		if ( $image_width ) {
			$sizes = sprintf( '(max-width: %1$dpx) 100vw, %1$dpx', $image_width );
		}

		return $sizes;
	}

	public static function fix_content( $content ) {
		$post = get_post();
		if ( $post === null ) {
			return $content;
		}
		$fixes = self::get_fixes( $post->ID );
		if ( ! $fixes ) {
			return $content;
		}

		$tag_processor = new \WP_HTML_Tag_Processor( $content );

		while ( $tag_processor->next_tag( array( 'tag_name' => 'img' ) ) ) {
			$image_url     = $tag_processor->get_attribute( 'src' );
			$image_url_key = md5( self::fix_url( $image_url ) );
			$srcset        = $tag_processor->get_attribute( 'srcset' );

			if ( ! isset( $fixes[ $image_url_key ] ) ) {
				continue;
			}

			if (
				isset( $fixes[ $image_url_key ]['image_width'] )
				&& ! strpos( (string) $srcset, ' ' . $fixes[ $image_url_key ]['image_width'] . 'w' )
			) {
				$tag_processor->set_attribute(
					'srcset',
					\Automattic\Jetpack\Image_CDN\Image_CDN_Core::cdn_url(
						$image_url,
						array( 'w' => $fixes[ $image_url_key ]['image_width'] )
					) . ' ' . $fixes[ $image_url_key ]['image_width'] . 'w, ' . $srcset
				);
			}

			if ( isset( $fixes[ $image_url_key ]['image_width'] ) ) {
				$tag_processor->set_attribute( 'sizes', sprintf( '(max-width: %1$dpx) 100vw, %1$dpx', $fixes[ $image_url_key ]['image_width'] ) );
			}
		}

		return $tag_processor->get_updated_html();
	}

	public static function sanitize_params( $params ) {

		if ( ! isset( $params['image_url'] ) ) {
			throw new \Exception( 'Missing image_url' );
		}
		if ( ! isset( $params['image_width'] ) ) {
			throw new \Exception( 'Missing image_width' );
		}
		if ( ! isset( $params['image_height'] ) ) {
			throw new \Exception( 'Missing image_height' );
		}
		if ( ! isset( $params['post_id'] ) ) {
			throw new \Exception( 'Missing post_id' );
		}
		if ( ! isset( $params['fix'] ) ) {
			throw new \Exception( 'Missing fix' );
		}

		if ( ! isset( $params['image_id'] ) ) {
			throw new \Exception( 'Missing image_id' );
		}

		$out                 = array();
		$out['image_id']     = absint( $params['image_id'] );
		$out['image_url']    = esc_url_raw( $params['image_url'] );
		$out['image_width']  = absint( $params['image_width'] );
		$out['image_height'] = absint( $params['image_height'] );
		$out['post_id']      = absint( $params['post_id'] );
		$out['fix']          = (bool) $params['fix'];

		return $out;
	}
}
