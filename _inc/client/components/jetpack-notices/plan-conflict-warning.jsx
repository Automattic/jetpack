/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import { withRouter } from 'react-router';

/**
 * Internal dependencies
 */
import SimpleNotice from 'components/notice';
import { getActiveSitePurchases } from 'state/site';

export function PlanConflictWarning( {
	activeSitePurchases,
	router: {
		location: { pathname },
	},
} ) {
	// Only show on plans page.
	if ( '/plans' !== pathname ) {
		return null;
	}

	// If we only have a single purchase, this isn't required.
	if ( activeSitePurchases.length <= 1 ) {
		return null;
	}

	// Strip "monthly" suffixes.
	const activeSitePurchasesTrimmed = activeSitePurchases.map( ( { product_slug, ...props } ) => ( {
		...props,
		product_slug: product_slug.replace( '_monthly', '' ),
	} ) );

	// Gets the current backup, if any.
	const backupPurchase = activeSitePurchasesTrimmed.find( ( { product_slug } ) =>
		product_slug.includes( 'backup' )
	);
	if ( ! backupPurchase ) {
		return null;
	}

	// Get the site plan purchase.
	const sitePlanPurchase = activeSitePurchasesTrimmed.find(
		( { product_slug } ) =>
			'jetpack_personal' === product_slug ||
			'jetpack_premium' === product_slug ||
			'jetpack_business' === product_slug
	);
	if ( ! sitePlanPurchase ) {
		return null;
	}

	// If the user purchased real-time backups and doesn't have Professional plan, it's not a conflict.
	if (
		'jetpack_backup_realtime' === backupPurchase.product_slug &&
		'jetpack_business' !== sitePlanPurchase.product_slug
	) {
		return null;
	}

	let featureName = __( 'daily backups' );
	if ( 'jetpack_business' === sitePlanPurchase.product_slug ) {
		featureName = __( 'real-time backups' );
	}

	return (
		<SimpleNotice
			status="is-warning"
			showDismiss={ false }
			text={ __(
				'Your %(planName)s Plan includes %(featureName)s. ' +
					'Looks like you also purchased the %(productName)s product. ' +
					'Consider removing %(productName)s.',
				{
					args: {
						featureName,
						planName: sitePlanPurchase.product_name,
						productName: backupPurchase.product_name,
					},
				}
			) }
		/>
	);
}

const PlanConflictWarningWithRouter = withRouter( PlanConflictWarning );

export default connect( state => ( {
	activeSitePurchases: getActiveSitePurchases( state ),
} ) )( PlanConflictWarningWithRouter );
