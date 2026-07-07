<?php
/**
 * Composes environment signals into one availability status.
 *
 * @package automattic/jetpack-features
 */

namespace Automattic\Jetpack\Features;

/**
 * Pure composition: given a Feature and an environment, produce status + reason + facets.
 */
class Status_Resolver {

	const STATUS_ACTIVE           = 'active';
	const STATUS_AVAILABLE_OFF    = 'available_off';
	const STATUS_NEEDS_CONNECTION = 'needs_connection';
	const STATUS_NEEDS_UPGRADE    = 'needs_upgrade';
	const STATUS_UNSUPPORTED      = 'unsupported';

	/**
	 * Resolve feature status given environment signals.
	 *
	 * @param Feature             $f   Feature to resolve.
	 * @param Feature_Environment $env Bound platform adapter.
	 * @return array{status:string,reason:string,facets:array}
	 */
	public function resolve( Feature $f, Feature_Environment $env ) {
		$applicable     = $env->is_applicable( $f );
		$entitled       = $env->is_entitled( $f->entitlement() );
		$connection_req = $f->connection();
		$connection_met = $env->connection_level_met( $connection_req );
		$active         = $env->is_active( $f );

		// Precedence: unsupported -> needs_connection -> needs_upgrade -> available_off -> active.
		if ( ! $applicable ) {
			$status = self::STATUS_UNSUPPORTED;
			$reason = 'not_applicable';
		} elseif ( ! $connection_met ) {
			$status = self::STATUS_NEEDS_CONNECTION;
			$reason = 'connection_missing';
		} elseif ( ! $entitled ) {
			$status = self::STATUS_NEEDS_UPGRADE;
			$reason = 'not_entitled';
		} elseif ( ! $active ) {
			$status = self::STATUS_AVAILABLE_OFF;
			$reason = 'inactive';
		} else {
			$status = self::STATUS_ACTIVE;
			$reason = 'available';
		}

		return array(
			'status' => $status,
			'reason' => $reason,
			'facets' => array(
				'registered'          => true,
				'applicable'          => $applicable,
				'entitled'            => $entitled,
				'connection_required' => $connection_req,
				'connection_met'      => $connection_met,
				'active'              => $active,
			),
		);
	}
}
