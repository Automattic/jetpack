<?php
/**
 * Feedback Entry
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

/**
 * Class Feedback_Source
 *
 * Represents where a feedback was created from, feedback entry with an ID, title, permalink, and page number.
 */
class Feedback_Source {

	/**
	 * The ID of the post or page that the feedback was created on.
	 *
	 * @var int
	 */
	private $id = 0;

	/**
	 * The title of the  post or page that the feedback was created on.
	 *
	 * @var string
	 */
	private $title = '';

	/**
	 * The permalink of the feedback entry.
	 *
	 * @var string
	 */
	private $permalink = '';

	/**
	 * The page number of the feedback post or page that the feedback was created on.
	 * This is used to determine the page number in a paginated view of page or post.
	 *
	 * @var int
	 */
	private $page_number = 1;

	/**
	 * The source type of the feedback entry.
	 * This is used to determine how the feedback was created.
	 *
	 * @var string
	 */
	private $source_type = 'single';

	/**
	 * The source type of the feedback entry.
	 * This is used to determine how the feedback was created.
	 *
	 * @var string
	 */
	public $source_id = '';

	/**
	 * Constructor for Feedback_Source.
	 *
	 * @param int    $id          The ID of the feedback entry.
	 * @param string $title       The title of the feedback entry.
	 * @param int    $page_number The page number of the feedback entry, default is 1.
	 * @param string $source_type The source type of the feedback entry.
	 * @param string $source_id   The source ID of the feedback entry.
	 */
	public function __construct( $id = 0, $title = '', $page_number = 1, $source_type = 'single', $source_id = '' ) {

		$this->id          = $id > 0 ? (int) $id : 0;
		$this->title       = $title;
		$this->page_number = $page_number;
		$this->permalink   = $this->id === 0 ? home_url() : '';
		$this->source_type = $source_type; // possible source types: single, widget, template, template-part
		$this->source_id   = $source_id;

		if ( $id <= 0 ) {
			return;
		}

		$entry_post = get_post( $id );

		if ( $entry_post && $entry_post->post_status === 'publish' ) {
			$this->permalink = get_permalink( $entry_post );
			$this->title     = get_the_title( $entry_post );
		}
	}

	/**
	 * Creates a Feedback_Source instance from a submission.
	 *
	 * @param \WP_Post|null $current_post The current post object.
	 * @param int           $current_page_number The current page number, default is 1.
	 * @return Feedback_Source Returns an instance of Feedback_Source.
	 */
	public static function from_submission( $current_post, int $current_page_number = 1 ) {
		$id = isset( $current_post->ID ) ? (int) $current_post->ID : 0;

		if ( ! $current_post instanceof \WP_Post || $id === 0 ) {
			return new self( 0, '', $current_page_number );
		}

		$title = $current_post->post_title ?? '';

		return new self( $id, $title, $current_page_number );
	}

	/**
	 * Get the permalink of the feedback entry.
	 *
	 * @return string The permalink of the feedback entry.
	 */
	public function get_permalink() {
		if ( $this->source_type === 'widget' ) {
			if ( $this->page_number > 1 && ! empty( $this->permalink ) ) {
				return add_query_arg( 'page', $this->page_number, $this->permalink );
			}
		}

		if ( $this->source_type === 'widget' ) {
			if ( $this->page_number > 1 && ! empty( $this->permalink ) ) {
				return add_query_arg( 'page', $this->page_number, $this->permalink );
			}
		}
		return $this->permalink;
	}

	/**
	 * Get the relative permalink of the feedback entry.
	 *
	 * @return string The relative permalink of the feedback entry.
	 */
	public function get_relative_permalink() {
		if ( ! empty( $this->permalink ) ) {
			return wp_make_link_relative( $this->get_permalink() );
		}
		return '';
	}

	/**
	 * Get the page number of the feedback entry.
	 *
	 * @return int The page number of the feedback entry.
	 */
	public function get_page_number() {
		return $this->page_number;
	}
	/**
	 * Get the title of the feedback entry.
	 *
	 * @return string The title of the feedback entry.
	 */
	public function get_title() {
		return $this->title;
	}
	/**
	 * Get the post id of the feedback entry.
	 *
	 * @return int The ID of the feedback entry.
	 */
	public function get_id() {
		return $this->id;
	}

