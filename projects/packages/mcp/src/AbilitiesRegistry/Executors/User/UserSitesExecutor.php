<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Executors\User;

use Automattic\WpcomMcp\AbilitiesRegistry\Helpers\SiteMetricsHelper;
use Automattic\WpcomMcp\AbilitiesRegistry\Helpers\ValidationHelper;
use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\ExecutorInterface;
use Automattic\WpcomMcp\AbilitiesRegistry\Traits\UserContextTrait;
use Exception;
use WP_Error;

/**
 * User Sites Executor
 *
 * Contains all heavy execution logic for user sites operations.
 * Only loaded when the ability is actually executed.
 */
class UserSitesExecutor implements ExecutorInterface {
	use UserContextTrait;

	/**
	 * Execute the user sites ability
	 *
	 * @param array $input Input parameters.
	 * @return WP_Error|array The result data or error.
	 */
	public function execute( array $input = array() ) {
		try {
			// Validate pagination.
			$pagination = ValidationHelper::validate_pagination( $input );

			// Get user sites.
			$sites_data = $this->get_user_sites();

			if ( is_wp_error( $sites_data ) ) {
				return $sites_data;
			}

			// Apply filters and sorting.
			$filtered_sites = $this->apply_filters( $sites_data['sites'], $input['filters'] ?? array() );
			$sorted_sites   = $this->apply_sorting( $filtered_sites, $input['sort'] ?? array() );

			// Add metrics if requested.
			if ( $input['include_metrics'] ?? false ) {
				$sorted_sites = $this->add_metrics( $sorted_sites );
			}

			// Apply pagination.
			$paginated_result = $this->paginate_results( $sorted_sites, $pagination );

			return array(
				'success'    => true,
				'sites'      => $paginated_result['sites'],
				'pagination' => $paginated_result['pagination'],
				'summary'    => $this->generate_summary( $filtered_sites ),
			);

		} catch ( Exception $e ) {
			return $this->create_error(
				'sites_error',
				'An error occurred: ' . $e->getMessage(),
				500
			);
		}
	}

	/**
	 * Check permission for the user sites ability
	 *
	 * @param array $input Input parameters.
	 * @return bool True if permission is granted, false otherwise.
	 */
	public function check_permission( array $input = array() ): bool { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $input is required for interface compatibility
		return $this->check_user_permission();
	}

	/**
	 * Get user sites from WordPress database
	 *
	 * @return WP_Error|array The sites data or error.
	 */
	private function get_user_sites() {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id();

		// Get all sites for the user using WordPress.com API.
		$all_sites = get_ordered_blogs_of_user( $current_user_id, true, true, true );

		if ( ! $all_sites || is_wp_error( $all_sites ) ) {
			return $this->create_error( 'no_sites', 'Unable to retrieve user sites', 404 );
		}

		// Format sites data.
		$formatted_sites = array();
		foreach ( $all_sites as $site ) {
			$formatted_sites[] = $this->format_site_data( $site );
		}

		return array( 'sites' => $formatted_sites );
	}

	/**
	 * Format site data into consistent structure
	 *
	 * @param object $site Raw site data.
	 *
	 * @return array Formatted site data.
	 */
	private function format_site_data( $site ): array {
		$is_active         = ( '0' === $site->archived && '0' === $site->spam && '0' === $site->deleted );
		$is_private        = ( '0' === ( $site->public ?? '1' ) );
		$has_custom_domain = ! empty( $site->domain ) && ! str_contains( $site->domain, 'wordpress.com' );

		$status = 'active';
		if ( '1' === $site->spam ) {
			$status = 'suspended';
		} elseif ( '1' === $site->archived ) {
			$status = 'archived';
		} elseif ( '1' === $site->deleted ) {
			$status = 'deleted';
		}

		// Get additional site details.
		$blog_details     = get_blog_details( $site->userblog_id );
		$site_description = '';
		$language         = '';
		if ( $blog_details ) {
			// Get site description from blog options.
			$site_description = get_blog_option( $site->userblog_id, 'blogdescription', '' );
			// Get site language.
			$language = get_blog_option( $site->userblog_id, 'WPLANG', 'en_US' );
		}

		return array(
			'blog_id'           => (int) $site->userblog_id,
			'site_url'          => $site->siteurl,
			'blogname'          => $site->blogname,
			'description'       => $site_description,
			'domain'            => $site->domain,
			'path'              => $site->path,
			'is_private'        => $is_private,
			'is_active'         => $is_active,
			'has_custom_domain' => $has_custom_domain,
			'status'            => $status,
			'created_date'      => $site->registered ?? '',
			'last_updated'      => $site->last_updated ?? $site->registered ?? '',
			'language'          => $language,
			'site_id'           => (int) ( $site->site_id ?? 1 ),
		);
	}

	/**
	 * Apply filters to sites list
	 *
	 * @param array $sites Array of sites.
	 * @param array $filters Filters to apply.
	 *
	 * @return array Filtered sites.
	 */
	private function apply_filters( array $sites, array $filters ): array {
		if ( empty( $filters ) ) {
			return $sites;
		}

		return array_filter(
			$sites,
			function ( $site ) use ( $filters ) {
				// Search filter.
				if ( ! empty( $filters['search'] ) ) {
					$search_term = strtolower( $filters['search'] );
					$site_name   = strtolower( $site['blogname'] );
					$site_url    = strtolower( $site['site_url'] );

					if ( strpos( $site_name, $search_term ) === false &&
						strpos( $site_url, $search_term ) === false ) {
						return false;
					}
				}

				// Status filter.
				if ( isset( $filters['status'] ) && $filters['status'] !== $site['status'] ) {
					return false;
				}

				// Privacy filter.
				if ( isset( $filters['is_private'] ) && $filters['is_private'] !== $site['is_private'] ) {
					return false;
				}

				// Custom domain filter.
				if ( isset( $filters['has_custom_domain'] ) && $filters['has_custom_domain'] !== $site['has_custom_domain'] ) {
					return false;
				}

				return true;
			}
		);
	}

