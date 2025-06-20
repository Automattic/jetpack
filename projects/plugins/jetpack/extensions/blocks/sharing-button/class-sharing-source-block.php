<?php
/**
 * Define all sharing sources.
 *
 * @since 13.0
 *
 * @package automattic/jetpack
 *
 * phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */

namespace Automattic\Jetpack\Extensions\Sharing_Button_Block;

use Automattic\Jetpack\Device_Detection\User_Agent_Info;
use Jetpack_PostImages;
use WP_Post;

/**
 * Base class for sharing sources.
 * See individual sharing classes below for the implementation of this class.
 */
abstract class Sharing_Source_Block {
	/**
	 * Sharing unique ID.
	 *
	 * @var int
	 */
	protected $id;

	/**
	 * Constructor.
	 *
	 * @param int $id       Sharing source ID.
	 */
	public function __construct( $id ) {
		$this->id = $id;
	}

	/**
	 * Get the protocol to use for a sharing service, based on the site settings.
	 *
	 * @return string
	 */
	public function http() {
		return 'https';
	}

	/**
	 * Get unique sharing ID.
	 *
	 * @return int
	 */
	public function get_id() {
		return $this->id;
	}

	/**
	 * Get unique sharing ID. Similar to get_id().
	 *
	 * @return int
	 */
	public function get_class() {
		return $this->id;
	}

	/**
	 * Get stats for a site, a post, or a sharing service.
	 * Soon to come to a .org plugin near you!
	 *
	 * @param WP_Post|bool $post Post object.
	 *
	 * @return int
	 */
	public function get_total( $post = false ) {
		global $wpdb, $blog_id;

		$name = strtolower( (string) $this->get_id() );

		if ( $post === false ) {
			// get total number of shares for service
			return (int) $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
				$wpdb->prepare(
					'SELECT SUM( count ) FROM sharing_stats WHERE blog_id = %d AND share_service = %s',
					$blog_id,
					$name
				)
			);
		}

