<?php
/**
 * Task Factory.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Entities\Factories;

use Automattic\Jetpack\CRM\Entities\Task;

/**
 * Task Factory class.
 *
 * @since $$next-version$$
 */
class Task_Factory extends Entity_Factory {

	/**
	 * Task DB field name mapping. db_field => model_field.
	 *
	 * @var array
	 */
	protected static $field_map = array(
		'ID'                  => 'id',
		'zbs_owner'           => 'owner',
		'zbse_title'          => 'title',
		'zbse_desc'           => 'desc',
		'zbse_start'          => 'start',
		'zbse_end'            => 'end',
		'zbse_complete'       => 'complete',
		'zbse_show_on_portal' => 'show_on_portal',
		'zbse_show_on_cal'    => 'show_on_calendar',
		'zbse_created'        => 'created',
		'zbse_lastupdated'    => 'lastupdated',
	);

	/**
	 * Associative field map.
	 *
	 * For tags, invoices, transactions, quotes, tasks...
	 *
	 * @var array
	 */
	protected static $associative_field_map = array(
		'tags',
	);

	/**
	 * Get the task instance based on the $data array.
	 *
	 * @param array $data The task data from the DAL.
	 *
	 * @return mixed The task instance.
	 * @throws Factory_Exception If the data passed is invalid.
	 */
	public static function create( array $data ) {
		// Detect if this is a db task or a generic task
		if ( array_key_exists( 'zbse_created', $data ) ) {
			return self::create_from_db( $data );
		} elseif ( self::validate_tidy_task( $data ) ) {
			return self::create_from_tidy_data( $data );
		}

		throw new Factory_Exception( 'Invalid task data', Factory_Exception::INVALID_DATA );
	}

	/**
	 * Validate the data array (Tidy from DAL)
	 *
	 * @param array $tidy_task The tidy data array.
	 * @return bool If it's valid or not.
	 */
	public static function validate_tidy_task( array $tidy_task ): bool {

		if ( empty( $tidy_task ) ) {
			return false;
		}

		$valid_fields = array( 'title', 'desc', 'start' );

		foreach ( $valid_fields as $field ) {
			if ( ! array_key_exists( $field, $tidy_task ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_fields_map(): array {
		return self::$field_map;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_entity_class(): ?string {
		return Task::class;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_associative_field_map(): array {
		return self::$associative_field_map;
	}
}