	/**
	 * Get the page number of the entry title.
	 *
	 * @return array
	 */
	public function serialize() {
		return array(
			'entry_title' => $this->title,
			'entry_page'  => $this->page_number,
			'source_type' => $this->source_type,
			'source_id'   => $this->source_id,
		);
	}

	/**
	 * Creates a Feedback_Source instance from a block template.
	 *
	 * @return Feedback_Source Returns an instance of Feedback_Source.
	 */
	public static function from_block_template() {
		global $_wp_current_template_id;

		return new self( 0, self::title_from_template(), 0, 'block_template', $_wp_current_template_id );
	}

	/**
	 * Creates a Feedback_Source instance from a block template part.
	 *
	 * @param string $part The template part identifier.
	 * @return Feedback_Source Returns an instance of Feedback_Source.
	 */
	public static function from_block_template_part( $part ) {
		return new self( 0, self::title_from_template(), 0, 'block_template_part', $part );
	}

	/**
	 * Creates a Feedback_Source instance from a widget.
	 *
	 * @param string $widget_name The widget name.
	 * @return Feedback_Source Returns an instance of Feedback_Source.
	 */
	public static function from_widget( $widget_name ) {

		$sidebar    = explode( '||', $widget_name );
		$sidebar_id = $sidebar[1] ?? '';

		$sidebar_info = wp_get_sidebar( $sidebar_id );
		if ( ! $sidebar_info ) {
			$sidebar_info = array( 'name' => 'Unknown Sidebar' );
		}

		return new self( 0, $sidebar_info['name'], 0, 'widget', $widget_name );
	}

	/**
	 * Creates a Feedback_Source instance from serialized data.
	 *
	 * @param array $data The serialized data.
	 * @return Feedback_Source|null Returns an instance of Feedback_Source or null if data is invalid.
	 */
	public static function from_serialized( $data ) {
		if ( ! is_array( $data ) ) {
			return null;
		}

		$id          = isset( $data['id'] ) ? (int) $data['id'] : 0;
		$title       = isset( $data['entry_title'] ) ? $data['entry_title'] : '';
		$page_number = isset( $data['entry_page'] ) ? (int) $data['entry_page'] : 1;
		$source_type = isset( $data['source_type'] ) ? $data['source_type'] : 'single';
		$source_id   = isset( $data['source_id'] ) ? $data['source_id'] : '';

		return new self( $id, $title, $page_number, $source_type, $source_id );
	}

	/**
	 * Gets the title based on the current template context.
	 *
	 * @return string The template title.
	 */
	private static function title_from_template() {
		if ( is_home() ) {
			return __( 'Home Page', 'jetpack-forms' );
		}

		if ( is_front_page() ) {
			return __( 'Front Page', 'jetpack-forms' );
		}

		if ( is_archive() ) {
			return __( 'Archive Page', 'jetpack-forms' );
		}

		return __( 'Unknown Template', 'jetpack-forms' );
	}

	/**
	 * Return the editor URL for the feedback entry.
	 * So that users can edit the
	 */
	public function get_editor_url() {
		if ( $this->source_type === 'block_template' ) {
			return admin_url( 'site-editor.php?p=' . esc_attr( '/wp_template/' . addslashes( $this->source_id ) ) . '&canvas=edit' );
		}

		if ( $this->source_type === 'block_template_part' ) {
			return admin_url( 'site-editor.php?p=' . esc_attr( '/wp_template_part/' . addslashes( $this->source_id ) ) . '&canvas=edit' );
		}

		if ( $this->source_type === 'block_template_part' ) {
			return admin_url( 'site-editor.php?p=' . esc_attr( '/wp_template_part/' . addslashes( $this->source_id ) ) . '&canvas=edit' );
		}

		if ( $this->source_type === 'widget' ) {
			return admin_url( 'widgets.php' );
		}

		return get_edit_post_link( $this->source_id );
	}
}
