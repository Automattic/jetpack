<?php

namespace Automattic\Jetpack\CRM\Event_Manager; 

class Company_Event implements Event {
	
	/** @var null The Company_Event instance */
	private static $instance = null;
	
	/**
	 * Get the singleton instance of this class.
	 * 
	 * @return Company_Event
	 */
	public static function getInstance(): Company_Event {
		if ( ! self::$instance ) {
			self::$instance = new Company_Event();
		}
		
		return self::$instance;
	}

	/**
	 * A new company was created.
	 * 
	 * @param array $company_data
	 * @return void
	 */
	public function created( array $company_data ) {
		do_action( 'jpcrm_company_created', $company_data );
	}

	/**
	 * The company was updated.
	 * 
	 * @param array $company_data
	 * @param array $old_company_data
	 * @return void
	 */
	public function updated( array $company_data, array $old_company_data ) {
		
		// General update
		do_action( 'jpcrm_company_updated', $company_data );
		
		// Check for field changes for specific updates
		$changed_fields = array();
		foreach ( $company_data as $key => $value ) {
			if ( $value != $old_company_data[ $key ] ) {
				$changed_fields[ $key ] = $value;
				
				do_action( 'jpcrm_company_field_updated_' . $key, $value, $old_company_data[ $key ] );
			}
		}
	}
	
	
	/**
	 * A company was deleted.
	 * 
	 * @param array $company_data
	 * @return void
	 */
	public function deleted( array $company_data ) {
		do_action( 'jpcrm_company_deleted', $company_data );
	}
	
}