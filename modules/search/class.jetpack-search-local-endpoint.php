<?php

class Jetpack_Search_Local_Endpoint {
	public function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/search-local',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_request_args(),
				),
				'schema' => array( $this, 'get_schema' ),
			)
		);
	}

	public function get_request_args() {
		return array(
			'context' => 'view',
			'size' => array(
				'type' => 'integer',
				'minimum' => 1,
				'maximum' => 20,
				'default' => 10,
			),
			'from' => array(
				'type' => 'integer',
				'minimum' => 0,
				'maximum' => 200,
				'default' => 0,
			),
			'fields' => array(
				'type' => 'array',
				'items' => array(
					'type' => 'string',
				),
				'default' => array( 'blog_id', 'post_id' ),
			),
			'highlight_fields' => array(
				'items' => array(
					'type' => 'string',
				),
			),
			'query' => array(
				'type' => 'string',
				'required' => true,
			),
			'sort' => array(
				'type' => 'string',
				'default' => 'score_default',
				'enum' => array(
					'score_default',
					'date_desc',
					'date_asc',
				),
			),
			'page_handle' => array(
				'type' => 'string',
			),
		);
	}

	public function get_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'search-local-result',
			'type'       => 'object',
			'properties' => array(
				'aggregations' => array(
					'type'    => 'array',
					'context' => array( 'view', 'edit' ),
				),
				'corrected_query' => array(
					'type' => array( 'string', 'boolean' ),
					'context' => array( 'view', 'edit' ),
				),
				'page_handle' => array(
					'type' => array( 'string', 'boolean' ),
					'context' => array( 'view', 'edit' ),
				),
				'results' => array(
					'type' => 'array',
					'items' => array(
						'type' => 'object',
						'properties' => array(
							'fields' => array(
								'type' => 'object',
								'properties' => array(
									'blog_id' => array(
										'type' => 'integer',
									),
									'post_id' => array(
										'type' => 'integer',
									),
									'date' => array(
										'type' => 'string',
										'format' => 'date-time',
									),
									'post_type' => array(
										'type' => 'string',
									),
									'permalink.url.raw' => array(
										'type' => 'string',
									),
									'has.image' => array(
										'type' => 'integer',
									),
									'category.name.default' => array(
										'type' => 'string',
									),
								),
							),
							'highlight' => array(
								'type' => 'object',
								'properties' => array(
									'content' => array(
										'type' => array(
											'items' => array(
												'type' => 'string',
											),
										),
									),
									'title' => array(
										'type' => array(
											'items' => array(
												'type' => 'string',
											),
										),
									),
								),
							),
							'railcar' => array(
								'type' => 'object',
							),
							'result_type' => array(
								'type' => 'string',
							),
						),
					),
				),
				'suggestions' => array(
					'type' => 'array',
				),
				'total' => array(
					'type' => 'integer',
				),
			),
		);
	}

	public function get_items_permissions_check() {
		return Jetpack::is_development_mode()
			? true
			: new WP_Error(
				'development_mode_only',
				__( "This endpoint is meant only for local testing and is only available in Jetpack's Development Mode." ),
				array(
					'status' => 400,
				)
			);
	}

	// @todo - page_handle
	// @todo - search comments
	public function get_items( $request ) {
		if ( 'score_default' === $request['sort'] ) {
			$orderby = 'relevance';
			$order   = 'DESC';
		} else {
			$orderby = 'date';
			$order   = 'date_desc' === $request['sort'] ? 'DESC' : 'ASC';
		}

		$post_query = new WP_Query( array(
			'posts_per_page' => $request['size'],
			'offset'         => $request['from'],
			'orderby'        => $orderby,
			'order'          => $order,
			's'              => $request['query'],

			'fields' => 'ids',
		) );

		$terms = preg_split( '/\\s+/', wp_kses( $request['query'], 'strip' ) );

		$term_regex = '/(' . join( '|', array_map( function( $term ) {
			return preg_quote( $term, '/' );
		}, $terms ) ) . ')/i';

		$fields = $request['fields'];

		$results = array();
		foreach ( $post_query->posts as $post_id ) {
			$result = $this->get_post_result( $post_id, $fields );
			foreach ( $result['highlight'] as &$highlight ) {
				foreach ( $highlight as &$text ) {
					$text = preg_replace( $term_regex, '<mark>\\1</mark>', $text );
				}
			}

			$results[] = $result;
		}

		return array(
			'results'   => $results,
			'total'     => (int) $post_query->found_posts,

			// Unsupported
			'aggregations'    => array(),
			'corrected_query' => false,
			'page_handle'     => false,
			'suggestions'     => array(),
		);
	}

	// @todo has.image
	// @todo _score
	private function get_post_result( $post_id, $fields ) {
		$post = get_post( $post_id );
		$blog_id = get_current_blog_id();

		$return = array(
			'fields'      => array(),
			'highlight'   => array(
				'title' => array(
					// strip_tags() to remove HTML comments.
					strip_tags( wp_kses( $post->post_title, 'strip' ) ),
				),
				'content' => array(
					strip_tags( wp_kses( $post->post_content, 'strip' ) ),
				),
			),
			'railcar'     => array(),
			'result_type' => 'post',
			'_score'      => 1,
		);

		foreach ( $fields as $field ) {
			switch ( $field ) {
				case 'blog_id' :
					$return['fields'][ $field ] = (int) $blog_id;
					break;
				case 'post_id' :
					$return['fields'][ $field ] = (int) $post_id;
					break;
				case 'date' :
					$return['fields'][ $field ] = (string) $post->post_date;
					break;
				case 'post_type' :
					$return['fields'][ $field ] = (string) $post->post_type;
					break;
				case 'permalink.url.raw' :
					$return['fields'][ $field ] = (string) get_permalink( $post );
					break;
				case 'has.image' :
					$return['fields'][ $field ] = (int) 0;
					break;
				case 'category.name.default' :
					$return['fields'][ $field ] = (string) get_the_category( $post )[0]->name;
					break;
			}
		}

		return $return;
	}
}
