<?php
/**
 * Chooses the provisioner for this site.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Picks the local dev provisioner, the WordPress.com one, or none.
 */
class Provisioner_Factory {

	const PARENT_KEY_CONSTANT = 'JETPACK_SEND_MAILCHANNELS_PARENT_API_KEY';
	const SEND_LIMIT_CONSTANT = 'JETPACK_SEND_MAILCHANNELS_SEND_LIMIT';
	const DNS_ZONE_CONSTANT   = 'JETPACK_SEND_MAILCHANNELS_DNS_ZONE';

	/**
	 * The provisioner to use, or null when the site can't provision.
	 *
	 * @return Provisioner|null
	 */
	public static function get() {
		$provisioner = null;
		if ( defined( self::PARENT_KEY_CONSTANT ) && '' !== (string) constant( self::PARENT_KEY_CONSTANT ) ) {
			$limit       = defined( self::SEND_LIMIT_CONSTANT ) ? (int) constant( self::SEND_LIMIT_CONSTANT ) : null;
			$zone        = defined( self::DNS_ZONE_CONSTANT ) ? (string) constant( self::DNS_ZONE_CONSTANT ) : '';
			$provisioner = new Local_Provisioner( new MailChannels_Client( (string) constant( self::PARENT_KEY_CONSTANT ) ), $limit, $zone );
		} elseif ( ( new Connection_Manager() )->is_connected() ) {
			$provisioner = new Wpcom_Provisioner();
		}

		/**
		 * Filters the provisioner Send uses.
		 *
		 * @since $$next-version$$
		 *
		 * @param Provisioner|null $provisioner The chosen provisioner.
		 */
		$provisioner = apply_filters( 'jetpack_send_provisioner', $provisioner );

		return $provisioner instanceof Provisioner ? $provisioner : null;
	}
}
