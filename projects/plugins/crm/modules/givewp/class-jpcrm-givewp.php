<?php 
/*!
* Jetpack CRM
* https://jetpackcrm.com
*
* GiveWP Module
*
*/
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * 
 * GiveWP Connector for Jetpack CRM
 * 
 */
class JPCRM_GiveWP {

	public function __construct() {
		if ( $this->check_dependencies() ) {
			$this->init_hooks();
		}
	}
	/**
	 *
	 * Checks dependencies for GiveWP integration
	 *
	 * @return bool
	 *
	 */
	public function check_dependencies() {

		global $zbs;

		$feature_name = 'GiveWP Connector for Jetpack CRM';

		$give_core_reqs = array(
			'req_core_ver' => $zbs->version, // will match current core version
			'req_DAL_ver'  => '3.0',
		);
		$give_plug_reqs = array(
			'name'    => 'GiveWP',
			'slug'    => 'give/give.php',
			'link'    => 'https://wordpress.org/plugins/give/',
			'kb_link' => $zbs->urls['kb_givewp'],
			'req_ver' => '2.13.0',
		);
		$meets_all_reqs = $zbs->dependency_checker->check_all_reqs(
			$feature_name,
			$give_core_reqs,
			$give_plug_reqs
		);

		if ( $meets_all_reqs ) {
			return true;
		}
		return false;
	}

	/**
	 *
	 * Adds GiveWP hooks
	 *
	 */
	public function init_hooks() {
		// fires at end of GiveWP's give_insert_payment() function
		add_action( 'give_insert_payment', array( $this, 'add_donation' ), 100, 2 );
		// fires at end of GiveWP's Give_Payment::update_status() function
		add_action( 'give_update_payment_status', array( $this, 'update_donation_status' ), 200, 3 );
	}

	/**
	 *
	 * Adds a donation transaction and its assigned donor contact
	 *
	 * This is hooked into the 'give_insert_payment' action, which is run at
	 * the end of GiveWP's give_insert_payment() function
	 *
	 * @param int   $givewp_donation_id donation ID
	 * @param array $payment_data       donor/donation info
	 *
	 */
	public function add_donation( $givewp_donation_id, $payment_data ) {

		global $zbs;

		// add/update donor first
		$contact_id = $this->add_update_donor( $givewp_donation_id, $payment_data );

		// check if transaction exists
		$transaction_id = $this->get_transaction_id_from_give_id( $givewp_donation_id );

		// if donor now exists and the transaction ID does not exist, create!
		if ( $contact_id && !$transaction_id ) {

			// build transaction

			// status isn't always available, but we we don't really need it anyway as it'll be set by the 'update_donation_status' hook
			$transaction_status = isset( $payment_data['status'] ) ? ucfirst( $payment_data['status'] ) : 'pending';

			// date isn't consistently available, so use now if it doesn't exist:
			// https://github.com/impress-org/givewp/blob/fd807ed0844996af33810dad11658e5c0b4aee5d/includes/payments/functions.php#L191-L193
			// also, there's no indication as to timezone, so we'll just use server timezone
			$transaction_date = isset( $payment_data['post_date'] ) ? strtotime( $payment_data['post_date'] ) : date( 'U' );

			$transaction_title = sprintf( __( 'GiveWP donation via the %s form', 'zero-bs-crm' ), $payment_data['give_form_title'] );

			$new_transaction_data = array(
				'status'          => $transaction_status,
				'type'            => __( 'Sale', 'zero-bs-crm' ), // someday maybe we'll add a donation type
				'ref'             => $payment_data['purchase_key'],
				'title'           => $transaction_title,
				'date'            => $transaction_date,
				'currency'        => $payment_data['currency'],
				'total'           => $payment_data['price'],
				'date_paid'       => $transaction_date,
				'date_completed'  => $transaction_date,
				'contacts'        => array( $contact_id ),
				'tags'            => array( 'GiveWP' ),
				'tag_mode'        => 'append',
				'externalSources' => array(
					array(
						'source' => 'givewp',
						'uid'    => $givewp_donation_id,
					),
				),
			);

			// add transaction
			$transaction_id = $zbs->DAL->transactions->addUpdateTransaction( array(
				'data'      => $new_transaction_data,
				'extraMeta' => array( 'givewp_transaction_id' => $givewp_donation_id ),
			));
		}
	}

