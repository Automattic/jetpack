/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { getCurrencyObject } from '@automattic/format-currency';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Button from 'components/button';
import Gridicon from 'components/gridicon';

/**
 * Style dependencies
 */
import './style.scss';

const formatPrice = ( price, currencyCode, isOldPrice = false ) => {
	const priceObject = getCurrencyObject( price, currencyCode );
	const classes = classNames( {
		'jp-product-card__raw-price': true,
		'jp-product-card__raw-price--is-old-price': isOldPrice,
	} );

	return (
		<div className={ classes }>
			<sup className="jp-product-card__currency-symbol">{ priceObject.symbol }</sup>
			<span className="jp-product-card__price-integer">{ priceObject.integer }</span>
			<sup className="jp-product-card__price-fraction">{ priceObject.fraction }</sup>
		</div>
	);
};

const JetpackProductCard = props => {
	const {
		icon,
		title,
		productSlug,
		description,
		features,
		currencyCode,
		price,
		discount,
		billingDescription,
		callToAction,
		checkoutText,
		checkoutUrl,
		priority,
		illustrationPath,
	} = props;

	const discountedPrice = discount ? ( price * ( 100 - discount ) ) / 100 : false;
	const hasMedia = !! illustrationPath;
	const hasCta = !! callToAction;

	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_product_card_view', {
			type: productSlug,
		} );
	}, [ productSlug ] );

	const onClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_product_card_checkout_click', {
			type: productSlug,
		} );
	}, [ productSlug ] );

	const classes = classNames( {
		'jp-product-card': true,
		'jp-product-card--has-media': hasMedia,
		'jp-product-card--has-cta': hasCta,
	} );

	const buttonClasses = classNames( [
		'jp-product-card__checkout',
		`jp-product-card__checkout--${ priority }`,
	] );

	return (
		<div className={ classes }>
			{ hasCta && (
				<div className="jp-product-card__cta">
					<Gridicon icon="star" /> { callToAction }
				</div>
			) }

			<div className="jp-product-card__inner">
				{ !! icon && <div className="jp-product-card__icon">{ icon }</div> }

				<h3 className="jp-product-card__title">{ title }</h3>
				<p className="jp-product-card__description">{ description }</p>

				{ features && (
					<ul className="jp-product-card__features">
						{ features.map( ( feature, key ) => (
							<li className="jp-product-card__feature" key={ key }>
								<Gridicon icon="checkmark" />
								{ feature }
							</li>
						) ) }
					</ul>
				) }

				<div className="jp-product-card__price">
					{ formatPrice( price, currencyCode, !! discountedPrice ) }
					{ !! discountedPrice && formatPrice( discountedPrice, currencyCode ) }
				</div>
				<span className="jp-product-card__price-description">{ billingDescription }</span>

				<Button className={ buttonClasses } href={ checkoutUrl } onClick={ onClick }>
					{ checkoutText }
				</Button>
			</div>

			{ hasMedia && (
				<img
					className="jp-product-card__media"
					src={ illustrationPath }
					alt={ sprintf(
						/* translators: %s: Name of a Jetpack product. */
						__( 'Graphical illustration of product: %s', 'jetpack' ),
						title
					) }
				/>
			) }
		</div>
	);
};

JetpackProductCard.propTypes = {
	checkoutText: PropTypes.string.isRequired,
	checkoutUrl: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	price: PropTypes.number.isRequired,
	currencyCode: PropTypes.string.isRequired,
	billingDescription: PropTypes.string.isRequired,
	description: PropTypes.string,
	features: PropTypes.array,
	discount: PropTypes.number,
	icon: PropTypes.element,
	callToAction: PropTypes.string,
	priority: PropTypes.string,
	illustrationPath: PropTypes.string,
};

JetpackProductCard.defaultProps = {
	arePromotionsActive: false,
	description: '',
	features: [],
	priority: 'primary',
	showIllustration: '',
};

export default JetpackProductCard;
