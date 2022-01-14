/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import { ButtonGroup, Button, DropdownMenu } from '@wordpress/components';

export const PRODUCT_STATUSES = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
	ERROR: 'error',
	ABSENT: 'absent',
};

const DownIcon = () => (
	<svg width="15" height="9" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="10 9 4 7">
		<path
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="m18.004 10.555-6.005 5.459-6.004-5.459 1.009-1.11 4.995 4.542 4.996-4.542 1.009 1.11Z"
			fill="#fff"
		/>
	</svg>
);

const ProductCard = ( {
	productName,
	productDescription,
	productIcon,
	actionButtonLabel,
	onDeactivate,
	onActionClick,
} ) => {
	return (
		<div className={ styles.container }>
			<div className={ styles.name }>
				<span>{ productName }</span>
				{ productIcon }
			</div>
			<p className={ styles.description }>{ productDescription }</p>
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
				<div className={ styles.status }>Active</div>
			</div>
		</div>
	);
};

ProductCard.propTypes = {
	productName: PropTypes.string.isRequired,
	productDescription: PropTypes.string.isRequired,
	productIcon: PropTypes.element,
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
	productIcon: null,
	onDeactivate: () => {},
	onActionClick: () => {},
};

export default ProductCard;
