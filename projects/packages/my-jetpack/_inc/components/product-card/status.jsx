import { Text } from '@automattic/jetpack-components';
import classNames from 'classnames';
import { PRODUCT_STATUSES } from './action-button';
import styles from './style.module.scss';
import { PRODUCT_STATUSES_LABELS } from '.';

const Status = ( { status, isFetching, isInstallingStandalone, isDeactivatingStandalone } ) => {
	const isActive = status === PRODUCT_STATUSES.ACTIVE;
	const isError = status === PRODUCT_STATUSES.ERROR;
	const isInactive = status === PRODUCT_STATUSES.INACTIVE;
	const isPurchaseRequired =
		status === PRODUCT_STATUSES.NEEDS_PURCHASE ||
		status === PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE;
	const flagLabel = PRODUCT_STATUSES_LABELS[ status ];
	const statusClassName = classNames( styles.status, {
		[ styles.active ]: isActive,
		[ styles.inactive ]: isInactive || isPurchaseRequired,
		[ styles.error ]: isError,
		[ styles[ 'is-fetching' ] ]: isFetching || isInstallingStandalone || isDeactivatingStandalone,
	} );

	return (
		<Text variant="label" className={ statusClassName }>
			{ flagLabel }
		</Text>
	);
};

export default Status;
