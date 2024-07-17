import { Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { PRODUCT_STATUSES } from '../../constants';
import styles from './style.module.scss';
import type { FC } from 'react';

interface StatusProps {
	status: keyof typeof PRODUCT_STATUSES;
	isFetching: boolean;
	isInstallingStandalone: boolean;
	isOwned: boolean;
}

type StatusStateFunction = ( status: keyof typeof PRODUCT_STATUSES, isOwned: boolean ) => string;

const getStatusLabel: StatusStateFunction = ( status, isOwned ) => {
	switch ( status ) {
		case PRODUCT_STATUSES.ACTIVE:
		case PRODUCT_STATUSES.CAN_UPGRADE:
			return __( 'Active', 'jetpack-my-jetpack' );
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
		case PRODUCT_STATUSES.NEEDS_PURCHASE:
			return isOwned
				? __( 'Needs plan', 'jetpack-my-jetpack' )
				: __( 'Inactive', 'jetpack-my-jetpack' );
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
			return styles.warning;
		case PRODUCT_STATUSES.INACTIVE:
		case PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION:
		case PRODUCT_STATUSES.NEEDS_ACTIVATION:
			return styles.inactive;
		case PRODUCT_STATUSES.NEEDS_PURCHASE:
			return isOwned ? styles.warning : styles.inactive;
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