		// get total shares for a post
		return (int) $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				'SELECT count FROM sharing_stats WHERE blog_id = %d AND post_id = %d AND share_service = %s',
				$blog_id,
				$post->ID,
				$name
			)
		);
	}

	/**
	 * Get a post's permalink to use for sharing.
	 *
	 * @param int $post_id Post ID.
	 *
	 * @return string
	 */
	public function get_share_url( $post_id ) {
		/**
		 * Filter the sharing permalink.
		 *
		 * @module sharedaddy
		 *
		 * @since 1.2.0
		 *
		 * @param string get_permalink( $post_id ) Post Permalink.
		 * @param int $post_id Post ID.
		 * @param int $this->id Sharing ID.
		 */
		return apply_filters( 'sharing_permalink', get_permalink( $post_id ), $post_id, $this->id );
	}

	/**
	 * Get a post's title to use for sharing.
	 *
	 * @param int $post_id Post ID.
	 *
	 * @return string
	 */
	public function get_share_title( $post_id ) {
		$post = get_post( $post_id );
		/**
		 * Filter the sharing title.
		 *
		 * @module sharedaddy
		 *
		 * @since 2.8.0
		 *
		 * @param string $post->post_title Post Title.
		 * @param int $post_id Post ID.
		 * @param int $this->id Sharing ID.
		 */
		$title = $post instanceof WP_Post ? apply_filters( 'sharing_title', $post->post_title, $post_id, $this->id ) : '';
		return html_entity_decode( wp_kses( $title, '' ), ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401 );
	}

	/**
	 * Get a comma-separated list of the post's tags to use for sharing.
	 * Prepends a '#' to each tag.
	 *
	 * @param int $post_id Post ID.
	 *
	 * @return string
	 */
	public function get_share_tags( $post_id ) {
		$tags = get_the_tags( $post_id );
		if ( ! $tags ) {
			return '';
		}

		$tags = array_map(
			function ( $tag ) {
				// Camel case the tag name and remove spaces as well as apostrophes.
				$tag = preg_replace( '/\s+|\'/', '', ucwords( $tag->name ) );

				// Return with a '#' prepended.
				return '#' . $tag;
			},
			$tags
		);

		/**
		 * Allow customizing how the list of tags is displayed.
		 *
		 * @module sharedaddy
		 * @since 11.9
		 *
		 * @param string $tags     Comma-separated list of tags.
		 * @param int    $post_id  Post ID.
		 * @param int    $this->id Sharing ID.
		 */
		$tag_list = (string) apply_filters( 'jetpack_sharing_tag_list', implode( ', ', $tags ), $post_id, $this->id );

		return html_entity_decode( wp_kses( $tag_list, '' ), ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401 );
	}

	/**
	 * Get the URL for the link.
	 *
	 * @param int         $post_id         Post ID.
	 * @param string      $query           Additional query arguments to add to the link. They should be in 'foo=bar&baz=1' format.
	 * @param bool|string $id              Sharing ID to include in the data-shared attribute.
	 * @param array       $data_attributes The keys are used as additional attribute names with 'data-' prefix.
	 *                                     The values are used as the attribute values.
	 * @return object Link related data (url and data_attributes);
	 */
	public function get_link( $post_id, $query = '', $id = false, $data_attributes = array() ) {
		$url             = $this->get_url( $this->get_process_request_url( $post_id ), $query, $id );
		$data_attributes = $this->get_data_attributes( $id, $data_attributes );

		return array(
			'url'             => $url,
			'data_attributes' => $data_attributes,
		);
	}

	/**
	 * Get the URL for the link.
	 *
	 * @param string      $url             Post URL to share.
	 * @param string      $query           Additional query arguments to add to the link. They should be in 'foo=bar&baz=1' format.
	 * @param bool|string $id              Sharing ID to include in the data-shared attribute.
	 *
	 * @return string The link URL.
	 */
	public function get_url( $url, $query = '', $id = false ) {
		$args = func_get_args();

		/**
		 * Filter the sharing display ID.
		 *
		 * @module sharedaddy
		 *
		 * @since 3.4.0
		 *
		 * @param string|false $id Sharing ID.
		 * @param object $this Sharing service properties.
		 * @param array $args Array of sharing service options.
		 */
		$id = apply_filters( 'jetpack_sharing_display_id', $id, $this, $args );
		/**
		 * Filter the sharing display link.
		 *
		 * @module sharedaddy
		 *
		 * @since 2.8.0
		 *
		 * @param string $url Post URL.
		 * @param object $this Sharing service properties.
		 * @param string|false $id Sharing ID.
		 * @param array $args Array of sharing service options.
		 */
		$url = apply_filters( 'sharing_display_link', $url, $this, $id, $args ); // backwards compatibility
		/**
		 * Filter the sharing display link.
		 *
		 * @module sharedaddy
		 *
		 * @since 2.8.0
		 *
		 * @param string $url Post URL.
		 * @param object $this Sharing service properties.
		 * @param string|false $id Sharing ID.
		 * @param array $args Array of sharing service options.
		 */
		$url = apply_filters( 'jetpack_sharing_display_link', $url, $this, $id, $args );
		/**
		 * Filter the sharing display query.
		 *
		 * @module sharedaddy
		 *
		 * @since 2.8.0
		 *
		 * @param string $query Sharing service URL parameter.
		 * @param object $this Sharing service properties.
		 * @param string|false $id Sharing ID.
		 * @param array $args Array of sharing service options.
		 */
		$query = apply_filters( 'jetpack_sharing_display_query', $query, $this, $id, $args );

		if ( ! empty( $query ) ) {
			if ( false === stripos( $url, '?' ) ) {
				$url .= '?' . $query;
			} else {
				$url .= '&amp;' . $query;
			}
		}

		return $url;
	}

	/**
	 * Add extra JavaScript to a sharing service.
	 *
	 * @param array $params Array of sharing options.
	 *
	 * @return void
	 */
	public function js_dialog( $params = array() ) {
	}

	/**
	 * Get custom data attributes for the link.
	 *
	 * @param bool|string $id              Sharing ID to include in the data-shared attribute.
	 * @param array       $data_attributes The keys are used as additional attribute names with 'data-' prefix.
	 *                                     The values are used as the attribute values.
	 *
	 * @return string Encoded data attributes.
	 */
	public function get_data_attributes( $id = false, $data_attributes = array() ) {
		$args = func_get_args();

		/**
		 * Filter the sharing data attributes.
		 *
		 * @module sharedaddy
		 *
		 * @since 11.0
		 *
		 * @param array $data_attributes Attributes supplied from the sharing source.
		 *                               Note that 'data-' will be prepended to all keys.
		 * @param Sharing_Source $this Sharing source instance.
		 * @param string|false $id Sharing ID.
		 * @param array $args Array of sharing service options.
		 */
		$data_attributes = apply_filters( 'jetpack_sharing_data_attributes', (array) $data_attributes, $this, $id, $args );

		$encoded_data_attributes = '';
		if ( ! empty( $data_attributes ) ) {
			$encoded_data_attributes = implode(
				' ',
				array_map(
					/** Format attributes */
					function ( $data_key, $data_value ) {
						return sprintf(
							'data-%s="%s"',
							esc_attr( str_replace( array( ' ', '"' ), '', $data_key ) ),
							esc_attr( $data_value )
						);
					},
					array_keys( $data_attributes ),
					array_values( $data_attributes )
				)
			);
		}
		return $encoded_data_attributes;
	}

	/**
	 * Get an unfiltered post permalink to use when generating a sharing URL with get_link.
	 * Use instead of get_share_url for non-official styles as get_permalink ensures that process_request
	 * will be executed more reliably, in the case that the filtered URL uses a service that strips query parameters.
	 *
	 * @since 3.7.0
	 * @param int $post_id Post ID.
	 *
	 * @uses get_permalink
	 *
	 * @return string get_permalink( $post_id ) Post permalink.
	 */
	public function get_process_request_url( $post_id ) {
		return get_permalink( $post_id );
	}

	/**
	 * Does the service have advanced options.
	 *
	 * @return bool
	 */
	public function has_advanced_options() {
		return false;
	}

	/**
	 * Process sharing request. Add actions that need to happen when sharing here.
	 *
	 * @param WP_Post $post Post object.
	 * @param array   $post_data Array of information about the post we're sharing.
	 *
	 * @return void
	 */
	public function process_request( $post, array $post_data ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		/**
		 * Fires when a post is shared via one of the sharing buttons.
		 *
		 * @module sharedaddy
		 *
		 * @since 1.1.0
		 *
		 * @param array $args Aray of information about the sharing service.
		 */
		do_action(
			'sharing_bump_stats',
			array(
				'service' => $this,
				'post'    => $post,
			)
		);
	}

	/**
	 * Redirect to an external social network site to finish sharing.
	 *
	 * @param string $url Sharing URL for a given service.
	 * @return never
	 */
	public function redirect_request( $url ) {
		wp_redirect( $url ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- We allow external redirects here; we define them ourselves.

		// We set up this custom header to indicate to search engines not to index this page.
		header( 'X-Robots-Tag: noindex, nofollow' );
		die( 0 );
	}
}

