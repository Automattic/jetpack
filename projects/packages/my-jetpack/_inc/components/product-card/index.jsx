import { Button, Text } from '@automattic/jetpack-components';
import { Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { external, moreVertical } from '@wordpress/icons';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import ActionButton, { PRODUCT_STATUSES } from './action-buton';
import styles from './style.module.scss';

const PRODUCT_STATUSES_LABELS = {
	[ PRODUCT_STATUSES.ACTIVE ]: __( 'Active', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.INACTIVE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.NEEDS_PURCHASE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.ERROR ]: __( 'Error', 'jetpack-my-jetpack' ),
};

/* eslint-disable react/jsx-no-bind */
const Menu = ( { items = [], onManage } ) => {
	return (
		<Dropdown
			className={ styles.dropdown }
			popoverProps={ { noArrow: false, placement: 'bottom-end' } }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					variant="tertiary"
					size="small"
					icon={ moreVertical }
					onClick={ onToggle }
					aria-expanded={ isOpen }
				/>
			) }
			renderContent={ ( { onClose } ) => (
				<>
					{ items.map( item => (
						<Button
							weight="regular"
							fullWidth
							variant="tertiary"
							icon={ item?.icon }
							onClick={ () => {
								onClose();
								item?.onClick?.();
							} }
						>
							{ item?.label }
						</Button>
					) ) }
					<Button
						weight="regular"
						fullWidth
						variant="tertiary"
						icon={ external }
						onClick={ () => {
							onClose();
							onManage?.();
						} }
					>
						{ __( 'Manage', 'jetpack-my-jetpack' ) }
					</Button>
				</>
			) }
		/>
	);
};
/* eslint-enable react/jsx-no-bind */

const ProductCard = props => {
	const {
		name,
		description,
		icon,
		status,
		onActivate,
		onAdd,
		onFixConnection,
		onManage,
		isFetching,
		slug,
		children,
		showMenu = false,
		menuItems = [],
	} = props;
	const isActive = status === PRODUCT_STATUSES.ACTIVE;
	const isError = status === PRODUCT_STATUSES.ERROR;
	const isInactive = status === PRODUCT_STATUSES.INACTIVE;
	const isAbsent =
		status === PRODUCT_STATUSES.ABSENT || status === PRODUCT_STATUSES.ABSENT_WITH_PLAN;
	const isPurchaseRequired =
		status === PRODUCT_STATUSES.NEEDS_PURCHASE ||
		status === PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE;
	const flagLabel = PRODUCT_STATUSES_LABELS[ status ];

	// If status isn't active, we show only one action through the button
	const menuIsActive = showMenu && isActive;

	const containerClassName = classNames( styles.container, {
		[ styles.plugin_absent ]: isAbsent,
		[ styles[ 'is-purchase-required' ] ]: isPurchaseRequired,
		[ styles[ 'is-link' ] ]: isAbsent,
		[ styles[ 'has-error' ] ]: isError,
	} );

	const statusClassName = classNames( styles.status, {
		[ styles.active ]: isActive,
		[ styles.inactive ]: isInactive || isPurchaseRequired,
		[ styles.error ]: isError,
		[ styles[ 'is-fetching' ] ]: isFetching,
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
	const addHandler = useCallback(
		ev => {
			if ( ev?.preventDefault ) {
				ev.preventDefault();
			}

			recordEvent( 'jetpack_myjetpack_product_card_add_click', {
				product: slug,
			} );
			onAdd();
		},
		[ slug, onAdd, recordEvent ]
	);

	/**
	 * Calls the passed function onManage after firing Tracks event
	 */
	const manageHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_manage_click', {
			product: slug,
		} );
		onManage();
	}, [ slug, onManage, recordEvent ] );

	/**
	 * Calls the passed function onManage after firing Tracks event
	 */
	const fixConnectionHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_fixconnection_click', {
			product: slug,
		} );
		onFixConnection();
	}, [ slug, onFixConnection, recordEvent ] );

	const CardWrapper = isAbsent
		? ( { children: wrapperChildren, ...cardProps } ) => (
				<a { ...cardProps } href="#" onClick={ addHandler }>
					{ wrapperChildren }
				</a>
		  )
		: ( { children: wrapperChildren, ...cardProps } ) => (
				<div { ...cardProps }>{ wrapperChildren }</div>
		  );

	return (
		<CardWrapper className={ containerClassName }>
			<div className={ styles.title }>
				<div className={ styles.name }>
					<Text variant="title-medium">{ name }</Text>
					{ menuIsActive && icon }
				</div>
				{ menuIsActive ? <Menu items={ menuItems } onManage={ onManage } /> : icon }
			</div>
			{
				// If is not active, no reason to use children
				// Since we want user to take action if isn't active
				isActive && children ? (
					children
				) : (
					<>
						{ isAbsent ? (
							<Text variant="body-small" className={ styles.description }>
								{ description }
							</Text>
						) : (
							<Text variant="label" className={ statusClassName }>
								{ flagLabel }
							</Text>
						) }
						<div className={ styles.actions }>
							<ActionButton
								{ ...props }
								onActivate={ activateHandler }
								onFixConnection={ fixConnectionHandler }
								onManage={ manageHandler }
								className={ styles.button }
							/>
						</div>
					</>
				)
			}
		</CardWrapper>
	);
};

ProductCard.propTypes = {
	children: PropTypes.node,
	name: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	icon: PropTypes.element,
	admin: PropTypes.bool.isRequired,
	isFetching: PropTypes.bool,
	onManage: PropTypes.func,
	onFixConnection: PropTypes.func,
	onActivate: PropTypes.func,
	onAdd: PropTypes.func,
	slug: PropTypes.string.isRequired,
	status: PropTypes.oneOf( [
		PRODUCT_STATUSES.ACTIVE,
		PRODUCT_STATUSES.INACTIVE,
		PRODUCT_STATUSES.ERROR,
		PRODUCT_STATUSES.ABSENT,
		PRODUCT_STATUSES.ABSENT_WITH_PLAN,
		PRODUCT_STATUSES.NEEDS_PURCHASE,
		PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE,
	] ).isRequired,
};

ProductCard.defaultProps = {
	icon: null,
	isFetching: false,
	onManage: () => {},
	onFixConnection: () => {},
	onActivate: () => {},
	onAdd: () => {},
};

export { PRODUCT_STATUSES };
export default ProductCard;