	/**
	 * Apply sorting to sites list
	 *
	 * @param array $sites Array of sites.
	 * @param array $sort Sort parameters.
	 *
	 * @return array Sorted sites.
	 */
	private function apply_sorting( array $sites, array $sort ): array {
		$field = $sort['field'] ?? 'updated';
		$order = $sort['order'] ?? 'desc';

		usort(
			$sites,
			function ( $a, $b ) use ( $field, $order ) {
				$value_a = $this->get_sort_value( $a, $field );
				$value_b = $this->get_sort_value( $b, $field );

				if ( is_numeric( $value_a ) && is_numeric( $value_b ) ) {
					$comparison = $value_a <=> $value_b;
				} else {
					$comparison = strcmp( $value_a, $value_b );
				}

				return ( 'desc' === $order ) ? - $comparison : $comparison;
			}
		);

		return $sites;
	}

	/**
	 * Get value for sorting
	 *
	 * @param array  $site Site data.
	 * @param string $field Field to get value for.
	 *
	 * @return mixed Sort value.
	 */
	private function get_sort_value( array $site, string $field ) {
		switch ( $field ) {
			case 'name':
				return $site['blogname'];
			case 'url':
				return $site['site_url'];
			case 'created':
				return $site['created_date'];
			case 'updated':
				return $site['last_updated'];
			default:
				return '';
		}
	}

	/**
	 * Add metrics to sites using WordPress.com internal functions
	 *
	 * @param array $sites Array of sites.
	 *
	 * @return array Sites with metrics.
	 */
	private function add_metrics( array $sites ): array {
		foreach ( $sites as &$site ) {
			$blog_id = $site['blog_id'];
			// Get comprehensive metrics using the helper.
			$metrics         = SiteMetricsHelper::get_site_metrics( $blog_id );
			$visitor_stats   = SiteMetricsHelper::get_visitor_stats( $blog_id, 30 );
			$health          = SiteMetricsHelper::get_site_health( $blog_id );
			$site['metrics'] = array(
				'monthly_views'         => $visitor_stats['views'],
				'total_posts'           => $metrics['content']['total_posts'],
				'total_pages'           => $metrics['content']['total_pages'],
				'total_comments'        => $metrics['content']['total_comments'],
				'total_media'           => $metrics['content']['total_media'],
				'storage_used_mb'       => $metrics['storage']['used_mb'],
				'storage_used_bytes'    => $metrics['storage']['used_bytes'],
				'storage_limit_mb'      => $metrics['storage']['limit_mb'],
				'storage_usage_percent' => $metrics['storage']['usage_percent'],
				'theme_name'            => $metrics['theme']['name'],
				'active_plugins'        => $metrics['plugins']['active_count'],
				'health_status'         => $health['status'],
				'health_issues'         => $health['issues'],
			);
		}

		return $sites;
	}

	/**
	 * Apply pagination to results
	 *
	 * @param array $sites Array of sites.
	 * @param array $pagination Pagination parameters.
	 *
	 * @return array Paginated results.
	 */
	private function paginate_results( array $sites, array $pagination ): array {
		$total_sites = count( $sites );
		$total_pages = ceil( $total_sites / $pagination['per_page'] );
		$offset      = ( $pagination['page'] - 1 ) * $pagination['per_page'];

		$paginated_sites = array_slice( $sites, $offset, $pagination['per_page'] );

		return array(
			'sites'      => $paginated_sites,
			'pagination' => array(
				'total_sites'  => $total_sites,
				'total_pages'  => $total_pages,
				'current_page' => $pagination['page'],
				'per_page'     => $pagination['per_page'],
			),
		);
	}

	/**
	 * Generate summary statistics
	 *
	 * @param array $sites Array of filtered sites.
	 *
	 * @return array Summary data.
	 */
	private function generate_summary( array $sites ): array {
		$total_sites    = count( $sites );
		$active_sites   = count( array_filter( $sites, array( $this, 'filter_active_sites' ) ) );
		$private_sites  = count( array_filter( $sites, array( $this, 'filter_private_sites' ) ) );
		$custom_domains = count( array_filter( $sites, array( $this, 'filter_custom_domains' ) ) );

		return array(
			'total_sites'    => $total_sites,
			'active_sites'   => $active_sites,
			'private_sites'  => $private_sites,
			'custom_domains' => $custom_domains,
		);
	}

	/**
	 * Filter function for active sites.
	 *
	 * @param array $site Site data.
	 * @return bool True if site is active.
	 */
	private function filter_active_sites( array $site ): bool {
		return 'active' === $site['status'];
	}

	/**
	 * Filter function for private sites.
	 *
	 * @param array $site Site data.
	 * @return bool True if site is private.
	 */
	private function filter_private_sites( array $site ): bool {
		return $site['is_private'];
	}

	/**
	 * Filter function for custom domains.
	 *
	 * @param array $site Site data.
	 * @return bool True if site has custom domain.
	 */
	private function filter_custom_domains( array $site ): bool {
		return $site['has_custom_domain'];
	}
}
