<?php

abstract class Jetpack_Tiled_Gallery_Layout {
	// Template whitelist
	private static $templates = array( 'carousel-container', 'circle-layout', 'rectangular-layout', 'square-layout' );
	private static $partials = array( 'carousel-image-args', 'item' );

	protected $type; // Defined in child classes
	public $attachments;
	public $link;
	public $grayscale;
	public $columns;
	public function __construct( $attachments, $link, $grayscale, $columns ) {

		$this->attachments = $attachments;
		$this->link = $link;
		$this->needs_attachment_link = ! ( isset( $link ) && $link == 'file' );
		$this->grayscale = $grayscale;
		$this->columns = $columns;
	}

	public function HTML( $context = array() ) {
		// Render the carousel container template, which will take the
		// appropriate strategy to fill it
		ob_start();
		$this->template( 'carousel-container', array_merge( $context, array(
			'attachments' => $this->attachments,
			'link' => $this->link,
			'needs_attachment_link' => $this->needs_attachment_link,
			'grayscale' => $this->grayscale
		) ) );
		$html = ob_get_clean();

		return $html;
	}

	private function template( $name, $context = null ) {
		if ( ! in_array( $name, self::$templates ) ) {
			return;
		}

		if ( isset( $context ) ) {
			extract( $context );
		}

		require dirname( __FILE__ ) . "/templates/$name.php";
	}

	private function partial( $name, $context = null ) {
		if ( ! in_array( $name, self::$partials ) ) {
			return;
		}

		if ( isset( $context ) ) {
			extract( $context );
		}

		require dirname( __FILE__ ) . "/templates/partials/$name.php";
	}

	protected function get_container_extra_data() {
		global $post;

		$blog_id = (int) get_current_blog_id();

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$likes_blog_id = $blog_id;
		} else {
			$likes_blog_id = Jetpack_Options::get_option( 'id' );
		}

		if ( class_exists( 'Jetpack_Carousel' ) || in_array( 'carousel', Jetpack::get_active_modules() ) || 'carousel' == $this->link ) {
			$extra_data = array( 'blog_id' => $blog_id, 'permalink' => get_permalink( isset( $post->ID ) ? $post->ID : 0 ), 'likes_blog_id' => $likes_blog_id );
		} else {
			$extra_data = null;
		}

		return $extra_data;
	}
}
?>
