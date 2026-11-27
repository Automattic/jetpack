<?php
/**
 * JSON-LD graphs for the site publisher, page, author and breadcrumbs.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Emits Schema.org JSON-LD `@graph` documents into the page.
 */
class Schema_Builder {

	/**
	 * Wire the front-end emitter.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'wp_head', array( __CLASS__, 'emit' ), 5 );
		add_action( 'wp_footer', array( __CLASS__, 'emit_woocommerce_breadcrumb_fallback' ), 11 );
	}

	/**
	 * Build and echo the JSON-LD `@graph` block for the current request.
	 *
	 * @return void
	 */
	public static function emit() {
		if ( ! Seo_Tools::is_enabled() ) {
			return;
		}

		// build_document() gates each node itself and returns null for an empty
		// graph, so unsupported or invalid requests emit nothing.
		$document = self::build_document();
		if ( null === $document ) {
			return;
		}

		self::output_document( $document );
	}

	/**
	 * Assemble the nodes for this request, or return null for an empty graph.
	 *
	 * @return array|null
	 */
	private static function build_document() {
		$graph = new Schema_Graph();

		// Only Organization publishers can supply the author's worksFor relationship.
		if ( 'person' === Schema_Settings::get_site_represents() ) {
			$organization = null;
			$site_entity  = Person_Schema_Node::build( Schema_Settings::get_person() );
			$publisher_id = Schema_Node_Ids::site_person();
		} else {
			$organization = Organization_Schema_Node::build( Schema_Settings::get_organization() );
			$organization = Local_Business_Schema_Node::extend( $organization, Schema_Settings::get_local_business() );
			$site_entity  = $organization;
			$publisher_id = Schema_Node_Ids::organization();
		}
		$has_site_entity = null !== $site_entity;

		if ( is_front_page() ) {
			if ( $has_site_entity ) {
				$graph->add( $site_entity );
			}

			$website = Website_Schema_Node::build();
			if ( null !== $website && $has_site_entity ) {
				$website['publisher'] = array( '@id' => $publisher_id );
			}
			$graph->add( $website );
		}

		if ( is_author() ) {
			$person = self::build_person_node( get_queried_object(), null !== $organization );
			if ( null !== $person ) {
				$graph->add( $person );
				$graph->add( Author_Schema_Node::build_profile_page( get_queried_object() ) );
			}
		}

		if ( is_singular() ) {
			$post      = get_queried_object();
			$post_node = Post_Schema_Node::build( $post );
			if ( null !== $post_node ) {
				// Only the Article node carries publisher/author; FAQPage does not.
				if ( 'Article' === ( $post_node['@type'] ?? '' ) ) {
					if ( $has_site_entity ) {
						$post_node['publisher'] = array( '@id' => $publisher_id );
						if ( null === $organization && ! is_front_page() ) {
							// Define the Person here so the publisher resolves within this page.
							$graph->add( $site_entity );
						}
					}
					$person  = self::build_person_node( (int) $post->post_author, null !== $organization );
					$authors = null !== $person ? array( $person ) : array();

					/**
					 * Filters the Person nodes credited as the Article's authors, e.g. to add
					 * co-authors or guest authors that aren't the post's WordPress user.
					 *
					 * Nodes are output as given: pass plain-text names and absolute URLs. For
					 * WordPress users, reuse {@see self::build_person_node()} for publisher links.
					 *
					 * @since $$next-version$$
					 *
					 * @param array[]|array $authors Person nodes, each with an `@id`, or a single node. Defaults to the post author.
					 * @param \WP_Post      $post    The post the Article describes.
					 */
					$authors = apply_filters( 'jetpack_seo_schema_article_authors', $authors, $post );
					if ( is_array( $authors ) && isset( $authors['@id'] ) ) {
						$authors = array( $authors ); // A single node instead of a list.
					}

					// Keyed by @id so an author returned twice is only output once.
					$authors_by_id = array();
					foreach ( (array) $authors as $author ) {
						if ( is_array( $author ) && is_string( $author['@id'] ?? null ) && '' !== $author['@id'] ) {
							$authors_by_id[ $author['@id'] ] = $author;
						}
					}

					// The site entity is already in the graph on the front page, and always for a person site.
					$site_entity_in_graph = $has_site_entity && ( is_front_page() || null === $organization );
					$author_refs          = array();
					foreach ( $authors_by_id as $author ) {
						$author_id     = $author['@id'];
						$author_refs[] = array( '@id' => $author_id );
						if ( ! ( $site_entity_in_graph && $publisher_id === $author_id ) ) {
							$graph->add( $author );
						}
					}
					if ( $author_refs ) {
						$post_node['author'] = 1 === count( $author_refs ) ? $author_refs[0] : $author_refs;
					}
				}
				$graph->add( $post_node );
			}
		}

		$breadcrumb_settings = Schema_Settings::get_breadcrumb_list();
		if ( $breadcrumb_settings['enabled'] && ! self::woocommerce_may_output_breadcrumb_schema() ) {
			$graph->add( Breadcrumb_Schema_Node::build() );
		}

		return $graph->to_document();
	}