/**
 * Handle the display of the email sharing button.
 */
class Share_Email_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'email';

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return _x( 'Email', 'as sharing source', 'jetpack' );
	}

	/**
	 * Helper function to return a nonce action based on the current post.
	 *
	 * @param int $post_id The current post id if it is defined.
	 * @return string The nonce action name.
	 */
	protected function get_email_share_nonce_action( $post_id ) {
		if ( ! empty( $post_id ) && 0 !== $post_id ) {
			return 'jetpack-email-share-' . $post_id;
		}

		return 'jetpack-email-share';
	}

	/**
	 * Get the URL for the link.
	 *
	 * @param int         $post_id         Post ID.
	 * @param string      $query           Additional query arguments to add to the link. They should be in 'foo=bar&baz=1' format.
	 * @param bool|string $id              Sharing ID to include in the data-shared attribute.
	 * @param array       $data_attributes The keys are used as additional attribute names with 'data-' prefix.
	 *                                     The values are used as the attribute values.
	 * @return object Link related data (url and data_attributes);
	 */
	public function get_link( $post_id, $query = '', $id = false, $data_attributes = array() ) {
		// We don't need to open new window, so we set it to false.
		$id           = false;
		$tracking_url = $this->get_process_request_url( $post_id );
		if ( false === stripos( $tracking_url, '?' ) ) {
			$tracking_url .= '?';
		} else {
			$tracking_url .= '&';
		}
		$tracking_url .= 'share=email';

		$data_attributes = array(
			'email-share-error-title' => __( 'Do you have email set up?', 'jetpack' ),
			'email-share-error-text'  => __(
				"If you're having problems sharing via email, you might not have email set up for your browser. You may need to create a new email yourself.",
				'jetpack'
			),
			'email-share-nonce'       => wp_create_nonce( $this->get_email_share_nonce_action( $post_id ) ),
			'email-share-track-url'   => $tracking_url,
		);

		$post_title = $this->get_share_title( $post_id );
		$post_url   = $this->get_share_url( $post_id );

		/** This filter is documented in plugins/jetpack/modules/sharedaddy/sharedaddy.php */
		$email_subject = apply_filters(
			'wp_sharing_email_send_post_subject',
			sprintf( '[%s] %s', __( 'Shared Post', 'jetpack' ), $post_title )
		);

		$mailto_query = sprintf(
			'subject=%s&body=%s&share=email',
			rawurlencode( $email_subject ),
			rawurlencode( $post_url )
		);

		$url             = $this->get_url( 'mailto:', $mailto_query, $id );
		$data_attributes = $this->get_data_attributes( $id, $data_attributes );

		return array(
			'url'             => $url,
			'data_attributes' => $data_attributes,
		);
	}

	/**
	 * Process sharing request. Add actions that need to happen when sharing here.
	 *
	 * @param WP_Post $post Post object.
	 * @param array   $post_data Array of information about the post we're sharing.
	 *
	 * @return void
	 */
	public function process_request( $post, array $post_data ) {
		$is_ajax = false;
		if (
			isset( $_SERVER['HTTP_X_REQUESTED_WITH'] )
			&& strtolower( sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_REQUESTED_WITH'] ) ) ) === 'xmlhttprequest'
		) {
			$is_ajax = true;
		}

		// Require an AJAX-driven submit and a valid nonce to process the request
		if (
			$is_ajax
			&& isset( $post_data['email-share-nonce'] )
			&& wp_verify_nonce( $post_data['email-share-nonce'], $this->get_email_share_nonce_action( $post ) )
		) {
			// Ensure that we bump stats
			parent::process_request( $post, $post_data );
		}

		if ( $is_ajax ) {
			wp_send_json_success();
		} else {
			wp_safe_redirect( get_permalink( $post->ID ) . '?shared=email&msg=fail' );
			exit( 0 );
		}

		wp_die();
	}
}

