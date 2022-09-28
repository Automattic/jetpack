import { Text, Button } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import styles from './style.module.scss';

export const PRODUCT_STATUSES = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
	ERROR: 'error',
	ABSENT: 'plugin_absent',
	NEEDS_PURCHASE: 'needs_purchase',
};

const PRODUCT_STATUSES_LABELS = {
	[ PRODUCT_STATUSES.ACTIVE ]: __( 'Active', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.INACTIVE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.NEEDS_PURCHASE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.ERROR ]: __( 'Error', 'jetpack-my-jetpack' ),
};

const ActionButton = ( {
	status,
	admin,
	name,
	onActivate,
	onManage,
	onFixConnection,
	isFetching,
	className,
	onAdd,
} ) => {
	if ( ! admin ) {
		return (
			<Button { ...buttonState } size="small" variant="link" weight="regular">
				{
					/* translators: placeholder is product name. */
					sprintf( __( 'Learn about %s', 'jetpack-my-jetpack' ), name )
				}
			</Button>
		);
	}

	const buttonState = {
		variant: ! isFetching ? 'primary' : undefined,
		disabled: isFetching,
		className,
	};

	switch ( status ) {
		case PRODUCT_STATUSES.ABSENT:
			return (
				<Button { ...buttonState } size="small" variant="link" weight="regular">
					{
						/* translators: placeholder is product name. */
						sprintf( __( 'Add %s', 'jetpack-my-jetpack' ), name )
					}
				</Button>
			);
		case PRODUCT_STATUSES.NEEDS_PURCHASE:
			return (
				<Button { ...buttonState } size="small" weight="regular" onClick={ onAdd }>
					{ __( 'Purchase', 'jetpack-my-jetpack' ) }
				</Button>
			);
		case PRODUCT_STATUSES.ACTIVE:
			return (
				<Button
					{ ...buttonState }
					size="small"
					weight="regular"
					variant="secondary"
					onClick={ onManage }
				>
					{ __( 'Manage', 'jetpack-my-jetpack' ) }
				</Button>
			);
		case PRODUCT_STATUSES.ERROR:
			return (
				<Button { ...buttonState } size="small" weight="regular" onClick={ onFixConnection }>
					{ __( 'Fix connection', 'jetpack-my-jetpack' ) }
				</Button>
			);
		case PRODUCT_STATUSES.INACTIVE:
			return (
				<Button
					{ ...buttonState }
					size="small"
					weight="regular"
					variant="secondary"
					onClick={ onActivate }
				>
					{ __( 'Activate', 'jetpack-my-jetpack' ) }
				</Button>
			);

		default:
			return null;
	}
};

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
	} = props;
	const isActive = status === PRODUCT_STATUSES.ACTIVE;
	const isError = status === PRODUCT_STATUSES.ERROR;
	const isInactive = status === PRODUCT_STATUSES.INACTIVE;
	const isAbsent = status === PRODUCT_STATUSES.ABSENT;
	const isPurchaseRequired = status === PRODUCT_STATUSES.NEEDS_PURCHASE;
	const flagLabel = PRODUCT_STATUSES_LABELS[ status ];

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
		? ( { children, ...cardProps } ) => (
				<a { ...cardProps } href="#" onClick={ addHandler }>
					{ children }
				</a>
		  )
		: ( { children, ...cardProps } ) => <div { ...cardProps }>{ children }</div>;

	return (
		<CardWrapper className={ containerClassName }>
			<div className={ styles.name }>
				<Text variant="title-medium">{ name }</Text>
				{ icon }
			</div>
			<Text variant="body-small" className={ styles.description }>
				{ description }
			</Text>
			<div className={ styles.actions }>
				<ActionButton
					{ ...props }
					onActivate={ activateHandler }
					onFixConnection={ fixConnectionHandler }
					onManage={ manageHandler }
					className={ styles.button }
				/>
				{ ! isAbsent && (
					<Text variant="label" className={ statusClassName }>
						{ flagLabel }
					</Text>
				) }
			</div>
		</CardWrapper>
	);
};

ProductCard.propTypes = {
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
		PRODUCT_STATUSES.NEEDS_PURCHASE,
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

export default ProductCard;
