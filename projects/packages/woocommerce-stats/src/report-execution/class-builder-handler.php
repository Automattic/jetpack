<?php
/**
 * Local handler that runs a builder's SQL on the store's tables.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * A builder plus a schema adapter. The same builder over a WordPress.com schema would serve the
 * report from the synced tables.
 *
 * @since $$next-version$$
 */
class Builder_Handler implements Report_Handler {

	/**
	 * The report's SQL and shaping.
	 *
	 * @var Report_Builder
	 */
	private $builder;

	/**
	 * Table and column names.
	 *
	 * @var Local_Woo_Schema
	 */
	private $schema;

	/**
	 * Constructor.
	 *
	 * @param Report_Builder   $builder The report's SQL and shaping.
	 * @param Local_Woo_Schema $schema  Table and column names.
	 */
	public function __construct( Report_Builder $builder, Local_Woo_Schema $schema ) {
		$this->builder = $builder;
		$this->schema  = $schema;
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_capability() {
		return $this->builder->get_capability();
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param Report_Query $query The request.
	 */
	public function supports( Report_Query $query ) {
		foreach ( $this->builder->required_params() as $name ) {
			if ( null === $query->$name ) {
				return Report_Executor::error(
					'missing_parameter',
					400,
					'missing_parameter:' . $name,
					/* translators: %s: query param name. */
					sprintf( __( 'The report needs %s.', 'jetpack-woocommerce-stats-pkg' ), $name )
				);
			}
		}

		return true;
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param Report_Query $query The request.
	 */
	public function check_ready( Report_Query $query ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- The tables are the same for every request.
		if ( $this->schema->is_available() ) {
			return true;
		}

		return Report_Executor::error(
			'feature_missing',
			503,
			'table_missing',
			__( 'This store has no WooCommerce Analytics tables yet.', 'jetpack-woocommerce-stats-pkg' )
		);
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param Report_Query $query The request.
	 */
	public function run( Report_Query $query ) {
		global $wpdb;

		$rows = $wpdb->get_results( $this->builder->build_sql( $query, $this->schema ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- The builder prepares it; caching is the executor's to add.
		if ( '' !== $wpdb->last_error ) {
			return Report_Executor::error(
				'query_failed',
				500,
				'query_failed',
				__( 'The report query failed.', 'jetpack-woocommerce-stats-pkg' )
			);
		}

		return array(
			'data'    => $this->builder->shape( is_array( $rows ) ? $rows : array() ),
			'status'  => 200,
			'headers' => array(),
		);
	}
}
