import { __ } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import clsx from 'clsx';
import { PRODUCT_STATUSES } from '../../constants';
import styles from './style.module.scss';
import type { ComponentProps, FC } from 'react';

interface StatusProps {
	status: ProductStatus;
	isFetching: boolean;
	isInstallingStandalone: boolean;
	isOwned: boolean;
	suppressNeedsAttention?: boolean;
}

type BadgeIntent = ComponentProps< typeof Badge >[ 'intent' ];

type StatusStateFunction< T > = (
	status: ProductStatus,
	isOwned: boolean,
	suppressNeedsAttention: boolean
) => T;

const getStatusLabel: StatusStateFunction< string > = (
	status,
	isOwned,
	suppressNeedsAttention
) => {
	switch ( status ) {
		case PRODUCT_STATUSES.ACTIVE:
		case PRODUCT_STATUSES.CAN_UPGRADE:
			return __( 'Active', 'jetpack-my-jetpack' );
		case PRODUCT_STATUSES.EXPIRING_SOON:
			return __( 'Expires soon', 'jetpack-my-jetpack' );
		case PRODUCT_STATUSES.EXPIRED:
			return __( 'Expired plan', 'jetpack-my-jetpack' );
		case PRODUCT_STATUSES.INACTIVE:
		case PRODUCT_STATUSES.MODULE_DISABLED:
		case PRODUCT_STATUSES.NEEDS_ACTIVATION:
		case PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION:
		case PRODUCT_STATUSES.ABSENT:
			return __( 'Inactive', 'jetpack-my-jetpack' );
		case PRODUCT_STATUSES.ABSENT_WITH_PLAN:
			return __( 'Needs Plugin', 'jetpack-my-jetpack' );
		case PRODUCT_STATUSES.USER_CONNECTION_ERROR:
			return __( 'Needs user account', 'jetpack-my-jetpack' );
		case PRODUCT_STATUSES.SITE_CONNECTION_ERROR:
			return __( 'Needs connection', 'jetpack-my-jetpack' );
		case PRODUCT_STATUSES.NEEDS_PLAN: {
			const needsPlanText = __( 'Needs plan', 'jetpack-my-jetpack' );
			const inactiveText = __( 'Inactive', 'jetpack-my-jetpack' );
			return isOwned ? needsPlanText : inactiveText;
		}
		case PRODUCT_STATUSES.NEEDS_ATTENTION__WARNING:
		case PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR: {
			const activeText = __( 'Active', 'jetpack-my-jetpack' );
			const needsAttentionText = __( 'Needs attention', 'jetpack-my-jetpack' );
			if ( suppressNeedsAttention ) {
				return activeText;
			}
			return needsAttentionText;
		}
		default:
			return __( 'Inactive', 'jetpack-my-jetpack' );
	}
};

const getStatusIntent: StatusStateFunction< BadgeIntent > = (
	status,
	isOwned,
	suppressNeedsAttention
) => {
	switch ( status ) {
		case PRODUCT_STATUSES.ACTIVE:
		case PRODUCT_STATUSES.CAN_UPGRADE:
			return 'stable';
		case PRODUCT_STATUSES.ABSENT_WITH_PLAN:
		case PRODUCT_STATUSES.SITE_CONNECTION_ERROR:
		case PRODUCT_STATUSES.USER_CONNECTION_ERROR:
		case PRODUCT_STATUSES.EXPIRING_SOON:
			return 'medium';
		case PRODUCT_STATUSES.INACTIVE:
		case PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION:
		case PRODUCT_STATUSES.NEEDS_ACTIVATION:
			return 'none';
		case PRODUCT_STATUSES.NEEDS_PLAN:
			return isOwned ? 'medium' : 'none';
		case PRODUCT_STATUSES.EXPIRED:
			return 'medium';
		case PRODUCT_STATUSES.NEEDS_ATTENTION__WARNING:
			/**
			 * For the Protect card, even when it has a NEEDS_ATTENTION__{WARNING | ERROR}
			 * status (it means Threats have been detected), we still want to show the card
			 * status as 'Active'.
			 */
			if ( suppressNeedsAttention ) {
				return 'stable';
			}
			return 'medium';
		case PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR:
			if ( suppressNeedsAttention ) {
				return 'stable';
			}
			return 'high';
		default:
			return 'none';
	}
};

const Status: FC< StatusProps > = ( {
	status,
	isFetching,
	isInstallingStandalone,
	isOwned,
	suppressNeedsAttention = false,
} ) => {
	return (
		<span
			className={ clsx( styles.status, {
				[ styles[ 'is-fetching' ] ]: isFetching || isInstallingStandalone,
			} ) }
		>
			<Badge intent={ getStatusIntent( status, isOwned, suppressNeedsAttention ) }>
				{ getStatusLabel( status, isOwned, suppressNeedsAttention ) }
			</Badge>
		</span>
	);
};

export default Status;
