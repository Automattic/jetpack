<?php

require_once( AMP__ROOT__ . '/includes/utils/class-amp-dom-utils.php' );
require_once( AMP__ROOT__ . '/includes/sanitizers/class-amp-base-sanitizer.php' );
require_once( AMP__ROOT__ . '/includes/embeds/class-amp-base-embed-handler.php' );

class AMP_Content {
	private $content;
	private $amp_content = '';
	private $amp_scripts = array();
	private $amp_styles = array();
	private $args = array();
	private $embed_handler_classes = array();
	private $sanitizer_classes = array();

	public function __construct( $content, $embed_handler_classes, $sanitizer_classes, $args = array() ) {
		$this->content = $content;
		$this->args = $args;
		$this->embed_handler_classes = $embed_handler_classes;
		$this->sanitizer_classes = $sanitizer_classes;

		$this->transform();
	}

	public function get_amp_content() {
		return $this->amp_content;
	}

	public function get_amp_scripts() {
		return $this->amp_scripts;
	}

	public function get_amp_styles() {
		return $this->amp_styles;
	}

	private function transform() {
		$content = $this->content;

		// First, embeds + the_content filter
		$embed_handlers = $this->register_embed_handlers();
		$content = apply_filters( 'the_content', $content );
		$this->unregister_embed_handlers( $embed_handlers );

		// Then, sanitize to strip and/or convert non-amp content
		$content = $this->sanitize( $content );

		$this->amp_content = $content;
	}

	private function add_scripts( $scripts ) {
		$this->amp_scripts = array_merge( $this->amp_scripts, $scripts );
	}

	private function add_styles( $styles ) {
		$this->amp_styles = array_merge( $this->amp_styles, $styles );
	}

	private function register_embed_handlers() {
		$embed_handlers = array();

		foreach ( $this->embed_handler_classes as $embed_handler_class => $args ) {
			$embed_handler = new $embed_handler_class( array_merge( $this->args, $args ) );

			if ( ! is_subclass_of( $embed_handler, 'AMP_Base_Embed_Handler' ) ) {
				_doing_it_wrong( __METHOD__, sprintf( __( 'Embed Handler (%s) must extend `AMP_Embed_Handler`', 'amp' ), $embed_handler_class ), '0.1' );
				continue;
			}

			$embed_handler->register_embed();
			$embed_handlers[] = $embed_handler;
		}

		return $embed_handlers;
	}

	private function unregister_embed_handlers( $embed_handlers ) {
		foreach ( $embed_handlers as $embed_handler ) {
			 $this->add_scripts( $embed_handler->get_scripts() );
			 $embed_handler->unregister_embed();
		}
	}

	private function sanitize( $content ) {
		list( $sanitized_content, $scripts, $styles ) = AMP_Content_Sanitizer::sanitize( $content, $this->sanitizer_classes, $this->args );

		$this->add_scripts( $scripts );
		$this->add_styles( $styles );

		return $sanitized_content;
	}
}

class AMP_Content_Sanitizer {
	public static function sanitize( $content, $sanitizer_classes, $global_args = array() ) {
		$scripts = array();
		$styles = array();
		$dom = AMP_DOM_Utils::get_dom_from_content( $content );

		foreach ( $sanitizer_classes as $sanitizer_class => $args ) {
			if ( ! class_exists( $sanitizer_class ) ) {
				_doing_it_wrong( __METHOD__, sprintf( __( 'Sanitizer (%s) class does not exist', 'amp' ), esc_html( $sanitizer_class ) ), '0.4.1' );
				continue;
			}

			$sanitizer = new $sanitizer_class( $dom, array_merge( $global_args, $args ) );

			if ( ! is_subclass_of( $sanitizer, 'AMP_Base_Sanitizer' ) ) {
				_doing_it_wrong( __METHOD__, sprintf( __( 'Sanitizer (%s) must extend `AMP_Base_Sanitizer`', 'amp' ), esc_html( $sanitizer_class ) ), '0.1' );
				continue;
			}

			$sanitizer->sanitize();

			$scripts = array_merge( $scripts, $sanitizer->get_scripts() );
			$styles = array_merge( $styles, $sanitizer->get_styles() );
		}

		$sanitized_content = AMP_DOM_Utils::get_content_from_dom( $dom );

		return array( $sanitized_content, $scripts, $styles );
	}
}