/**
 * Facebook sharing button.
 */
class Share_Facebook_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'facebook';

	/**
	 * Sharing type.
	 *
	 * @var string
	 */
	private $share_type = 'default';

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'Facebook', 'jetpack' );
	}

	/**
	 * Process sharing request. Add actions that need to happen when sharing here.
	 *
	 * @param WP_Post $post Post object.
	 * @param array   $post_data Array of information about the post we're sharing.
	 *
	 * @return void
	 */
	public function process_request( $post, array $post_data ) {
		$post_id = $post instanceof WP_Post ? $post->ID : 0;
		$fb_url  = $this->http() . '://www.facebook.com/sharer.php?u=' . rawurlencode( $this->get_share_url( $post_id ) ) . '&t=' . rawurlencode( $this->get_share_title( $post_id ) );

		// Record stats
		parent::process_request( $post, $post_data );

		parent::redirect_request( $fb_url );
	}
}

/**
 * Print button.
 */
class Share_Print_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'print';

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'Print', 'jetpack' );
	}
}

/**
 * Native Share button (relying on the Web Share API).
 */
class Share_Native_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'native';

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'Web Share', 'jetpack' );
	}
}

/**
 * Tumblr sharing service.
 */
class Share_Tumblr_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'tumblr';

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'Tumblr', 'jetpack' );
	}

	/**
	 * Process sharing request. Add actions that need to happen when sharing here.
	 *
	 * @param WP_Post $post Post object.
	 * @param array   $post_data Array of information about the post we're sharing.
	 *
	 * @return void
	 */
	public function process_request( $post, array $post_data ) {
		// Record stats
		parent::process_request( $post, $post_data );

		// Redirect to Tumblr's sharing endpoint (a la their bookmarklet)
		$url = 'https://www.tumblr.com/share?v=3&u=' . rawurlencode( $this->get_share_url( $post->ID ) ) . '&t=' . rawurlencode( $this->get_share_title( $post->ID ) ) . '&s=';

		parent::redirect_request( $url );
	}
}

/**
 * Pinterest sharing service.
 */
