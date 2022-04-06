/**
 * External dependencies
 */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon, starFilled as star, plus, check } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Text, { H3 } from '../text/index.jsx';
import { getIconBySlug, CheckmarkIcon } from '../product-icons/index.jsx';
import ProductPrice from '../product-price/index.jsx';
import styles from './style.module.scss';
import Button from '../button/index.jsx';

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
function ProductIcons( { supportedProducts } ) {
	return (
		<div className={ styles[ 'product-bundle-icons' ] }>
			{ supportedProducts.map( ( product, index ) => {
				const ProductIcon = getIconBySlug( product );
				return (
					<Fragment key={ index }>
						<ProductIcon size={ 24 } />

						{ index !== supportedProducts.length - 1 && (
							<Icon
								className={ styles[ 'plus-icon' ] }
								key={ `icon-plugs${ index * 2 + 1 }` }
								icon={ plus }
								size={ 16 }
							/>
						) }
					</Fragment>
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
 * @param {Object} props.pricing 	      - Product Pricing object.
 * @param {boolean} props.hasRequiredPlan - Whether or not the product has the required plan.
 * @param {boolean} props.isLoading       - Applies the isLoading style to the component.
 * @param {string} props.className        - A className to be concat with default ones.
 * @param {Function} props.onAdd          - Callback function to be executed on click on Add button.
 * @param {string} props.href             - The URL to be used for the Add button.
 * @returns {React.Component}               ProductDetailCard react component. Optional.
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
	onAdd,
	href,
	isLoading,
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
				<ProductIcons slug={ slug } supportedProducts={ supportedProducts || [ slug ] } />
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

			{ ( ! isBundle || ( isBundle && ! hasRequiredPlan ) ) && (
				<Button
					onClick={ onAdd }
					isLoading={ isLoading }
					disabled={ isLoading }
					variant={ isBundle ? 'secondary' : 'primary' }
					href={ onAdd ? undefined : href }
					className={ styles[ 'add-button' ] }
				>
					{
						/* translators: placeholder is product name. */
						sprintf( __( 'Add %s', 'jetpack' ), title )
					}
				</Button>
			) }

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
	isLoading: PropTypes.bool,
	onAdd: PropTypes.func,
	href: PropTypes.string,
};

ProductDetailCard.defaultProps = {
	trackButtonClick: () => {},
	isBundle: false,
	supportedProducts: [],
	pricing: {},
	onAdd: () => {},
	isLoading: false,
};

export default ProductDetailCard;
