/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { __, sprintf } from '@wordpress/i18n';
import { ButtonGroup, Button, DropdownMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

export const PRODUCT_STATUSES = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
	ERROR: 'error',
	ABSENT: 'absent',
};

const PRODUCT_STATUSES_LABELS = {
	[ PRODUCT_STATUSES.ACTIVE ]: __( 'Active', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.INACTIVE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.ERROR ]: __( 'Error', 'jetpack-my-jetpack' ),
};

const DownIcon = () => (
	<svg width="15" height="9" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="10 9 4 7">
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="m18.004 10.555-6.005 5.459-6.004-5.459 1.009-1.11 4.995 4.542 4.996-4.542 1.009 1.11Z"
			fill="#fff"
		/>
	</svg>
);

const Action = ( {
	status,
	name,
	admin = true,
	onActionClick,
	actionButtonLabel,
	onDeactivate,
} ) => {
	if ( ! admin ) {
		return (
			/* translators: placeholder is product name. */
			<div>{ sprintf( __( 'Learn about %s', 'jetpack-my-jetpack' ), name ) }</div>
		);
	}

	if ( status === PRODUCT_STATUSES.ABSENT ) {
		return (
			/* translators: placeholder is product name. */
			<div>{ sprintf( __( 'Add %s', 'jetpack-my-jetpack' ), name ) }</div>
		);
	}

	return (
		<ButtonGroup>
			<Button isPressed onClick={ onActionClick }>
				{ actionButtonLabel }
			</Button>
			<DropdownMenu
				className={ styles.dropdown }
				toggleProps={ { isPressed: true } }
				popoverProps={ { noArrow: false } }
				icon={ DownIcon }
				controls={ [
					{
						title: __( 'Deactivate', 'jetpack-my-jetpack' ),
						icon: null,
						onClick: onDeactivate,
					},
				] }
			/>
		</ButtonGroup>
	);
};

const ProductCard = ( {
	name,
	description,
	icon,
	status,
	actionButtonLabel,
	onDeactivate,
	onActionClick,
} ) => {
	const renderStatusFlag = status !== PRODUCT_STATUSES.ABSENT;

	const containerClassName = classNames( styles.container, {
		[ styles.absent ]: status === PRODUCT_STATUSES.ABSENT,
	} );

	const statusClassName = classNames( styles.status, {
		[ styles.active ]: status === PRODUCT_STATUSES.ACTIVE,
		[ styles.inactive ]: status === PRODUCT_STATUSES.INACTIVE,
		[ styles.error ]: status === PRODUCT_STATUSES.ERROR,
	} );

	return (
		<div className={ containerClassName }>
			<div className={ styles.name }>
				<span>{ name }</span>
				{ icon }
			</div>
			<p className={ styles.description }>{ description }</p>
			<div className={ styles.actions }>
				<Action
					name={ name }
					status={ status }
					actionButtonLabel={ actionButtonLabel }
					onDeactivate={ onDeactivate }
					onActionClick={ onActionClick }
				/>
				{ renderStatusFlag && (
					<div className={ statusClassName }>{ PRODUCT_STATUSES_LABELS[ status ] }</div>
				) }
			</div>
		</div>
	);
};

ProductCard.propTypes = {
	name: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	icon: PropTypes.element,
	actionButtonLabel: PropTypes.string,
	onDeactivate: PropTypes.func,
	onActionClick: PropTypes.func,
	status: PropTypes.oneOf( [
		PRODUCT_STATUSES.ACTIVE,
		PRODUCT_STATUSES.INACTIVE,
		PRODUCT_STATUSES.ERROR,
		PRODUCT_STATUSES.ABSENT,
	] ).isRequired,
};

ProductCard.defaultProps = {
	actionButtonLabel: 'Manage',
	icon: null,
	onDeactivate: () => {},
	onActionClick: () => {},
};

export default ProductCard;
