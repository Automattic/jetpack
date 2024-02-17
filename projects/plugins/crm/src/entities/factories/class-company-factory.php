<?php
/**
 * Company Factory.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Entities\Factories;

use Automattic\Jetpack\CRM\Entities\Company;

/**
 * Company Factory class.
 *
 * @since 6.2.0
 */
class Company_Factory extends Entity_Factory {

	/**
	 * Company DB field name mapping. db_field => model_field.
	 *
	 * @since 6.2.0
	 * @var array
	 */
	protected static $field_map = array(
		'ID'                  => 'id',
		'zbs_owner'           => 'owner',
		'zbsco_status'        => 'status',
		'zbsco_email'         => 'email',
		'zbsco_name'          => 'name',
		'zbsco_addr1'         => 'addr1',
		'zbsco_addr2'         => 'addr2',
		'zbsco_city'          => 'city',
		'zbsco_county'        => 'county',
		'zbsco_postcode'      => 'postcode',
		'zbsco_country'       => 'country',
		'zbsco_secaddr1'      => 'secaddr_addr1',
		'zbsco_secaaddr2'     => 'secaddr_addr2',
		'zbsco_seccity'       => 'secaddr_city',
		'zbsco_seccounty'     => 'secaddr_county',
		'zbsco_secpostcode'   => 'secaddr_postcode',
		'zbsco_seccountry'    => 'secaddr_country',
		'zbsco_maintel'       => 'maintel',
		'zbsco_sectel'        => 'sectel',
		'zbsco_wpid'          => 'wpid',
		'zbsco_avatar'        => 'avatar',
		'zbsco_tw'            => 'tw',
		'zbsco_li'            => 'li',
		'zbsco_fb'            => 'fb',
		'zbsco_created'       => 'created',
		'zbsco_lastupdated'   => 'lastupdated',
		'zbsco_lastcontacted' => 'lastcontacted',
	);

	/**
	 * Associative field map.
	 *
	 * For tags, invoices, transactions, quotes, tasks...
	 *
	 * @since 6.2.0
	 * @var array
	 */
	protected static $associative_field_map = array(
		'tags',
	);

	/**
	 * Get the company instance based on the $data array.
	 *
	 * @since 6.2.0
	 *
	 * @param array $data The company data from the DAL.
	 * @return mixed The company instance.
	 *
	 * @throws Factory_Exception If the data passed is invalid.
	 */
	public static function create( array $data ) {
		// Detect if this is a db company or a generic company
		if ( array_key_exists( 'zbsco_status', $data ) ) {
			return self::create_from_db( $data );
		} elseif ( self::validate_tidy_company( $data ) ) {
			return self::create_from_tidy_data( $data );
		}

		throw new Factory_Exception( 'Invalid company data', Factory_Exception::INVALID_DATA );
	}

	/**
	 * Validate the data array (Tidy from DAL)
	 *
	 * @since 6.2.0
	 *
	 * @param array $tidy_company The tidy data array.
	 * @return bool If it's valid or not.
	 */
	public static function validate_tidy_company( array $tidy_company ): bool {

		if ( empty( $tidy_company ) ) {
			return false;
		}

		$valid_fields = array( 'name', 'email', 'addr1' );

		foreach ( $valid_fields as $field ) {
			if ( ! array_key_exists( $field, $tidy_company ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_entity_class(): ?string {
		return Company::class;
	}
}
