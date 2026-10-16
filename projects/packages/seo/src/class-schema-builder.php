<?php
/**
 * JSON-LD Schema.org markup emitter.
 *
 * Serializes Schema.org `@graph` documents into the page. The primary graph is
 * emitted in the document `<head>` and is assembled from independent,
 * condition-gated contributions: the site-level entity node — an Organization
 * (optionally extended as LocalBusiness) or a Person, whichever the admin has
 * declared the site represents — and the WebSite node, emitted on the home page
 * only (Google treats them as single canonical site entities), the page node
 * (Article or FAQPage) built by {@see Post_Schema_Node} on singular requests,
 * per-author Person/ProfilePage nodes on author archives, and a BreadcrumbList on
 * supported public requests. An Article references its author's full Person node
 * (added to the same graph) by `@id`, and — like the WebSite node — references the
 * home-page site entity as its `publisher` by stable `@id` rather than duplicating
 * the node. Emission is gated on `Jetpack_SEO_Utils::is_enabled_jetpack_seo()`.
 *
 * This class owns only the gating and serialization; the individual nodes and
 * their stable `@id`s live in their own builders ({@see Post_Schema_Node},
 * {@see Organization_Schema_Node}, {@see Local_Business_Schema_Node},
 * {@see Person_Schema_Node}, {@see Website_Schema_Node}, {@see Author_Schema_Node},
 * {@see Breadcrumb_Schema_Node}, {@see Schema_Node_Ids}) and are assembled by
 * {@see Schema_Graph}.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Jetpack_SEO_Utils;

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
		// Both plugin classes must be loaded — they're not guaranteed in every
		// context, and the post node builder calls Jetpack_SEO_Posts directly.
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Jetpack_SEO_Utils lives in plugins/jetpack; guarded by the class_exists check on the same line.
		if ( ! class_exists( 'Jetpack_SEO_Utils' ) || ! class_exists( 'Jetpack_SEO_Posts' ) || ! Jetpack_SEO_Utils::is_enabled_jetpack_seo() ) {
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
	 * Assemble the `@graph` document for the current request.
	 *
	 * The site-level nodes, author archive nodes, singular page node, and breadcrumb
	 * are independent, condition-gated contributions to one graph:
	 *
	 * - Organization and WebSite are single canonical site entities, so their full
	 *   nodes are added on the home page only (Google's guidance). Other pages
	 *   reference the Organization by `@id` instead of duplicating it.
	 * - Author archives contribute the author's Person node and the ProfilePage
	 *   wrapping it (`mainEntity` → Person `@id`).
	 * - The page node (Article/FAQPage) is added on singular requests. An Article
	 *   points its `publisher` at the home-page Organization's stable `@id` and its
	 *   `author` at the full Person node added to the same graph.
	 * - BreadcrumbList is added on supported requests when enabled. WooCommerce
	 *   requests defer to Woo's generated node, with a late Jetpack fallback when
	 *   the active template did not generate one.
	 *
	 * Returns null when the graph ends up empty (an unsupported or invalid request)
	 * so the caller emits nothing rather than an empty graph.
	 * Cross-node references are wired here rather than inside the individual node
	 * builders, which stay self-contained and unaware of each other.
	 *
	 * @return array|null
	 */
	private static function build_document() {
		$graph = new Schema_Graph();

		// The site's main/publisher entity is either an Organization or a Person,
		// per the admin's choice (default: organization, preserving prior behavior).
		// Build it regardless of the current request so we know whether `@id`
		// references to it (publisher, worksFor) will resolve, but only add the full
		// node on the home page. `$organization` stays non-null only in the
		// organization case, so it also gates the author `worksFor` link below.
		if ( 'person' === Schema_Settings::get_site_represents() ) {
			$organization = null;
			$site_entity  = Person_Schema_Node::build( Schema_Settings::get_person() );
			$publisher_id = Schema_Node_Ids::site_person();
		} else {
			// Effective Organization settings (stored overrides merged over site
			// identity); an unconfigured site still yields a valid node from site
			// identity alone, optionally extended with LocalBusiness details.
			$organization = Organization_Schema_Node::build( Schema_Settings::get_organization() );
			$organization = Local_Business_Schema_Node::extend( $organization, Schema_Settings::get_local_business() );
			$site_entity  = $organization;
			$publisher_id = Schema_Node_Ids::organization();
		}
		$has_site_entity = null !== $site_entity;

		// Site-level nodes (the site entity + WebSite) describe a single canonical
		// entity, so they belong on the home page only (Google's guidance) — never
		// duplicated onto every post. WebSite references the site entity by @id.
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
			// `worksFor` links the author to the site Organization only when the site
			// represents one; a person-site has no Organization node to reference.
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
				// Both are @id references: publisher points at the home-page site
				// entity (the Organization or Person, never duplicated), author points
				// at the full Person node added to this page's graph.
				if ( 'Article' === ( $post_node['@type'] ?? '' ) ) {
					if ( $has_site_entity ) {
						$post_node['publisher'] = array( '@id' => $publisher_id );
					}
					$person = self::build_person_node( (int) $post->post_author, null !== $organization );
					if ( null !== $person ) {
						$post_node['author'] = array( '@id' => $person['@id'] );
						$graph->add( $person );
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
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Jetpack_SEO_Utils lives in plugins/jetpack; guarded by the class_exists check on the same line.
		if ( ! class_exists( 'Jetpack_SEO_Utils' ) || ! class_exists( 'Jetpack_SEO_Posts' ) || ! Jetpack_SEO_Utils::is_enabled_jetpack_seo() ) {
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
			// Default flags escape forward slashes — important inside <script>
			// so a "</script>" in the data can't break out of the block.
			wp_json_encode( $document, JSON_UNESCAPED_UNICODE ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		);
	}

	/**
	 * Build the author Person node, wiring `worksFor` to the site Organization's
	 * stable `@id` when the Organization node resolves.
	 *
	 * @param \WP_User|int|null $user             User object or ID.
	 * @param bool              $has_organization Whether the Organization node resolves.
	 * @return array|null
	 */
	private static function build_person_node( $user, $has_organization ) {
		$person = Author_Schema_Node::build_person( $user );
		if ( null !== $person && $has_organization ) {
			$person['worksFor'] = array( '@id' => Schema_Node_Ids::organization() );
		}
		return $person;
	}
}