class Share_Pinterest_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'pinterest';

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'Pinterest', 'jetpack' );
	}

	/**
	 * Get image representative of the post to pass on to Pinterest.
	 *
	 * @param WP_Post $post Post object.
	 *
	 * @return string
	 */
	public function get_image( $post ) {
		if ( class_exists( 'Jetpack_PostImages' ) ) {
			$image = Jetpack_PostImages::get_image( $post->ID, array( 'fallback_to_avatars' => true ) );
			if ( ! empty( $image ) ) {
				return $image['src'];
			}
		}

		/**
		 * Filters the default image used by the Pinterest Pin It share button.
		 *
		 * @module sharedaddy
		 *
		 * @since 3.6.0
		 *
		 * @param string $url Default image URL.
		 */
		return apply_filters( 'jetpack_sharing_pinterest_default_image', 'https://s0.wp.com/i/blank.jpg' );
	}

	/**
	 * Get Pinterest external sharing URL.
	 *
	 * @param WP_Post $post Post object.
	 *
	 * @return string
	 */
	public function get_external_url( $post ) {
		$url = 'https://www.pinterest.com/pin/create/button/?url=' . rawurlencode( $this->get_share_url( $post->ID ) ) . '&media=' . rawurlencode( $this->get_image( $post ) ) . '&description=' . rawurlencode( $post->post_title );

		/**
		 * Filters the Pinterest share URL used in sharing button output.
		 *
		 * @module sharedaddy
		 *
		 * @since 3.6.0
		 *
		 * @param string $url Pinterest share URL.
		 */
		return apply_filters( 'jetpack_sharing_pinterest_share_url', $url );
	}

	/**
	 * Get Pinterest widget type.
	 *
	 * @return string
	 */
	public function get_widget_type() {
		/**
		 * Filters the Pinterest widget type.
		 *
		 * @see https://business.pinterest.com/en/widget-builder
		 *
		 * @module sharedaddy
		 *
		 * @since 3.6.0
		 *
		 * @param string $type Pinterest widget type. Default of 'buttonPin' for single-image selection. 'buttonBookmark' for multi-image modal.
		 */
		return apply_filters( 'jetpack_sharing_pinterest_widget_type', 'buttonPin' );
	}

	/**
	 * Process sharing request. Add actions that need to happen when sharing here.
	 *
	 * @param WP_Post $post Post object.
	 * @param array   $post_data Array of information about the post we're sharing.
	 *
	 * @return void
	 */
	public function process_request( $post, array $post_data ) {
		// Record stats
		parent::process_request( $post, $post_data );
		// If we're triggering the multi-select panel, then we don't need to redirect to Pinterest
		if ( ! isset( $_GET['js_only'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$pinterest_url = esc_url_raw( $this->get_external_url( $post ) );
			parent::redirect_request( $pinterest_url );
		} else {
			echo '// share count bumped';
			die( 0 );
		}
	}
}

/**
 * Pocket sharing service.
 */
class Share_Pocket_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'pocket';

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'Pocket', 'jetpack' );
	}

	/**
	 * Process sharing request. Add actions that need to happen when sharing here.
	 *
	 * @param WP_Post $post Post object.
	 * @param array   $post_data Array of information about the post we're sharing.
	 *
	 * @return void
	 */
	public function process_request( $post, array $post_data ) {
		// Record stats
		parent::process_request( $post, $post_data );

		$pocket_url = esc_url_raw( 'https://getpocket.com/save/?url=' . rawurlencode( $this->get_share_url( $post->ID ) ) . '&title=' . rawurlencode( $this->get_share_title( $post->ID ) ) );

		parent::redirect_request( $pocket_url );
	}
}

/**
 * Telegram sharing service.
 */
class Share_Telegram_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'telegram';

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'Telegram', 'jetpack' );
	}

	/**
	 * Process sharing request. Add actions that need to happen when sharing here.
	 *
	 * @param WP_Post $post Post object.
	 * @param array   $post_data Array of information about the post we're sharing.
	 *
	 * @return void
	 */
	public function process_request( $post, array $post_data ) {
		// Record stats
		parent::process_request( $post, $post_data );

		$telegram_url = esc_url_raw( 'https://telegram.me/share/url?url=' . rawurlencode( $this->get_share_url( $post->ID ) ) . '&text=' . rawurlencode( $this->get_share_title( $post->ID ) ) );

		parent::redirect_request( $telegram_url );
	}
}

/**
 * WhatsApp sharing service.
 */
class Jetpack_Share_WhatsApp_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'jetpack-whatsapp';

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'WhatsApp', 'jetpack' );
	}

	/**
	 * Process sharing request. Add actions that need to happen when sharing here.
	 *
	 * @param WP_Post $post Post object.
	 * @param array   $post_data Array of information about the post we're sharing.
	 *
	 * @return void
	 */
	public function process_request( $post, array $post_data ) {
		// Record stats
		parent::process_request( $post, $post_data );

		// Firefox for desktop doesn't handle the "api.whatsapp.com" URL properly, so use "web.whatsapp.com"
		if ( User_Agent_Info::is_firefox_desktop() ) {
			$url = 'https://web.whatsapp.com/send?text=';
		} else {
			$url = 'https://api.whatsapp.com/send?text=';
		}

		$url .= rawurlencode( $this->get_share_title( $post->ID ) . ' ' . $this->get_share_url( $post->ID ) );

		parent::redirect_request( $url );
	}
}

/**
 * Mastodon sharing service.
 */
class Share_Mastodon_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'mastodon';

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'Mastodon', 'jetpack' );
	}

	/**
	 * Process sharing request. Add actions that need to happen when sharing here.
	 *
	 * @param WP_Post $post Post object.
	 * @param array   $post_data Array of information about the post we're sharing.
	 *
	 * @return void
	 */
	public function process_request( $post, array $post_data ) {
		if ( empty( $_POST['jetpack-mastodon-instance'] ) ) {
			require_once __DIR__ . '/components/class-jetpack-mastodon-modal.php';
			add_action( 'template_redirect', array( Jetpack_Mastodon_Modal::class, 'modal' ) );
			return;
		}

		check_admin_referer( 'jetpack_share_mastodon_instance' );

		$mastodon_instance = isset( $_POST['jetpack-mastodon-instance'] )
			? trailingslashit( sanitize_text_field( wp_unslash( $_POST['jetpack-mastodon-instance'] ) ) )
			: null;

		$post_title = $this->get_share_title( $post->ID );
		$post_link  = $this->get_share_url( $post->ID );
		$post_tags  = $this->get_share_tags( $post->ID );

		/**
		 * Allow filtering the default message that gets posted to Mastodon.
		 *
		 * @module sharedaddy
		 * @since 11.9
		 *
		 * @param string  $share_url The default message that gets posted to Mastodon.
		 * @param WP_Post $post      The post object.
		 * @param array   $post_data Array of information about the post we're sharing.
		 */
		$shared_message = apply_filters(
			'jetpack_sharing_mastodon_default_message',
			$post_title . ' ' . $post_link . ' ' . $post_tags,
			$post,
			$post_data
		);

		$share_url = sprintf(
			'%1$sshare?text=%2$s',
			$mastodon_instance,
			rawurlencode( $shared_message )
		);

			// Record stats
		parent::process_request( $post, $post_data );

		parent::redirect_request( $share_url );
	}
}

