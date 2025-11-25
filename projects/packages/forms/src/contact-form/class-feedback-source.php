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
	 * @var string
	 */
	private $id = '';

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
	 * Possible values: single, widget, block_template, block_template_part
	 *
	 * @var string
	 */
	private $source_type = 'single';

	/**
	 * The request URL of the feedback entry.
	 *
	 * @var string
	 */
	private $request_url = '';

	/**
	 * Constructor for Feedback_Source.
	 *
	 * @param string|int $id          The Source ID = post ID, widget ID, block template ID, or 0 for homepage or non-post/page.
	 * @param string     $title       The title of the feedback entry.
	 * @param int        $page_number The page number of the feedback entry, default is 1.
	 * @param string     $source_type The source type of the feedback entry, default is 'single'.
	 * @param string     $request_url The request URL of the feedback entry.
	 */
	public function __construct( $id = 0, $title = '', $page_number = 1, $source_type = 'single', $request_url = '' ) {

		if ( is_numeric( $id ) ) {
			$this->id = $id > 0 ? $id : 0;
		} else {
			$this->id = $id;
		}

		if ( is_numeric( $page_number ) ) {
			$this->page_number = $page_number > 0 ? $page_number : 1;
		} else {
			$this->page_number = 1;
		}

		$this->title       = $title;
		$this->permalink   = empty( $request_url ) ? home_url() : $request_url;
		$this->source_type = $source_type; // possible source types: single, widget, block_template, block_template_part
		$this->request_url = $request_url;

		if ( is_numeric( $id ) && ! empty( $id ) ) {
			$entry_post = get_post( (int) $id );
			if ( $entry_post && $entry_post->post_status === 'publish' ) {
				$this->permalink = get_permalink( $entry_post );
				$this->title     = get_the_title( $entry_post );
			} elseif ( $entry_post ) {
				$this->permalink = '';

				if ( $entry_post->post_status === 'trash' ) {
					/* translators: %s is the post title */
					$this->title = sprintf( __( '(trashed) %s', 'jetpack-forms' ), $this->title );
				}
			}
			if ( empty( $entry_post ) ) {
				/* translators: %s is the post title */
				$this->title     = sprintf( __( '(deleted) %s', 'jetpack-forms' ), $this->title );
				$this->permalink = '';
			}
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

		$title = $current_post->post_title ?? __( '(no title)', 'jetpack-forms' );

		return new self( $id, $title, $current_page_number );
	}

	/**
	 * Get the title of the current page. That we can then use to display in the feedback entry.
	 *
	 * @return string The title of the current page. That we want to show to the user. To tell them where the feedback was left.
	 */
	private static function get_source_title() {
		if ( is_front_page() ) {
			return get_bloginfo( 'name' );
		}
		if ( is_home() ) {
			return get_the_title( get_option( 'page_for_posts', true ) );
		}
		if ( is_singular() ) {
			return get_the_title();
		}
		if ( is_archive() ) {
			return get_the_archive_title();
		}
		if ( is_search() ) {
			/* translators: %s is the search term */
			return sprintf( __( 'Search results for: %s', 'jetpack-forms' ), get_search_query() );
		}
		if ( is_404() ) {
			return __( '404 Not Found', 'jetpack-forms' );
		}
		return get_bloginfo( 'name' );
	}

	/**
	 * Creates a Feedback_Source instance for a block template.
	 *
	 * @param array $attributes Form Shortcode attributes.
	 *
	 * @return Feedback_Source Returns an instance of Feedback_Source.
	 */
	public static function get_current( $attributes ) {
		global $wp, $page;
		$current_url = home_url( add_query_arg( array(), $wp->request ) );
		if ( isset( $attributes['widget'] ) && ! empty( $attributes['widget'] ) ) {
			return new self( $attributes['widget'], self::get_source_title(), 1, 'widget', $current_url );
		}

		if ( isset( $attributes['block_template'] ) && ! empty( $attributes['block_template'] ) ) {
			global $_wp_current_template_id;
			return new self( $_wp_current_template_id, self::get_source_title(), $page, 'block_template', $current_url );
		}

		if ( isset( $attributes['block_template_part'] ) && ! empty( $attributes['block_template_part'] ) ) {
			return new self( $attributes['block_template_part'], self::get_source_title(), $page, 'block_template_part', $current_url );
		}

		return new Feedback_Source( \get_the_ID(), \get_the_title(), $page, 'single', $current_url );
	}

	/**
	 * Creates a Feedback_Source instance from serialized data.
	 *
	 * @param array $data The serialized data.
	 * @return Feedback_Source Returns an instance of Feedback_Source.
	 */
	public static function from_serialized( $data ) {
		$id          = $data['source_id'] ?? 0;
		$title       = $data['entry_title'] ?? '';
		$page_number = $data['entry_page'] ?? 1;
		$source_type = $data['source_type'] ?? 'single';
		$request_url = $data['request_url'] ?? '';

		return new self( $id, $title, $page_number, $source_type, $request_url );
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
		return wp_validate_redirect( $this->permalink, home_url() );
	}

	/**
	 * Get the edit URL of the form or page where the feedback was submitted from.
	 *
	 * @return string The edit URL of the form or page.
	 */
	public function get_edit_form_url() {

		if ( current_user_can( 'edit_theme_options' ) ) {
			if ( $this->source_type === 'block_template' && \wp_is_block_theme() ) {
				return admin_url( 'site-editor.php?p=' . esc_attr( '/wp_template/' . addslashes( $this->id ) ) . '&canvas=edit' );
			}

			if ( $this->source_type === 'block_template_part' && \wp_is_block_theme() ) {
				return admin_url( 'site-editor.php?p=' . esc_attr( '/wp_template_part/' . addslashes( $this->id ) ) . '&canvas=edit' );
			}

			if ( $this->source_type === 'widget' && current_theme_supports( 'widgets' ) ) {
				return admin_url( 'widgets.php' );
			}
		}

		if ( $this->id && is_numeric( $this->id ) && $this->id > 0 && current_user_can( 'edit_post', (int) $this->id ) ) {
			$entry_post = get_post( (int) $this->id );
			if ( $entry_post && $entry_post->post_status === 'trash' ) {
				return ''; // No edit link is possible for trashed posts. They need to be restored first.
			}
			return \get_edit_post_link( (int) $this->id, 'url' );
		}

		return '';
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
	 * @return int|string The ID of the feedback entry.
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
			'source_id'   => $this->id,
			'source_type' => $this->source_type,
			'request_url' => $this->request_url,
		);
	}
}
