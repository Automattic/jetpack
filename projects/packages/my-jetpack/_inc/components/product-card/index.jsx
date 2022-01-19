/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * Wordpress dependencies
 */
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

const ProductCard = ( {
	name,
	description,
	icon,
	status,
	actionButtonLabel,
	onDeactivate,
	onActionClick,
} ) => {
	const statusClassName = classNames( styles.status, {
		[ styles.active ]: status === PRODUCT_STATUSES.ACTIVE,
		[ styles.inactive ]: status === PRODUCT_STATUSES.INACTIVE,
		[ styles.error ]: status === PRODUCT_STATUSES.ERROR,
		[ styles.absent ]: status === PRODUCT_STATUSES.ABSENT,
	} );

	return (
		<div className={ styles.container }>
			<div className={ styles.name }>
				<span>{ name }</span>
				{ icon }
			</div>
			<p className={ styles.description }>{ description }</p>
			<div className={ styles.actions }>
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
								title: 'Deactivate',
								icon: null,
								onClick: onDeactivate,
							},
						] }
					/>
				</ButtonGroup>
				<div className={ statusClassName }>Active</div>
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
