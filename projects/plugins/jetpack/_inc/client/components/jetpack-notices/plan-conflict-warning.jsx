import { __, sprintf } from '@wordpress/i18n';
import SimpleNotice from 'components/notice';
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { getActiveSitePurchases } from 'state/site';

/**
 * PlanConflictWarning component
 *
 * @returns {object} component
 */
export function PlanConflictWarning( { activeSitePurchases, location: { pathname } } ) {
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

	let featureName = __( 'daily backups', 'jetpack' );
	if ( 'jetpack_business' === sitePlanPurchase.product_slug ) {
		featureName = __( 'real-time backups', 'jetpack' );
	}

	return (
		<SimpleNotice
			status="is-warning"
			showDismiss={ false }
			text={ sprintf(
				/* translators: %1$s: feature, such as "daily backups". %2$s: Plan name, such as "Jetpack Premium". %3$s: Product name, such as "Jetpack Backups". */
				__(
					'Your %2$s Plan includes %1$s. Looks like you also purchased the %3$s product. Consider removing %3$s.',
					'jetpack'
				),
				featureName,
				sitePlanPurchase.product_name,
				backupPurchase.product_name
			) }
		/>
	);
}

const PlanConflictWarningWithRouter = withRouter( PlanConflictWarning );

export default connect( state => ( {
	activeSitePurchases: getActiveSitePurchases( state ),
} ) )( PlanConflictWarningWithRouter );
