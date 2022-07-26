import { getCurrencyObject } from '@automattic/format-currency';
import { Button } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { PricingCardProps } from './types';
import type { CurrencyObject } from '@automattic/format-currency/src/types';
import type React from 'react';

import './style.scss';

/**
 * Whether or not to display a price's decimal part in the UI.
 * Needed as `getCurrencyObject` will always return the decimal part populated even if it
 * doesn't exist.
 *
 * @param {CurrencyObject} currencyObject -- A currency object returned from `getCurrencyObject`.
 * @returns {boolean} Whether or not to display the price decimal part.
 */
const showPriceDecimals = ( currencyObject: CurrencyObject ): boolean => {
	return currencyObject.fraction.indexOf( '00' ) === -1;
};

/**
 * The Pricing card component.
 *
 * @param {PricingCardProps} props -- The component props.
 * @returns {React.ReactNode} The rendered component.
 */
const PricingCard: React.FC< PricingCardProps > = ( {
	currencyCode = 'USD',
	priceDetails = __( '/month, paid yearly', 'jetpack' ),
	...props
} ) => {
	const currencyObjectBefore = getCurrencyObject( props.priceBefore, currencyCode );
	const currencyObjectAfter = getCurrencyObject( props.priceAfter, currencyCode );

	return (
		<div className="jp-components__pricing-card">
			{ props.icon && (
				<div className="jp-components__pricing-card__icon">
					<img
						src={ props.icon }
						alt={ sprintf(
							/* translators: placeholder is a product name */
							__( 'Icon for the product %s', 'jetpack' ),
							props.title
						) }
					/>
				</div>
			) }
			<h1 className="jp-components__pricing-card__title">{ props.title }</h1>
			<div className="jp-components__pricing-card__pricing">
				{ props.priceBefore !== props.priceAfter && (
					<div className="jp-components__pricing-card__price-before">
						<span className="jp-components__pricing-card__currency">
							{ currencyObjectBefore.symbol }
						</span>
						<span className="jp-components__pricing-card__price">
							{ currencyObjectBefore.integer }
						</span>
						{ showPriceDecimals( currencyObjectBefore ) && (
							<span className="jp-components__pricing-card__price-decimal">
								{ ' ' }
								{ currencyObjectBefore.fraction }
							</span>
						) }
						<div className="jp-components__pricing-card__price-strikethrough"></div>
					</div>
				) }
				<div className="jp-components__pricing-card__price-after">
					<span className="jp-components__pricing-card__currency">
						{ currencyObjectAfter.symbol }
					</span>
					<span className="jp-components__pricing-card__price">
						{ currencyObjectAfter.integer }
					</span>
					{ showPriceDecimals( currencyObjectAfter ) && (
						<span className="jp-components__pricing-card__price-decimal">
							{ currencyObjectAfter.fraction }
						</span>
					) }
				</div>
				<span className="jp-components__pricing-card__price-details">{ priceDetails }</span>
			</div>

			{ props.children && (
				<div className="jp-components__pricing-card__extra-content-wrapper">{ props.children }</div>
			) }

			{ props.ctaText && (
				<div className="jp-components__pricing-card__cta">
					<Button
						className="jp-components__pricing-card__button"
						label={ props.ctaText }
						onClick={ props.onCtaClick }
					>
						{ props.ctaText }
					</Button>
				</div>
			) }

			{ props.infoText && (
				<div className="jp-components__pricing-card__info">{ props.infoText }</div>
			) }
		</div>
	);
};

export default PricingCard;
