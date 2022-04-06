/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon, starFilled as star, plus, check } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Text, { H3 } from '../text/index.jsx';
import { getIconBySlug, CheckmarkIcon } from '../product-icons/index.jsx';
import ProductPrice from '../product-price/index.jsx';
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
 * Icons composition for a bundle product,
 * based on the list of supported products.
 *
 * @param {object} props                  - Component props.
 * @param {Array} props.supportedProducts - List of supported products.
 * @returns {React.Component}               Bundle product icons react component.
 */
function BundleProductIcons( { supportedProducts } ) {
	return (
		<div className={ styles[ 'product-bundle-icons' ] }>
			{ supportedProducts.map( ( product, index ) => {
				const ProductIcon = getIconBySlug( product );
				return (
					<>
						<div key={ index * 2 }>
							<ProductIcon size={ 24 } />
						</div>
						{ index !== supportedProducts.length - 1 && (
							<Icon
								className={ styles[ 'plus-icon' ] }
								key={ `icon-plugs${ index * 2 + 1 }` }
								icon={ plus }
								size={ 16 }
							/>
						) }
					</>
				);
			} ) }
		</div>
	);
}

/**
 * Product Detail component.
 *
 * @param {object} props                  - Component props.
 * @param {string} props.slug             - Product slug.
 * @param {string} props.title 			  - Product title.
 * @param {string} props.description      - Product description.
 * @param {Array}  props.features         - Features list of the product.
 * @param {boolean} props.isBundle        - Whether or not the product is a bundle.
 * @param {Array} props.supportedProducts - List of supported products (for bundles).
 * @param {string} props.className        - A className to be concat with default ones.
 * @param {Object} props.pricing 	      - Product Pricing object.
 * @param {boolean} props.hasRequiredPlan - Whether or not the product has the required plan.
 * @returns {React.Component}               ProductDetailCard react component.
 */
const ProductDetailCard = ( {
	className,
	slug,
	title,
	description,
	features,
	isBundle,
	supportedProducts,
	pricing,
	hasRequiredPlan,
} ) => {
	const { isFree, price, currency, offPrice } = pricing;

	const needsPurchase = ! isFree && ! hasRequiredPlan;

	return (
		<div
			className={ classnames( styles.wrapper, className, {
				[ styles[ 'is-bundle-card' ] ]: isBundle,
			} ) }
		>
			{ isBundle && <ProductDetailCardHeader /> }

			<div className={ styles[ 'card-container' ] }>
				{ isBundle && <BundleProductIcons slug={ slug } supportedProducts={ supportedProducts } /> }
				<H3>{ title }</H3>
				<Text mb={ 3 }>{ description }</Text>
			</div>

			<ul className={ styles.features }>
				{ features.map( ( feature, id ) => (
					<Text component="li" key={ `feature-${ id }` } variant="body">
						<Icon icon={ check } size={ 24 } className={ styles.check } />
						{ feature }
					</Text>
				) ) }
			</ul>

			{ needsPurchase && (
				<ProductPrice price={ price } offPrice={ offPrice } currency={ currency } />
			) }

			{ isFree && <H3>{ __( 'Free', 'jetpack' ) }</H3> }

			{ isBundle && hasRequiredPlan && (
				<div className={ styles[ 'product-has-required-plan' ] }>
					<CheckmarkIcon size={ 36 } />
					<Text>{ __( 'Active on your site', 'jetpack' ) }</Text>
				</div>
			) }
		</div>
	);
};

ProductDetailCard.propTypes = {
	slug: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	title: PropTypes.string,
	description: PropTypes.string,
	features: PropTypes.arrayOf( PropTypes.string ),
	pricing: PropTypes.object,
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
	pricing: {},
};

export default ProductDetailCard;
