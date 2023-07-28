<?php

namespace Automattic\Jetpack\CRM\Event_Manager; 

class Contact_Event implements Event {

	/** @var null The Contact_Event instance */
	private static $instance = null;
	
	/** @var array Fields that should not be notified */
	private $not_notifiable_fields = array(
		'created',
		'lastupdated',
		'lastcontacted',
	);

	/**
	 * Get the singleton instance of this class.
	 * 
	 * @return Contact_Event
	 */
	public static function get_instance(): Contact_Event {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		
		return self::$instance;
	}

	/**
	 * A new contact was created.
	 * 
	 * @param array $contact_data
	 * @return void
	 */
	public function created( array $contact_data ) {
		do_action( 'jpcrm_contact_created', $contact_data );
		//$this->ia_contact_created( $contact_data, $extra_data );
	}

	/**
	 * 
	 * @param array $contact_data
	 * @param array $old_contact_data
	 * @return void
	 */
	public function updated( array $contact_data, array $old_contact_data ) {

		// Note: Custom fields are not present in $dataArr. It's handled by addUpdateCustomField.

		// Skip social fields: tw, fb, li. They are handled/stored by the Metabox process
		// Skip lastupdate to avoid intempestive updates
		$fields_to_skip = array( 'tw', 'fb', 'li', 'lastupdated' );

		$contact_updated = array();
		foreach( $contact_data as $key => $value ) {
			// Remove DB prefixes
			$new_key = str_replace( 'zbsc_', '', $key );
			$new_key = str_replace( 'zbs_', '', $new_key );

			if ( in_array( $new_key, $fields_to_skip ) ) {
				continue;
			}
			$contact_updated[ $new_key ] = $value;
		}
		// Keep contact_data as is, without prefix, to pass it to the hooks
		$contact_data = $contact_updated;

		// Clean up fields that don't exist in both arrays
		$old_contact     = array_intersect_key( $old_contact_data, $contact_updated );
		$contact_updated = array_intersect_key( $contact_updated, $old_contact );

		// Check for effective fields changes
		$has_update = false;
		foreach ( $contact_updated as $field => $value ) {
			if ( $value != $old_contact[ $field ] ) {
				$has_update = true;
				
				// Notify only for notifiable fields
				if ( ! in_array( $field, $this->not_notifiable_fields ) ) {
					do_action( 'jpcrm_contact_' . $field . '_updated', $contact_data, $old_contact_data[ $field ] );
				}
			}
		}
		
		if ( $has_update ) {
			// General notification that contact was updated
			do_action( 'jpcrm_contact_updated', $contact_data, $old_contact_data );

			// Backward compatibility with Internal Automator
			//$this->ia_contact_updated( $contact_data['id'], $contact_data, $old_contact_data );
		}
	}
	
	/**
	 * A contact was deleted.
	 * 
	 * @param int $contact_id
	 * @return void
	 */
	public function deleted( int $contact_id ) {
		do_action( 'jpcrm_contact_deleted', $contact_id );
	}

	/**
	 * A contact is about to be deleted.
	 *
	 * @param int $contact_id
	 * @return void
	 */
	public function before_delete( int $contact_id ) {
		do_action( 'jpcrm_contact_before_delete', $contact_id );
	}

//	/**
//	 * Internal Automator backword compatibility.
//	 * 
//	 * @param int $contact_id
//	 * @param array $contact_data
//	 * @param array $old_contact_data
//	 * @return void
//	 */
//	private function ia_contact_updated( int $contact_id, array $contact_data, array $old_contact_data ) {
//		
//		zeroBSCRM_FireInternalAutomator( 'contact.update', array(
//			'id'           => $contact_id,
//			'againstid'    => $contact_id,
//			'userMeta'     => $contact_data,
//			// Commented: it is not used in the IA
//			//'prevSegments' => $contactsPreUpdateSegments,
//			'prev_contact' => $old_contact_data,
//		));
//	}
//	
//	/**
//	 * Internal Automator backword compatibility.
//	 * 
//	 * @param array $contact_data
//	 * @param array $extra_data
//	 * @return void
//	 */
//	private function ia_contact_created( array $contact_data, array $extra_data ) {
//		zeroBSCRM_FireInternalAutomator( 'contact.new', array(
//			'customerMeta'         => $contact_data,
//			'id'                   => $extra_data['new_id'],
//			'extsource'            => $extra_data['ext_source'],
//			'automatorpassthrough' => $extra_data['automator_passthrough'],
//			'customerExtraMeta'    => $extra_data['contact_extra_meta'],
//		));
//	}
}