/**
 * Nextdoor sharing service.
 */
class Share_Nextdoor_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'nextdoor';

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'Nextdoor', 'jetpack' );
	}

	/**
	 * Process sharing request. Add actions that need to happen when sharing here.
	 *
	 * @param WP_Post $post Post object.
	 * @param array   $post_data Array of information about the post we're sharing.
	 *
	 * @return void
	 */
	public function process_request( $post, array $post_data ) {
		// Record stats
		parent::process_request( $post, $post_data );

		$url  = 'https://nextdoor.com/sharekit/?source=jetpack&body=';
		$url .= rawurlencode( $this->get_share_title( $post->ID ) . ' ' . $this->get_share_url( $post->ID ) );

		parent::redirect_request( $url );
	}
}

/**
 * Bluesky sharing button.
 */
class Share_Bluesky_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'bluesky';

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'Bluesky', 'jetpack' );
	}

	/**
	 * Process sharing request. Add actions that need to happen when sharing here.
	 *
	 * @param WP_Post $post Post object.
	 * @param array   $post_data Array of information about the post we're sharing.
	 *
	 * @return void
	 */
	public function process_request( $post, array $post_data ) {
		// Record stats
		parent::process_request( $post, $post_data );

		$url  = 'https://bsky.app/intent/compose?text=';
		$url .= rawurlencode( $this->get_share_title( $post->ID ) . ' ' . $this->get_share_url( $post->ID ) );

		parent::redirect_request( $url );
	}
}

/**
 * X sharing button.
 *
 * While the old Twitter button had an official button,
 * this new X button does not, since there is no official X button yet.
 */
class Share_X_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'x';

	/**
	 * Length of a URL on X.
	 * https://developer.twitter.com/en/docs/tco
	 *
	 * @var int
	 */
	public $short_url_length = 24;

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'X', 'jetpack' );
	}

	/**
	 * Determine the X 'via' value for a post.
	 *
	 * @param  WP_Post|int $post Post object or post ID.
	 * @return string X handle without the preceding @.
	 **/
	public static function sharing_x_via( $post ) {
		$post = get_post( $post );
		/** This filter is documented in modules/sharedaddy/sharing-sources.php */
		$twitter_site_tag_value = apply_filters(
			'jetpack_twitter_cards_site_tag',
			'',
			/** This action is documented in modules/sharedaddy/sharing-sources.php */
			array( 'twitter:creator' => apply_filters( 'jetpack_sharing_twitter_via', '', $post->ID ) )
		);

		/*
		 * Hack to remove the unwanted behavior of adding 'via @jetpack' which
		 * was introduced with the adding of the Twitter cards.
		 * This should be a temporary solution until a better method is setup.
		 */
		if ( 'jetpack' === $twitter_site_tag_value ) {
			$twitter_site_tag_value = '';
		}

		/** This filter is documented in modules/sharedaddy/sharing-sources.php */
		$twitter_site_tag_value = apply_filters( 'jetpack_sharing_twitter_via', $twitter_site_tag_value, $post->ID );

		// Strip out anything other than a letter, number, or underscore.
		// This will prevent the inadvertent inclusion of an extra @, as well as normalizing the handle.
		return preg_replace( '/[^\da-z_]+/i', '', $twitter_site_tag_value );
	}

	/**
	 * Determine the 'related' X accounts for a post.
	 *
	 * @param  WP_Post|int $post Post object or post ID.
	 * @return string Comma-separated list of X handles.
	 **/
	public static function get_related_accounts( $post ) {
		$post = get_post( $post );
		/** This filter is documented in modules/sharedaddy/sharing-sources.php */
		$related_accounts = apply_filters( 'jetpack_sharing_twitter_related', array(), $post->ID );

		// Example related string: account1,account2:Account 2 description,account3
		$related = array();

		foreach ( $related_accounts as $related_account_username => $related_account_description ) {
			// Join the description onto the end of the username
			if ( $related_account_description ) {
				$related_account_username .= ':' . $related_account_description;
			}

			$related[] = $related_account_username;
		}

		return implode( ',', $related );
	}

	/**
	 * Process sharing request. Add actions that need to happen when sharing here.
	 *
	 * @param WP_Post $post Post object.
	 * @param array   $post_data Array of information about the post we're sharing.
	 *
	 * @return void
	 */
	public function process_request( $post, array $post_data ) {
		$post_title = $this->get_share_title( $post->ID );
		$post_link  = $this->get_share_url( $post->ID );

		if ( function_exists( 'mb_stripos' ) ) {
			$strlen = 'mb_strlen';
			$substr = 'mb_substr';
		} else {
			$strlen = 'strlen';
			$substr = 'substr';
		}

		$via     = static::sharing_x_via( $post );
		$related = static::get_related_accounts( $post );
		if ( $via ) {
			$sig = " via @$via";
			if ( $related === $via ) {
				$related = false;
			}
		} else {
			$via = false;
			$sig = '';
		}

		$suffix_length = $this->short_url_length + $strlen( $sig );
		// $sig is handled by twitter in their 'via' argument.
		// $post_link is handled by twitter in their 'url' argument.
		if ( 280 < $strlen( $post_title ) + $suffix_length ) {
			// The -1 is for "\xE2\x80\xA6", a UTF-8 ellipsis.
			$text = $substr( $post_title, 0, 280 - $suffix_length - 1 ) . "\xE2\x80\xA6";
		} else {
			$text = $post_title;
		}

		// Record stats
		parent::process_request( $post, $post_data );

		$url         = $post_link;
		$twitter_url = add_query_arg(
			rawurlencode_deep( array_filter( compact( 'via', 'related', 'text', 'url' ) ) ),
			'https://x.com/intent/tweet'
		);

		parent::redirect_request( $twitter_url );
	}
}

