import { Text, getIconBySlug } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import Card from '../card';
import ActionButton, { PRODUCT_STATUSES } from './action-button';
import Status from './status';
import styles from './style.module.scss';

export const PRODUCT_STATUSES_LABELS = {
	[ PRODUCT_STATUSES.ACTIVE ]: __( 'Active', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.INACTIVE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.NEEDS_PURCHASE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.ERROR ]: __( 'Error', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.CAN_UPGRADE ]: __( 'Active', 'jetpack-my-jetpack' ),
};

const ProductCard = props => {
	const {
		name,
		description,
		status,
		onActivate,
		isFetching,
		isDataLoading,
		isInstallingStandalone,
		isDeactivatingStandalone,
		slug,
		children,
	} = props;

	const isError = status === PRODUCT_STATUSES.ERROR;
	const isAbsent =
		status === PRODUCT_STATUSES.ABSENT || status === PRODUCT_STATUSES.ABSENT_WITH_PLAN;
	const isPurchaseRequired =
		status === PRODUCT_STATUSES.NEEDS_PURCHASE ||
		status === PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE;

	const containerClassName = classNames( {
		[ styles.plugin_absent ]: isAbsent,
		[ styles[ 'is-purchase-required' ] ]: isPurchaseRequired,
		[ styles[ 'is-link' ] ]: isAbsent,
		[ styles[ 'has-error' ] ]: isError,
	} );

	const { recordEvent } = useAnalytics();

	/**
	 * Calls the passed function onActivate after firing Tracks event
	 */
	const activateHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_activate_click', {
			product: slug,
		} );
		onActivate();
	}, [ slug, onActivate, recordEvent ] );

	/**
	 * Calls the passed function onAdd after firing Tracks event
	 */
	const addHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_add_click', {
			product: slug,
		} );
	}, [ slug, recordEvent ] );

	/**
	 * Calls the passed function onManage after firing Tracks event
	 */
	const manageHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_manage_click', {
			product: slug,
		} );
	}, [ slug, recordEvent ] );

	/**
	 * Calls the passed function onManage after firing Tracks event
	 */
	const fixConnectionHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_fixconnection_click', {
			product: slug,
		} );
	}, [ slug, recordEvent ] );

	const ProductIcon = getIconBySlug( slug );

	return (
		<Card className={ classNames( styles.container, containerClassName ) }>
			<div className={ styles.title }>
				<div className={ styles.name }>
					<Text variant="title-medium">{ name }</Text>
				</div>
				{ ProductIcon && <ProductIcon color="#A7AAAD" /> }
			</div>

			<Text variant="body-small" className={ styles.description }>
				{ description }
			</Text>

			{ isDataLoading ? (
				<span className={ styles.loading }>{ __( 'Loading…', 'jetpack-my-jetpack' ) }</span>
			) : (
				children
			) }

			<div className={ styles.actions }>
				<ActionButton
					{ ...props }
					onActivate={ activateHandler }
					onFixConnection={ fixConnectionHandler }
					onManage={ manageHandler }
					onAdd={ addHandler }
					className={ styles.button }
				/>
				{ ! isAbsent && (
					<Status
						status={ status }
						isFetching={ isDeactivatingStandalone }
						isInstallingStandalone={ isInstallingStandalone }
						isDeactivatingStandalone={ isFetching }
					/>
				) }
			</div>
		</Card>
	);
};

ProductCard.propTypes = {
	children: PropTypes.node,
	name: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	admin: PropTypes.bool.isRequired,
	isFetching: PropTypes.bool,
	isInstallingStandalone: PropTypes.bool,
	isDeactivatingStandalone: PropTypes.bool,
	isManageDisabled: PropTypes.bool,
	onActivate: PropTypes.func,
	slug: PropTypes.string.isRequired,
	status: PropTypes.oneOf( [
		PRODUCT_STATUSES.ACTIVE,
		PRODUCT_STATUSES.INACTIVE,
		PRODUCT_STATUSES.ERROR,
		PRODUCT_STATUSES.ABSENT,
		PRODUCT_STATUSES.ABSENT_WITH_PLAN,
		PRODUCT_STATUSES.NEEDS_PURCHASE,
		PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE,
		PRODUCT_STATUSES.CAN_UPGRADE,
	] ).isRequired,
};

ProductCard.defaultProps = {
	isFetching: false,
	isInstallingStandalone: false,
	isDeactivatingStandalone: false,
	onActivate: () => {},
};

export { PRODUCT_STATUSES };
export default ProductCard;
