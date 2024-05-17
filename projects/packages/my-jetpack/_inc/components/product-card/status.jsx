import { Text } from '@automattic/jetpack-components';
import classNames from 'classnames';
import { PRODUCT_STATUSES } from './action-button';
import styles from './style.module.scss';
import { PRODUCT_STATUSES_LABELS } from '.';

const getStatusClassName = status => {
	switch ( status ) {
		case PRODUCT_STATUSES.ACTIVE:
		case PRODUCT_STATUSES.CAN_UPGRADE:
			return styles.active;
		case PRODUCT_STATUSES.ABSENT_WITH_PLAN:
			return styles.warning;
		case PRODUCT_STATUSES.INACTIVE:
		case PRODUCT_STATUSES.NEEDS_PURCHASE:
		case PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE:
			return styles.inactive;
		case PRODUCT_STATUSES.ERROR:
			return styles.inactive;
		default:
			return styles.inactive;
	}
};

const Status = ( { status, isFetching, isInstallingStandalone } ) => {
	const flagLabel = PRODUCT_STATUSES_LABELS[ status ];
	const statusClassName = classNames( styles.status, getStatusClassName( status ), {
		[ styles[ 'is-fetching' ] ]: isFetching || isInstallingStandalone,
	} );

	return (
		<Text variant="label" className={ statusClassName }>
			{ flagLabel }
		</Text>
	);
};

export default Status;
