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
	 *
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
	 * @return Automation_Workflow[]
	 */
	public function find_all(): array {
		$rows = $this->wpdb->get_results( "SELECT * FROM {$this->table_name}", ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared

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
	 * @return Automation_Workflow The persisted workflow.
	 *
	 * @throws Workflow_Exception Throw error if the workflow could not be persisted.
	 */
	public function persist( Automation_Workflow $workflow ): Automation_Workflow {
		$data                 = $workflow->to_array();
		$data['triggers']     = maybe_serialize( $data['triggers'] );
		$data['initial_step'] = maybe_serialize( $data['initial_step'] );

		if ( $workflow->get_id() && is_numeric( $workflow->get_id() ) ) {
			$workflow_id = $this->update( $data );
		} else {
			// Technically speaking, then "id" could contain a string which
			// would cause conflicts with the database, so we should unset
			// it to be safe.
			unset( $data['id'] );

			$workflow_id = $this->insert( $data );
		}

		return $this->find( $workflow_id );
	}

	/**
	 * Insert a workflow into the database.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $data The raw workflow data to persist.
	 * @return int The workflow ID.
	 *
	 * @throws Workflow_Exception Throw error if the workflow could not be inserted.
	 */
	protected function insert( array $data ): int {
		$time               = time();
		$data['created_at'] = $time;
		$data['updated_at'] = $time;

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

		return $this->wpdb->insert_id;
	}

	/**
	 * Update a workflow.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $data Raw workflow data to persist.
	 * @return int The workflow ID.
	 *
	 * @throws Workflow_Exception Throw error if the workflow could not be updated.
	 */
	protected function update( array $data ): int {
		$data['updated_at'] = time();

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

		return $data['id'];
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
		$row['triggers']     = maybe_unserialize( $row['triggers'] );
		$row['initial_step'] = maybe_unserialize( $row['initial_step'] );

		return new Automation_Workflow( $row );
	}
}