	/**
	 * Emit Jetpack's BreadcrumbList after WooCommerce when WooCommerce was expected
	 * to provide one but did not actually generate any breadcrumb data.
	 *
	 * WooCommerce registers its generator and footer emitter independently of
	 * whether the active template renders `woocommerce_breadcrumb()`. Waiting until
	 * after WooCommerce's priority-10 footer emitter lets us inspect the generated
	 * data instead of treating callback registration as proof of output.
	 *
	 * @return void
	 */
	public static function emit_woocommerce_breadcrumb_fallback() {
		if ( ! Seo_Tools::is_enabled() ) {
			return;
		}

		$breadcrumb_settings = Schema_Settings::get_breadcrumb_list();
		if ( ! $breadcrumb_settings['enabled'] || ! self::woocommerce_may_output_breadcrumb_schema() || self::woocommerce_has_breadcrumb_schema() ) {
			return;
		}

		$graph = new Schema_Graph();
		$graph->add( Breadcrumb_Schema_Node::build() );
		$document = $graph->to_document();
		if ( null === $document ) {
			return;
		}

		self::output_document( $document );
	}

	/**
	 * Whether WooCommerce may emit its own BreadcrumbList for this request.
	 *
	 * This deliberately detects capability, not actual output. WooCommerce only
	 * generates breadcrumb data when its template function runs, so the late
	 * footer fallback verifies the generated data before relying on it.
	 *
	 * @return bool
	 */
	private static function woocommerce_may_output_breadcrumb_schema() {
		// @phan-suppress-next-line PhanUndeclaredFunction -- WooCommerce functions are guarded by function_exists().
		if ( ! function_exists( 'is_woocommerce' ) || ! is_woocommerce() || ! function_exists( 'WC' ) ) {
			return false;
		}

		// @phan-suppress-next-line PhanUndeclaredFunction -- Guarded by function_exists() above.
		$woocommerce = WC();
		if ( ! is_object( $woocommerce ) || ! isset( $woocommerce->structured_data ) ) {
			return false;
		}

		$structured_data = $woocommerce->structured_data;
		return false !== has_action( 'woocommerce_breadcrumb', array( $structured_data, 'generate_breadcrumblist_data' ) )
			&& false !== has_action( 'wp_footer', array( $structured_data, 'output_structured_data' ) );
	}

	/**
	 * Whether WooCommerce actually generated a BreadcrumbList for this request.
	 *
	 * @return bool
	 */
	private static function woocommerce_has_breadcrumb_schema() {
		if ( ! function_exists( 'WC' ) ) {
			return false;
		}

		// @phan-suppress-next-line PhanUndeclaredFunction -- Guarded by function_exists() above.
		$woocommerce = WC();
		if ( ! is_object( $woocommerce ) || ! isset( $woocommerce->structured_data ) || ! method_exists( $woocommerce->structured_data, 'get_data' ) ) {
			return false;
		}

		$data = $woocommerce->structured_data->get_data();
		return is_array( $data ) && in_array( 'BreadcrumbList', array_column( $data, '@type' ), true );
	}

	/**
	 * Serialize and output a JSON-LD document.
	 *
	 * @param array $document Schema.org document.
	 * @return void
	 */
	private static function output_document( array $document ) {
		printf(
			'<script type="application/ld+json">%s</script>',
			// JSON_HEX_TAG escapes < and >, so text decoded to "</script>" or "<!--" can't end or corrupt this block.
			wp_json_encode( $document, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		);
	}

	/**
	 * Build the author Person node, wiring `worksFor` to the site Organization's
	 * stable `@id` when the Organization node resolves.
	 *
	 * @since $$next-version$$
	 *
	 * @param \WP_User|int|null $user             User object or ID.
	 * @param bool              $has_organization Whether an Organization publisher resolves; false for Person publishers.
	 * @return array|null
	 */
	public static function build_person_node( $user, $has_organization ) {
		$person = Author_Schema_Node::build_person( $user );
		if ( null !== $person && $has_organization ) {
			$person['worksFor'] = array( '@id' => Schema_Node_Ids::organization() );
		}
		return $person;
	}
}