/**
 * Twitter sharing button.
 */
class Share_Twitter_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'twitter';

	/**
	 * Length of a URL on Twitter.
	 * 'https://dev.twitter.com/rest/reference/get/help/configuration'
	 * ( 2015/02/06 ) short_url_length is 22, short_url_length_https is 23
	 *
	 * @var int
	 */
	public $short_url_length = 24;

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'X', 'jetpack' );
	}

	/**
	 * Determine the Twitter 'via' value for a post.
	 *
	 * @param  WP_Post|int $post Post object or post ID.
	 * @return string Twitter handle without the preceding @.
	 **/
	public static function sharing_twitter_via( $post ) {
		$post = get_post( $post );
		/**
		 * Allow third-party plugins to customize the Twitter username used as "twitter:site" Twitter Card Meta Tag.
		 *
		 * @module sharedaddy
		 *
		 * @since 3.0.0
		 *
		 * @param string $string Twitter Username.
		 * @param array $args Array of Open Graph Meta Tags and Twitter Cards tags.
		 */
		$twitter_site_tag_value = apply_filters(
			'jetpack_twitter_cards_site_tag',
			'',
			/** This action is documented in modules/sharedaddy/sharing-sources.php */
			array( 'twitter:creator' => apply_filters( 'jetpack_sharing_twitter_via', '', $post->ID ) )
		);

		/*
		 * Hack to remove the unwanted behavior of adding 'via @jetpack' which
		 * was introduced with the adding of the Twitter cards.
		 * This should be a temporary solution until a better method is setup.
		 */
		if ( 'jetpack' === $twitter_site_tag_value ) {
			$twitter_site_tag_value = '';
		}

		/**
		 * Filters the Twitter username used as "via" in the Twitter sharing button.
		 *
		 * @module sharedaddy
		 *
		 * @since 1.7.0
		 *
		 * @param string $twitter_site_tag_value Twitter Username.
		 * @param int $post->ID Post ID.
		 */
		$twitter_site_tag_value = apply_filters( 'jetpack_sharing_twitter_via', $twitter_site_tag_value, $post->ID );

		// Strip out anything other than a letter, number, or underscore.
		// This will prevent the inadvertent inclusion of an extra @, as well as normalizing the handle.
		return preg_replace( '/[^\da-z_]+/i', '', $twitter_site_tag_value );
	}

	/**
	 * Determine the 'related' Twitter accounts for a post.
	 *
	 * @param  WP_Post|int $post Post object or post ID.
	 * @return string Comma-separated list of Twitter handles.
	 **/
	public static function get_related_accounts( $post ) {
		$post = get_post( $post );
		/**
		 * Filter the list of related Twitter accounts added to the Twitter sharing button.
		 *
		 * @module sharedaddy
		 *
		 * @since 1.7.0
		 *
		 * @param array $args Array of Twitter usernames. Format is 'username' => 'Optional description'
		 * @param int $post->ID Post ID.
		 */
		$related_accounts = apply_filters( 'jetpack_sharing_twitter_related', array(), $post->ID );

		// Example related string: account1,account2:Account 2 description,account3
		$related = array();

		foreach ( $related_accounts as $related_account_username => $related_account_description ) {
			// Join the description onto the end of the username
			if ( $related_account_description ) {
				$related_account_username .= ':' . $related_account_description;
			}

			$related[] = $related_account_username;
		}

		return implode( ',', $related );
	}

	/**
	 * Process sharing request. Add actions that need to happen when sharing here.
	 *
	 * @param WP_Post $post Post object.
	 * @param array   $post_data Array of information about the post we're sharing.
	 *
	 * @return void
	 */
	public function process_request( $post, array $post_data ) {
		$post_title = $this->get_share_title( $post->ID );
		$post_link  = $this->get_share_url( $post->ID );

		if ( function_exists( 'mb_stripos' ) ) {
			$strlen = 'mb_strlen';
			$substr = 'mb_substr';
		} else {
			$strlen = 'strlen';
			$substr = 'substr';
		}

		$via     = static::sharing_twitter_via( $post );
		$related = static::get_related_accounts( $post );
		if ( $via ) {
			$sig = " via @$via";
			if ( $related === $via ) {
				$related = false;
			}
		} else {
			$via = false;
			$sig = '';
		}

		$suffix_length = $this->short_url_length + $strlen( $sig );
		// $sig is handled by twitter in their 'via' argument.
		// $post_link is handled by twitter in their 'url' argument.
		if ( 280 < $strlen( $post_title ) + $suffix_length ) {
			// The -1 is for "\xE2\x80\xA6", a UTF-8 ellipsis.
			$text = $substr( $post_title, 0, 280 - $suffix_length - 1 ) . "\xE2\x80\xA6";
		} else {
			$text = $post_title;
		}

		// Record stats
		parent::process_request( $post, $post_data );

		$url         = $post_link;
		$twitter_url = add_query_arg(
			rawurlencode_deep( array_filter( compact( 'via', 'related', 'text', 'url' ) ) ),
			'https://x.com/intent/tweet'
		);

		parent::redirect_request( $twitter_url );
	}
}

