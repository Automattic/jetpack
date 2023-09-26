<?php
/**
 * The workflow repository responsible for communicating with the database.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Workflow;

use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Workflow_Exception;
use wpdb;

/**
 * Class Workflow_Repository.
 *
 * @since $$next-version$$
 */
class Workflow_Repository {

	/**
	 * The WordPress database access layer.
	 *
	 * @since $$next-version$$
	 * @var wpdb
	 */
	protected $wpdb;

	/**
	 * The workflows table name.
	 *
	 * @var string
	 */
	protected $table_name;

	/**
	 * Constructor.
	 *
	 * @global wpdb     $wpdb WordPress database abstraction object.
	 * @global string[] $ZBSCRM_t An array of Jetpack CRM table names.
	 * @since $$next-version$$
	 */
	public function __construct() {
		global $wpdb, $ZBSCRM_t; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		$this->wpdb       = $wpdb;
		$this->table_name = $ZBSCRM_t['automation-workflows']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	}

	/**
	 * Find Workflow by ID.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $id The workflow ID.
	 * @return Automation_Workflow|false The workflow object or false if not found.
	 */
	public function find( int $id ) {
		$row = $this->wpdb->get_row(
			$this->wpdb->prepare( "SELECT * FROM {$this->table_name} WHERE id=%d", $id ), // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			ARRAY_A
		);

		if ( ! is_array( $row ) ) {
			return false;
		}

		return $this->map_row_to_workflow( $row );
	}

	/**
	 * Get all workflows.
	 *
	 * @since $$next-version$$
	 *
	 * @return Automation_Workflow[]
	 */
	public function find_all(): array {
		return $this->find_by( array() );
	}

