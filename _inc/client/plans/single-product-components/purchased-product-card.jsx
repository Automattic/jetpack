/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import ProductCard from 'components/product-card';
import ProductExpiration from 'components/product-expiration';
import { getPlanClass } from 'lib/plans/constants';
import {
	BACKUP_DESCRIPTION_REALTIME,
	BACKUP_DESCRIPTION,
	DAILY_BACKUP_TITLE,
	REALTIME_BACKUP_TITLE,
	SEARCH_DESCRIPTION,
	SEARCH_TITLE,
} from '../constants';

export default function PurchasedProductCard( { purchase, siteRawlUrl } ) {
	if ( ! purchase || ! siteRawlUrl ) {
		return null;
	}

	const planClass = getPlanClass( purchase.product_slug );

	const subtitle = (
		<ProductExpiration
			expiryDate={ purchase.expiry_date }
			purchaseDate={ purchase.subscribed_date }
			isRefundable={ purchase.is_refundable }
		/>
	);

	const planLink = (
		<a
			href={ `https://wordpress.com/plans/my-plan/${ siteRawlUrl }` }
			target="_blank"
			rel="noopener noreferrer"
		/>
	);

	let productCardProps = { purchase, isCurrent: true };
	switch ( planClass ) {
		case 'is-search-plan':
			productCardProps = {
				title: SEARCH_TITLE,
				subtitle,
				description: SEARCH_DESCRIPTION,
				...productCardProps,
			};
		case 'is-daily-backup-plan':
			productCardProps = {
				title: DAILY_BACKUP_TITLE,
				subtitle,
				description: BACKUP_DESCRIPTION,
				...productCardProps,
			};
		case 'is-realtime-backup-plan':
			productCardProps = {
				title: REALTIME_BACKUP_TITLE,
				subtitle,
				description: BACKUP_DESCRIPTION_REALTIME,
				...productCardProps,
			};
		case 'is-personal-plan':
			productCardProps = {
				title: DAILY_BACKUP_TITLE,
				subtitle: __( 'Included in your {{planLink}}Personal Plan{{/planLink}}', {
					components: { planLink },
				} ),
				description: BACKUP_DESCRIPTION,
				...productCardProps,
			};
		case 'is-premium-plan':
			productCardProps = {
				title: DAILY_BACKUP_TITLE,
				subtitle: __( 'Included in your {{planLink}}Premium Plan{{/planLink}}', {
					components: { planLink },
				} ),
				description: BACKUP_DESCRIPTION,
				...productCardProps,
			};
		case 'is-business-plan':
			productCardProps = {
				title: REALTIME_BACKUP_TITLE,
				subtitle: __( 'Included in your {{planLink}}Professional Plan{{/planLink}}', {
					components: { planLink },
				} ),
				description: BACKUP_DESCRIPTION_REALTIME,
				...productCardProps,
			};
	}

	return <ProductCard { ...productCardProps } />;
}
