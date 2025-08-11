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
	 * Constructor for Feedback_Source.
	 *
	 * @param int    $id          The ID of the feedback entry.
	 * @param string $title       The title of the feedback entry.
	 * @param int    $page_number The page number of the feedback entry, default is 1.
	 */
	public function __construct( $id, $title, $page_number = 1 ) {

		$this->id          = $id > 0 ? (int) $id : 0;
		$this->title       = $title;
		$this->page_number = $page_number;
		$this->permalink   = '';

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
		if ( $this->page_number > 1 && ! empty( $this->permalink ) ) {
			return add_query_arg( 'page', $this->page_number, $this->permalink );
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
		);
	}
}