	/**
	 * Find workflows with the given criteria.
	 *
	 * @param array $criteria Arguments to filter the workflows result.
	 * @since $$next-version$$
	 *
	 * @return Automation_Workflow[]
	 */
	public function find_by( array $criteria ): array {
		$query = "SELECT * FROM {$this->table_name}";

		$allowed_criteria = array(
			'active'     => '%d',
			'name'       => '%s',
			'category'   => '%s',
			'created_at' => '%d',
			'updated_at' => '%d',
		);

		$where = array();

		// Prepare the WHERE criteria.
		foreach ( $criteria as $key => $value ) {
			if ( ! isset( $allowed_criteria[ $key ] ) ) {
				continue;
			}
			$where[] = $this->wpdb->prepare( "{$key}={$allowed_criteria[ $key ]}", $value ); // phpcs:ignore WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		}

		// Build the WHERE clause.
		if ( ! empty( $where ) ) {
			$query .= ' WHERE ' . implode( ' AND ', $where );
		}

		// Build pagination condition.
		if ( isset( $criteria['page'] ) || isset( $criteria['per_page'] ) || isset( $criteria['offset'] ) ) {
			$pagination_query = $this->prepare_pagination_arguments( $criteria );

			if ( $pagination_query ) {
				$query .= $pagination_query;
			}
		}

		$rows = $this->wpdb->get_results( $query, ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared

		if ( empty( $rows ) ) {
			return array();
		}

		foreach ( $rows as $index => $row ) {
			$rows[ $index ] = $this->map_row_to_workflow( $row );
		}

		return $rows;
	}

	/**
	 * Persist a workflow.
	 *
	 * This is used to both update and create a workflow.
	 *
	 * @since $$next-version$$
	 *
	 * @param Automation_Workflow $workflow The workflow to persist.
	 * @return void
	 *
	 * @throws Workflow_Exception Throw error if the workflow could not be persisted.
	 */
	public function persist( Automation_Workflow $workflow ): void {
		if ( $workflow->get_id() && is_numeric( $workflow->get_id() ) ) {
			$this->update( $workflow );
		} else {
			$this->insert( $workflow );
		}
	}

	/**
	 * Prepare the data to persist.
	 *
	 * @since $$next-version$$
	 *
	 * @param Automation_Workflow $workflow The workflow to persist.
	 * @return array The workflow raw data.
	 */
	protected function prepare_data_to_persist( Automation_Workflow $workflow ): array {
		$data = $workflow->to_array();

		$data['triggers'] = wp_json_encode( $data['triggers'] );
		$data['steps']    = wp_json_encode( $data['steps'] );

		return $data;
	}

	/**
	 * Insert a workflow into the database.
	 *
	 * @since $$next-version$$
	 *
	 * @param Automation_Workflow $workflow The workflow to persist.
	 *
	 * @throws Workflow_Exception Throw error if the workflow could not be inserted.
	 */
	protected function insert( Automation_Workflow $workflow ) {

		$time = time();
		$workflow->set_created_at( $time );
		$workflow->set_updated_at( $time );

		$data = $this->prepare_data_to_persist( $workflow );

		// Technically speaking, then "id" could contain a string which
		// would cause conflicts with the database, so we should unset
		// it to be safe.
		unset( $data['id'] );

		$inserted = $this->wpdb->insert(
			$this->table_name,
			$data
		);

		if ( ! $inserted ) {
			throw new Workflow_Exception(
				$this->wpdb->last_error,
				Workflow_Exception::FAILED_TO_INSERT
			);
		}

		$workflow->set_id( $this->wpdb->insert_id );
	}

	/**
	 * Update a workflow.
	 *
	 * @since $$next-version$$
	 *
	 * @param Automation_Workflow $workflow The workflow to persist.
	 * @return void
	 *
	 * @throws Workflow_Exception Throw error if the workflow could not be updated.
	 */
	protected function update( Automation_Workflow $workflow ): void {
		$workflow->set_updated_at( time() );

		$data = $this->prepare_data_to_persist( $workflow );

		$updated = $this->wpdb->update(
			$this->table_name,
			$data,
			array( 'id' => $data['id'] )
		);

		if ( ! $updated ) {
			throw new Workflow_Exception(
				$this->wpdb->last_error,
				Workflow_Exception::FAILED_TO_UPDATE
			);
		}
	}

	/**
	 * Delete a workflow.
	 *
	 * @since $$next-version$$
	 *
	 * @param Automation_Workflow $workflow The workflow to delete.
	 * @return bool
	 *
	 * @throws Workflow_Exception Throw error if the workflow could not be deleted.
	 */
	public function delete( Automation_Workflow $workflow ): bool {
		if ( ! is_numeric( $workflow->get_id() ) ) {
			/** @todo Should this return an error since tried to delete a programmatically defined workflow? */
			return false;
		}

		$deleted = $this->wpdb->delete(
			$this->table_name,
			array( 'id' => $workflow->get_id() )
		);

		if ( ! $deleted ) {
			throw new Workflow_Exception(
				$this->wpdb->last_error,
				Workflow_Exception::FAILED_TO_DELETE
			);
		}

		return true;
	}

	/**
	 * Map a database row to a workflow object.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $row The database row.
	 * @return Automation_Workflow
	 */
	protected function map_row_to_workflow( array $row ): Automation_Workflow {
		$row['triggers'] = json_decode( $row['triggers'] );
		$row['steps']    = json_decode( $row['steps'], true );

		return new Automation_Workflow( $row );
	}

	/**
	 * Create partial pagination SQL query.
	 *
	 * This logic does not try to enforce maximum limitations; E.g. the official WordPress
	 * REST documentation uses 100 results as their maximum.
	 * We still want to allow migration scripts, CLI commands, etc., to fetch as many results
	 * as they might want through the same repository.
	 * Phrased differently: any limitations we want to enforce should happen at the point
	 * of the request (e.g. when receiving arguments from the REST API).
	 *
	 * @link https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/#pagination-parameters
	 *
	 * @param array $args An array of arguments to filter the results.
	 * @return string|false The partial SQL query to append or false if no pagination is needed.
	 */
	protected function prepare_pagination_arguments( array $args = array() ) {
		$per_page = (int) isset( $args['per_page'] ) ? $args['per_page'] : 10;

		// We cannot combine "page" and "offset" since they mean the same thing; they're just
		// calculated and requested differently.
		// You can check the official WordPress REST documentation for more information about
		// how they're typically handled.
		if ( isset( $args['page'] ) ) {
			$page = (int) $args['page'];

			return $this->wpdb->prepare( // phpcs:ignore WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				' LIMIT %d OFFSET %d',
				$per_page,
				// We have to reduce the page number by 1 when calculating the offset because otherwise we
				// would always display "the next page".
				//
				// E.g.: We want to display the second page with 10 results per page.
				// [Request] Page: 2, Per page: 10.
				// ["Translated"] We want to show post 11-20.
				// [Offset] (2 - 1) * 10 = 10
				// The outcome of the calculated offset means that we will return results after the first 10 entries.
				( $page - 1 ) * $per_page
			);
		} elseif ( isset( $args['offset'] ) ) {
			$offset = (int) isset( $args['offset'] ) ? $args['offset'] : 0;

			// TL;DR of OFFSET in MySQL: It requires a limit, so we have to provide some sort of default.
			return $this->wpdb->prepare( // phpcs:ignore WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				' LIMIT %d OFFSET %d',
				$per_page,
				$offset
			);
		}

		return false;
	}
}
