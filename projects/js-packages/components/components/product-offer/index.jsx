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
import Text, { H3, Title } from '../text/index.jsx';
import { getIconBySlug, CheckmarkIcon } from '../product-icons/index.jsx';
import ProductPrice from '../product-price/index.jsx';
import styles from './style.module.scss';
import Button from '../button/index.jsx';
import Alert from '../alert/index.jsx';

/**
 * Product Detail Card Header component.
 *
 * @param {object} props       - Component props.
 * @param {string} props.title - Product title.
 * @returns {React.Component}  ProductOfferHeader react component.
 */
function ProductOfferHeader( { title = __( 'Popular upgrade', 'jetpack' ) } ) {
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
 * @param {object} props         - Component props.
 * @param {Array} props.icon     - Custom icon slug.
 * @param {Array} props.products - List of supported products.
 * @returns {React.Component}      Bundle product icons react component.
 */
function CardIcons( { products, icon } ) {
	if ( icon ) {
		const CustomIcon = getIconBySlug( icon );
		return (
			<div className={ styles[ 'product-bundle-icons' ] }>
				<CustomIcon size={ 32 } />
			</div>
		);
	}

	return (
		<div className={ styles[ 'product-bundle-icons' ] }>
			{ products.map( ( product, index ) => {
				const ProductIcon = getIconBySlug( product );
				const ProIcon = ProductIcon ? ProductIcon : () => null;

				return (
					<Fragment key={ index }>
						<ProIcon size={ 24 } />

						{ index !== products.length - 1 && (
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
 * @param {string} props.icon 	          - Custom Icon slug.
 * @param {string} props.title            - Product title.
 * @param {string} props.subTitle         - Product sub-title.
 * @param {string} props.description      - Product description.
 * @param {Array}  props.features         - Features list of the product.
 * @param {boolean} props.isCard          - Add the styles to look like a card.
 * @param {boolean} props.isBundle        - Whether or not the product is a bundle.
 * @param {Array} props.supportedProducts - List of supported products (for bundles).
 * @param {Object} props.pricing          - Product Pricing object.
 * @param {boolean} props.hasRequiredPlan - Whether or not the product has the required plan.
 * @param {boolean} props.isLoading       - Applies the isLoading style to the component.
 * @param {string} props.className        - A className to be concat with default ones.
 * @param {Function} props.onAdd          - Callback function to be executed on click on Add button.
 * @param {string} props.addProductUrl    - The checkout URL to add/buy the product.
 * @param {string} props.buttonText       - The text to be displayed on the Add button.
 * @param {string} props.error            - Error message.
 * @returns {React.Component}               ProductOffer react component. Optional.
 */
const ProductOffer = ( {
	className,
	slug,
	title,
	icon,
	subTitle,
	description,
	features,
	isCard,
	isBundle,
	supportedProducts,
	pricing,
	hasRequiredPlan,
	onAdd,
	addProductUrl,
	isLoading,
	buttonText,
	error,
} ) => {
	const { isFree, price, currency, offPrice } = pricing;
	const needsPurchase = ! isFree && ! hasRequiredPlan;

	const defautlButtonText = sprintf(
		/* translators: placeholder is product name. */
		__( 'Add %s', 'jetpack' ),
		title
	);

	return (
		<div
			className={ classnames( styles.wrapper, className, {
				[ styles[ 'is-bundle-card' ] ]: isBundle,
				[ styles[ 'is-card' ] ]: isCard || isBundle, // is card when is bundle.
			} ) }
		>
			{ isBundle && <ProductOfferHeader /> }

			<div className={ styles[ 'card-container' ] }>
				<CardIcons
					slug={ slug }
					icon={ icon }
					products={ supportedProducts?.length ? supportedProducts : [ slug ] }
				/>
				<H3>{ title }</H3>
				{ subTitle && <Title mb={ 3 }>{ subTitle }</Title> }
				{ description && <Text mb={ 3 }>{ description }</Text> }

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
						onClick={ addProductUrl ? null : onAdd }
						isLoading={ isLoading }
						disabled={ isLoading }
						variant={ isLoading || ! isBundle ? 'primary' : 'secondary' }
						className={ styles[ 'add-button' ] }
						{ ...( addProductUrl ? { href: addProductUrl } : {} ) }
					>
						{ buttonText || defautlButtonText }
					</Button>
				) }

				{ isBundle && hasRequiredPlan && (
					<div className={ styles[ 'product-has-required-plan' ] }>
						<CheckmarkIcon size={ 36 } />
						<Text>{ __( 'Active on your site', 'jetpack' ) }</Text>
					</div>
				) }

				{ error && <Alert level="error">{ error } </Alert> }
			</div>
		</div>
	);
};

ProductOffer.propTypes = {
	slug: PropTypes.string.isRequired,
	name: PropTypes.string,

	/** Custom icon slug */
	icon: PropTypes.string,
	/** Product title. Primary heading */
	title: PropTypes.string,

	/** Product subtitle. Secondary heading */
	subTitle: PropTypes.string,
	description: PropTypes.string,
	features: PropTypes.arrayOf( PropTypes.string ),
	pricing: PropTypes.object,
	isCard: PropTypes.bool,
	isBundle: PropTypes.bool,
	supportedProducts: PropTypes.arrayOf( PropTypes.string ),
	className: PropTypes.string,
	hasRequiredPlan: PropTypes.bool,
	isLoading: PropTypes.bool,
	onAdd: PropTypes.func,
	error: PropTypes.string,
	addProductUrl: PropTypes.string,

	/** Custom text for the onAdd product button. */
	buttonText: PropTypes.string,
};

ProductOffer.defaultProps = {
	trackButtonClick: () => {},
	title: '',
	subTitle: '',
	isBundle: false,
	pricing: {},
	onAdd: () => {},
	isLoading: false,
	buttonText: '',
	error: '',
};

export default ProductOffer;
