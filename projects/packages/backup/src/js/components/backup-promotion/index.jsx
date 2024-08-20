import { __, sprintf } from '@wordpress/i18n';
import React from 'react';

/**
 * BackupPromotion component definition.
 *
 * @return {React.Component} BackupPromotion component.
 */
export default function BackupPromotion() {
	return (
		<div className="jp-backup-dashboard-promotion">
			<h3>
				{ __(
					'VaultPress Backup is the most proven WordPress backup plugin with 270 million site backups over the last ten years.',
					'jetpack-backup-pkg'
				) }
			</h3>
			<ul className="jp-product-promote">
				<li>
					{ sprintf(
						// translators: %s is the amount of storage.
						__( 'Automated real-time backups with %s of storage', 'jetpack-backup-pkg' ),
						'10 GB'
					) }
				</li>
				<li>{ __( 'Easy one-click restores from desktop or mobile', 'jetpack-backup-pkg' ) }</li>
				<li>{ __( 'Complete list of all site changes', 'jetpack-backup-pkg' ) }</li>
				<li>{ __( 'Global server infrastructure', 'jetpack-backup-pkg' ) }</li>
				<li>{ __( 'Best-in-class support', 'jetpack-backup-pkg' ) }</li>
				<li>{ __( 'Easy to use; no developer required', 'jetpack-backup-pkg' ) }</li>
				<li>
					{ __( 'Backups of all WooCommerce customer and order data', 'jetpack-backup-pkg' ) }
				</li>
			</ul>
		</div>
	);
}