	/**
	 *
	 * Adds or updates a donor contact
	 *
	 * @param int   $givewp_donation_id donation ID
	 * @param array $payment_data       donor/donation info
	 *
	 * @return int  $contact_id if successful
	 * @return bool if unsuccessful
	 *
	 */
	private function add_update_donor( $givewp_donation_id, $payment_data ) {

		global $zbs;

		// inspired by Jetpack Forms implementation
		$restricted_keys = array(
			'externalSources',
			'companies',
			'lastcontacted',
			'created',
			'aliases',
		);
		$jpcrm_field_prefix = 'jpcrm-';

		// build contact
		$new_contact_data = array(
			'status'   => __( 'Donor', 'zero-bs-crm' ),
			'tags'     => array( 'GiveWP' ),
			'tag_mode' => 'append',
		);

		// note that GiveWP explicitly requires a name (first_name) and email by design
		// https://givewp.com/documentation/core/frequent-troubleshooting-issues/
		foreach ( $payment_data['user_info'] as $k => $v ) {
			switch ( $k ) {
				case 'title':
					$new_contact_data['prefix'] = $v;
					break;
				case 'first_name':
					$new_contact_data['fname'] = $v;
					break;
				case 'last_name':
					$new_contact_data['lname'] = $v;
					break;
				case 'email':
					$new_contact_data['email'] = $v;
					break;
				case 'address':
					if ( !empty( $v ) ) {
						$new_contact_data['addr1'] = $v['line1'];
						$new_contact_data['addr2'] = $v['line2'];
						$new_contact_data['city'] = $v['city'];
						$new_contact_data['county'] = $v['state'];
						$new_contact_data['postcode'] = $v['zip'];
						$new_contact_data['country'] = $v['country'];
					}
					break;
				default:
					// handle any fields prefixed with $jpcrm_field_prefix as needed,
					// though by default GiveWP doesn't support custom fields
					if ( str_starts_with( $k, $jpcrm_field_prefix ) ) {
						$data_key = substr( $k, strlen( $jpcrm_field_prefix ) );
						if ( ! in_array( $data_key, $restricted_keys, true ) ) {
							if ( $data_key === 'tags' ) {
								$new_contact_data['tags'] = explode( ',', $v );
								$new_contact_data['tags'][] = 'GiveWP';
							} else {
								$new_contact_data[ $data_key ] = $v;
							}
						}
					}
			}
		}

		// If this is an existing WordPress user, make sure not to lose that association.
		$wp_user = get_user_by( 'email', $new_contact_data['email'] );
		if ( is_object( $wp_user ) ) {
			$new_contact_data['wpid'] = $wp_user->ID;
		}

		// specify contact source
		$new_contact_data['externalSources'] = array(
			array(
				'source' => 'givewp',
				'uid'    => $new_contact_data['email'],
			),
		);

		// log if contact is created by GiveWP
		$longdesc = sprintf( __( 'User was created from GiveWP when submitting donation %s through the %s form.', 'zero-bs-crm' ), $givewp_donation_id, '<b>' . $payment_data['give_form_title'] . '</b>' );
		$created_meta = array(
			'note_override' =>
				array(
					'type'      => __( 'Form filled', 'zero-bs-crm' ),
					'shortdesc' => __( 'Created from GiveWP', 'zero-bs-crm' ),
					'longdesc'  => $longdesc,
				),
		);

		// log if GiveWP transaction was added to this contact
		$longdesc = sprintf( __( 'A GiveWP donation was submitted by this user via the %s form.', 'zero-bs-crm' ), '<b>' . $payment_data['give_form_title'] . '</b>' );
		$exists_meta = array(
			'type'      => __( 'Form filled', 'zero-bs-crm' ),
			'shortdesc' => __( 'Donation via GiveWP', 'zero-bs-crm' ),
			'longdesc'  => $longdesc,
		);

		// add or update contact
		$contact_id = $zbs->DAL->contacts->addUpdateContact(
			array(
				'data'                 => $new_contact_data,
				'automatorPassthrough' => $created_meta,
				'fallBackLog'          => $exists_meta,
				'extraMeta'            => array(),
			)
		);
		return $contact_id;
	}

	/**
	 *
	 * Update a transaction status
	 *
	 * This is hooked into the 'give_update_payment_status' action, which
	 * is run at the end of GiveWP's Give_Payment::update_status() function
	 * 
	 * Note that this also runs when a new donation is created
	 *
	 * @param int    $givewp_donation_id donation ID
	 * @param string $new_status         new donation status
	 * @param string $old_status         old donation status
	 *
	 * @return bool
	 *
	 */
	public function update_donation_status( $givewp_donation_id, $new_status, $old_status ) {

		global $zbs;

		// completed status in GiveWP is actually publish
		if ( $new_status === 'publish' ) {
			$new_status = 'Completed';
		} else {
			// GiveWP passes lowercase statuses
			$new_status = ucfirst( $new_status );
		}

		// check if transaction exists
		$transaction_id = (int)$this->get_transaction_id_from_give_id( $givewp_donation_id );

		// update status if transaction exists
		if ( $transaction_id > 0 ) {
			return $zbs->DAL->transactions->setTransactionStatus( $transaction_id, $new_status );
		}
		return false;
	}

	/**
	 *
	 * Gets a transaction by its GiveWP donation ID
	 *
	 * @param int $givewp_donation_id the GiveWP donation ID
	 *
	 * @return int    $contact_id if successful
	 * @return bool   if unsuccessful
	 *
	 */
	public function get_transaction_id_from_give_id( $givewp_donation_id ) {
		global $zbs;
		return $zbs->DAL->getIDWithMeta( array(
			'objtype' => ZBS_TYPE_TRANSACTION,
			'key'     => 'extra_givewp_transaction_id',
			'val'     => $givewp_donation_id,
		));
	}
}
