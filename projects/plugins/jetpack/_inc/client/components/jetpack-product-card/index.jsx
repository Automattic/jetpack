import { ProductPrice, TermsOfService } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect } from 'react';

import './style.scss';

const JetpackProductCard = props => {
	const {
		icon,
		title,
		productSlug,
		description = '',
		features = [],
		disclaimer,
		currencyCode,
		price,
		discountedPrice,
		billingDescription,
		callToAction,
		checkoutText,
		checkoutUrl,
		priority = 'primary',
		illustrationPath,
	} = props;

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

	const onDisclaimerClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_product_card_disclaimer_click', {
			type: productSlug,
		} );
	}, [ productSlug ] );

	const classes = clsx( {
		'jp-product-card': true,
		'jp-product-card--has-media': hasMedia,
		'jp-product-card--has-cta': hasCta,
	} );

	const buttonClasses = clsx( [
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

				{ features.length && (
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
					<ProductPrice
						currency={ currencyCode }
						price={ price }
						offPrice={ discountedPrice }
						showNotOffPrice={ !! discountedPrice }
						legend={ billingDescription }
					/>
				</div>

				<TermsOfService agreeButtonLabel={ checkoutText } />

				<Button className={ buttonClasses } href={ checkoutUrl } onClick={ onClick }>
					{ checkoutText }
				</Button>

				{ disclaimer && (
					<p className="jp-product-card__disclaimer">
						{ `${ disclaimer.text } ` }
						<ExternalLink
							onClick={ onDisclaimerClick }
							href={ disclaimer.url }
							target="_blank"
							rel="noopener noreferrer"
						>
							{ disclaimer.link_text }
						</ExternalLink>
					</p>
				) }
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
	discountedPrice: PropTypes.number,
	currencyCode: PropTypes.string.isRequired,
	billingDescription: PropTypes.string.isRequired,
	productSlug: PropTypes.string.isRequired,
	description: PropTypes.string,
	features: PropTypes.array,
	disclaimer: PropTypes.object,
	icon: PropTypes.element,
	callToAction: PropTypes.string,
	priority: PropTypes.string,
	illustrationPath: PropTypes.string,
};

export default JetpackProductCard;