/**
 * Reddit sharing button.
 */
class Share_Reddit_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'reddit';

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'Reddit', 'jetpack' );
	}

	/**
	 * Process sharing request. Add actions that need to happen when sharing here.
	 *
	 * @param WP_Post $post Post object.
	 * @param array   $post_data Array of information about the post we're sharing.
	 *
	 * @return void
	 */
	public function process_request( $post, array $post_data ) {
		$reddit_url = $this->http() . '://reddit.com/submit?url=' . rawurlencode( $this->get_share_url( $post->ID ) ) . '&title=' . rawurlencode( $this->get_share_title( $post->ID ) );

		// Record stats
		parent::process_request( $post, $post_data );

		parent::redirect_request( $reddit_url );
	}
}

/**
 * LinkedIn sharing button.
 */
class Share_LinkedIn_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'linkedin';

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'LinkedIn', 'jetpack' );
	}

	/**
	 * Process sharing request. Add actions that need to happen when sharing here.
	 *
	 * @param WP_Post $post Post object.
	 * @param array   $post_data Array of information about the post we're sharing.
	 *
	 * @return void
	 */
	public function process_request( $post, array $post_data ) {

		$post_link = $this->get_share_url( $post->ID );

		// Using the same URL as the official button, which is *not* LinkedIn's documented sharing link
		// https://www.linkedin.com/cws/share?url={url}&token=&isFramed=false
		$linkedin_url = add_query_arg(
			array(
				'url' => rawurlencode( $post_link ),
			),
			'https://www.linkedin.com/cws/share?token=&isFramed=false'
		);

		// Record stats
		parent::process_request( $post, $post_data );

		parent::redirect_request( $linkedin_url );
	}
}

/**
 * Threads sharing button.
 */
class Share_Threads_Block extends Sharing_Source_Block {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'threads';

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'Threads', 'jetpack' );
	}

	/**
	 * Process sharing request. Add actions that need to happen when sharing here.
	 *
	 * @param WP_Post $post Post object.
	 * @param array   $post_data Array of information about the post we're sharing.
	 *
	 * @return void
	 */
	public function process_request( $post, array $post_data ) {
		// Record stats
		parent::process_request( $post, $post_data );

		$url  = 'https://www.threads.net/intent/post/?text=';
		$url .= rawurlencode( $this->get_share_title( $post->ID ) . ' ' . $this->get_share_url( $post->ID ) );

		parent::redirect_request( $url );
	}
}
