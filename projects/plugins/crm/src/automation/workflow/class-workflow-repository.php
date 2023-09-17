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
	 * @param array $args (Optional) Arguments to filter the workflows result.
	 * @since $$next-version$$
	 *
	 * @return Automation_Workflow[]
	 */
	public function find_all( $args ): array {
		/** @todo Expand allowed arguments. */
		if ( isset( $args['active'] ) ) {
			$query = $this->wpdb->prepare( "SELECT * FROM {$this->table_name} WHERE active=%d", (int) $args['active'] ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		} else {
			$query = "SELECT * FROM {$this->table_name}"; // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
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
}
