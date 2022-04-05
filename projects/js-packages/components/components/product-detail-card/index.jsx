/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon, starFilled as star } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import Text from '../text';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

/**
 * Product Detail Card Header component.
 *
 * @param {object} props       - Component props.
 * @param {string} props.title - Product title.
 * @returns {React.Component}  ProductDetailCardHeader react component.
 */
function ProductDetailCardHeader( { title = __( 'Popular upgrade', 'jetpack' ) } ) {
	return (
		<div className={ styles[ 'card-header' ] }>
			<Icon icon={ star } className={ styles[ 'product-bundle-icon' ] } size={ 24 } />
			<Text variant="label">{ title }</Text>
		</div>
	);
}

/**
 * Product Detail component.
 *
 * @param {object} props                 - Component props.
 * @param {boolean} props.isBundle       - Whether or not the product is a bundle.
 * @param {string} props.className       - A className to be concat with default ones
 * @returns {React.Component}              ProductDetailCard react component.
 */
const ProductDetailCard = ( { className, isBundle } ) => {
	return (
		<div
			className={ classnames( styles.wrapper, className, {
				[ styles[ 'is-bundle-card' ] ]: isBundle,
			} ) }
		>
			{ isBundle && <ProductDetailCardHeader /> }
			<div className={ styles[ 'card-container' ] }></div>
		</div>
	);
};

ProductDetailCard.propTypes = {
	slug: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	title: PropTypes.string,
	description: PropTypes.string,
	features: PropTypes.arrayOf( PropTypes.string ),
	pricingForUi: PropTypes.object,
	isBundle: PropTypes.bool,
	supportedProducts: PropTypes.arrayOf( PropTypes.string ),
	className: PropTypes.string,
	hasRequiredPlan: PropTypes.bool,
	isFree: PropTypes.bool,
};

ProductDetailCard.defaultProps = {
	trackButtonClick: () => {},
	isBundle: false,
	supportedProducts: [],
};

export default ProductDetailCard;
