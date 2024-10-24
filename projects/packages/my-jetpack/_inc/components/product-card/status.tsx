import { Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { PRODUCT_STATUSES } from '../../constants';
import styles from './style.module.scss';
import type { FC } from 'react';

interface StatusProps {
	status: ProductStatus;
	isFetching: boolean;
	isInstallingStandalone: boolean;
	isOwned: boolean;
}

type StatusStateFunction = ( status: ProductStatus, isOwned: boolean ) => string;

const getStatusLabel: StatusStateFunction = ( status, isOwned ) => {
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
		default:
			return __( 'Inactive', 'jetpack-my-jetpack' );
	}
};

const getStatusClassName: StatusStateFunction = ( status, isOwned ) => {
	switch ( status ) {
		case PRODUCT_STATUSES.ACTIVE:
		case PRODUCT_STATUSES.CAN_UPGRADE:
			return styles.active;
		case PRODUCT_STATUSES.ABSENT_WITH_PLAN:
		case PRODUCT_STATUSES.SITE_CONNECTION_ERROR:
		case PRODUCT_STATUSES.USER_CONNECTION_ERROR:
		case PRODUCT_STATUSES.EXPIRING_SOON:
			return styles.warning;
		case PRODUCT_STATUSES.INACTIVE:
		case PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION:
		case PRODUCT_STATUSES.NEEDS_ACTIVATION:
			return styles.inactive;
		case PRODUCT_STATUSES.NEEDS_PLAN:
			return isOwned ? styles.warning : styles.inactive;
		case PRODUCT_STATUSES.EXPIRED:
			return styles.error;
		default:
			return styles.inactive;
	}
};

const Status: FC< StatusProps > = ( { status, isFetching, isInstallingStandalone, isOwned } ) => {
	const flagLabel = getStatusLabel( status, isOwned );
	const statusClassName = clsx( styles.status, getStatusClassName( status, isOwned ), {
		[ styles[ 'is-fetching' ] ]: isFetching || isInstallingStandalone,
	} );

	return (
		<Text variant="label" className={ statusClassName }>
			{ flagLabel }
		</Text>
	);
};

export default Status;
