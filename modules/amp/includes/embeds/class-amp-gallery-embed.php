<?php

require_once( AMP__ROOT__ . '/includes/embeds/class-amp-base-embed-handler.php' );

class AMP_Gallery_Embed_Handler extends AMP_Base_Embed_Handler {
	private static $script_slug = 'amp-carousel';
	private static $script_src = 'https://cdn.ampproject.org/v0/amp-carousel-0.1.js';

	public function register_embed() {
		add_shortcode( 'gallery', array( $this, 'shortcode' ) );
	}

	public function unregister_embed() {
		remove_shortcode( 'gallery' );
	}

	public function get_scripts() {
		if ( ! $this->did_convert_elements ) {
			return array();
		}

		return array( self::$script_slug => self::$script_src );
	}

	public function shortcode( $attr ) {
		$post = get_post();

		if ( ! empty( $attr['ids'] ) ) {
			// 'ids' is explicitly ordered, unless you specify otherwise.
			if ( empty( $attr['orderby'] ) ) {
				$attr['orderby'] = 'post__in';
			}
			$attr['include'] = $attr['ids'];
		}

		$atts = shortcode_atts( array(
			'order'      => 'ASC',
			'orderby'    => 'menu_order ID',
			'id'         => $post ? $post->ID : 0,
			'include'    => '',
			'exclude'    => '',
			'size'       => array( $this->args['width'], $this->args['height'] )
		), $attr, 'gallery' );

		$id = intval( $atts['id'] );

		if ( ! empty( $atts['include'] ) ) {
			$attachments = get_posts( array(
				'include' => $atts['include'],
				'post_status' => 'inherit',
				'post_type' => 'attachment',
				'post_mime_type' => 'image',
				'order' => $atts['order'],
				'orderby' => $atts['orderby'],
				'fields' => 'ids',
			) );
		} elseif ( ! empty( $atts['exclude'] ) ) {
			$attachments = get_children( array(
				'post_parent' => $id,
				'exclude' => $atts['exclude'],
				'post_status' => 'inherit',
				'post_type' => 'attachment',
				'post_mime_type' => 'image',
				'order' => $atts['order'],
				'orderby' => $atts['orderby'],
				'fields' => 'ids',
			) );
		} else {
			$attachments = get_children( array(
				'post_parent' => $id,
				'post_status' => 'inherit',
				'post_type' => 'attachment',
				'post_mime_type' => 'image',
				'order' => $atts['order'],
				'orderby' => $atts['orderby'],
				'fields' => 'ids',
			) );
		}

		if ( empty( $attachments ) ) {
			return '';
		}

		$urls = array();
		foreach ( $attachments as $attachment_id ) {
			list( $url, $width, $height ) = wp_get_attachment_image_src( $attachment_id, $atts['size'], true );

			if ( ! $url ) {
				continue;
			}

			$urls[] = array(
				'url' => $url,
				'width' => $width,
				'height' => $height,
			);
		}

		return $this->render( array(
			'images' => $urls,
		) );
	}

	public function render( $args ) {
		$this->did_convert_elements = true;

		$args = wp_parse_args( $args, array(
			'images' => false,
		) );

		if ( empty( $args['images'] ) ) {
			return '';
		}

		$images = array();
		foreach ( $args['images'] as $image ) {
			$images[] = AMP_HTML_Utils::build_tag(
				'amp-img',
				array(
					'src' => $image['url'],
					'width' => $image['width'],
					'height' => $image['height'],
					'layout' => 'responsive',
				)
			);
		}

		return AMP_HTML_Utils::build_tag(
			'amp-carousel',
			array(
				'width' => $this->args['width'],
				'height' => $this->args['height'],
				'type' => 'slides',
				'layout' => 'responsive',
			),
			implode( PHP_EOL, $images )
		);
	}
}
