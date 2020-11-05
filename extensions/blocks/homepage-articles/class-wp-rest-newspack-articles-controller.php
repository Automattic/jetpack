<?php
/**
 * WP_REST_Newspack_Articles_Controller file.
 *
 * @package WordPress
 */

/**
 * Class WP_REST_Newspack_Articles_Controller.
 */
class WP_REST_Newspack_Articles_Controller extends WP_REST_Controller {

	/**
	 * Attribute schema.
	 *
	 * @var array
	 */
	public $attribute_schema;

	/**
	 * Constructs the controller.
	 *
	 * @access public
	 */
	public function __construct() {
		$this->namespace = 'newspack-blocks/v1';
		$this->rest_base = 'articles';
	}

	/**
	 * Registers the necessary REST API routes.
	 *
	 * @access public
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'args'                => $this->get_attribute_schema(),
					'permission_callback' => '__return_true',
				),
			)
		);
	}

	/**
	 * Returns a list of rendered posts.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		$page = $request->get_param( 'page' );
		if ( ! isset( $page ) ) {
			$page = 1;
		}
		$next_page   = $page + 1;
		$exclude_ids = $request->get_param( 'exclude_ids' );
		if ( ! isset( $exclude_ids ) ) {
			$exclude_ids = array();
		}
		$params = $request->get_params();
		if ( ! isset( $params ) ) {
			$params = array();
		}
		$attributes = wp_parse_args(
			$params,
			wp_list_pluck( $this->get_attribute_schema(), 'default' )
		);

		$article_query_args = Newspack_Blocks::build_articles_query( $attributes );

		$query = array_merge(
			$article_query_args,
			array(
				'post__not_in' => $exclude_ids,
			)
		);

		// Run Query.
		$article_query = new WP_Query( $query );

		// Defaults.
		$items    = array();
		$ids      = array();
		$next_url = '';

		// The Loop.
		while ( $article_query->have_posts() ) {
			$article_query->the_post();
			$html = Newspack_Blocks::template_inc(
				__DIR__ . '/templates/article.php',
				array(
					'attributes' => $attributes,
				)
			);

			if ( $request->get_param( 'amp' ) ) {
				$html = $this->generate_amp_partial( $html );
			}
			$items[]['html'] = $html;
			$ids[]           = get_the_ID();
		}

		// Provide next URL if there are more pages.
		if ( $next_page <= $article_query->max_num_pages ) {
			$next_url = add_query_arg(
				array_merge(
					array_map(
						function ( $attribute ) {
							return false === $attribute ? '0' : str_replace( '#', '%23', $attribute );
						},
						$attributes
					),
					array(
						'exclude_ids' => false,
						'page'        => $next_page,
						'amp'         => $request->get_param( 'amp' ),
					)
				),
				rest_url( '/newspack-blocks/v1/articles' )
			);
		}

		return rest_ensure_response(
			array(
				'items' => $items,
				'ids'   => $ids,
				'next'  => $next_url,
			)
		);
	}

	/**
	 * Sets up and returns attribute schema.
	 *
	 * @return array
	 */
	public function get_attribute_schema() {
		if ( empty( $this->attribute_schema ) ) {
			$block_json = json_decode(
				file_get_contents( __DIR__ . '/block.json' ), // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
				true
			);

			$this->attribute_schema = array_merge(
				$block_json['attributes'],
				array(
					'exclude_ids' => array(
						'type'    => 'array',
						'default' => array(),
						'items'   => array(
							'type' => 'integer',
						),
					),
				)
			);
		}
		return $this->attribute_schema;
	}

	/**
	 * Use AMP Plugin functions to render markup as valid AMP.
	 *
	 * @param string $html Markup to convert to AMP.
	 * @return string
	 */
	public function generate_amp_partial( $html ) {
		$dom = AMP_DOM_Utils::get_dom_from_content( $html );

		AMP_Content_Sanitizer::sanitize_document(
			$dom,
			amp_get_content_sanitizers(),
			array(
				'use_document_element' => false,
			)
		);
		$xpath = new DOMXPath( $dom );
		foreach ( iterator_to_array( $xpath->query( '//noscript | //comment()' ) ) as $node ) {
			$node->parentNode->removeChild( $node ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		}
		return AMP_DOM_Utils::get_content_from_dom( $dom );
	}
}
