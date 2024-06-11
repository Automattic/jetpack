import { Text } from '@automattic/jetpack-components';
import clsx from 'clsx';
import { PRODUCT_STATUSES } from '../../constants';
import styles from './style.module.scss';
import { PRODUCT_STATUSES_LABELS } from '.';

const getStatusClassName = status => {
	switch ( status ) {
		case PRODUCT_STATUSES.ACTIVE:
		case PRODUCT_STATUSES.CAN_UPGRADE:
			return styles.active;
		case PRODUCT_STATUSES.ABSENT_WITH_PLAN:
		case PRODUCT_STATUSES.SITE_CONNECTION_ERROR:
		case PRODUCT_STATUSES.USER_CONNECTION_ERROR:
			return styles.warning;
		case PRODUCT_STATUSES.INACTIVE:
		case PRODUCT_STATUSES.NEEDS_PURCHASE:
		case PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE:
		case PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION:
			return styles.inactive;
		default:
			return styles.inactive;
	}
};

const Status = ( { status, isFetching, isInstallingStandalone } ) => {
	const flagLabel = PRODUCT_STATUSES_LABELS[ status ];
	const statusClassName = clsx( styles.status, getStatusClassName( status ), {
		[ styles[ 'is-fetching' ] ]: isFetching || isInstallingStandalone,
	} );

	return (
		<Text variant="label" className={ statusClassName }>
			{ flagLabel }
		</Text>
	);
};

export default Status;
