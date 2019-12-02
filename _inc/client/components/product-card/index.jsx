/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Card from 'components/card';
import Gridicon from 'components/gridicon';
import ProductCardAction from './action';
import ProductCardPriceGroup from './price-group';

/**
 * Style dependencies
 */
import './style.scss';

class ProductCard extends Component {
	static propTypes = {
		billingTimeFrame: PropTypes.string,
		currencyCode: PropTypes.string,
		description: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element, PropTypes.node ] ),
		discountedPrice: PropTypes.oneOfType( [
			PropTypes.number,
			PropTypes.arrayOf( PropTypes.number ),
		] ),
		fullPrice: PropTypes.oneOfType( [ PropTypes.number, PropTypes.arrayOf( PropTypes.number ) ] ),
		isCurrent: PropTypes.bool,
		isPlaceholder: PropTypes.bool,
		purchase: PropTypes.object,
		subtitle: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element, PropTypes.node ] ),
		title: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element, PropTypes.node ] ),
	};

	getManagePurchaseLink( siteName, purchaseId ) {
		return `https://wordpress.com/me/purchases/${ siteName }/${ purchaseId }`;
	}

	handleManagePurchase( productSlug ) {
		return () => {
			analytics.tracks.recordJetpackClick( {
				target: 'product-card-manage-purchase',
				feature: productSlug,
			} );
		};
	}

	render() {
		const {
			billingTimeFrame,
			children,
			currencyCode,
			description,
			discountedPrice,
			fullPrice,
			isCurrent,
			isPlaceholder,
			purchase,
			subtitle,
			title,
			translate,
		} = this.props;
		const cardClassNames = classNames( 'product-card', {
			'is-placeholder': isPlaceholder,
			'is-purchased': !! purchase,
		} );

		return (
			<Card className={ cardClassNames }>
				<div className="product-card__header">
					{ title && (
						<div className="product-card__header-primary">
							{ purchase && <Gridicon icon="checkmark" size={ 18 } /> }
							<h3 className="product-card__title">{ title }</h3>
						</div>
					) }
					<div className="product-card__header-secondary">
						{ subtitle && <div className="product-card__subtitle">{ subtitle }</div> }
						{ ! purchase && (
							<ProductCardPriceGroup
								billingTimeFrame={ billingTimeFrame }
								currencyCode={ currencyCode }
								discountedPrice={ discountedPrice }
								fullPrice={ fullPrice }
							/>
						) }
					</div>
				</div>
				<div className="product-card__description">
					{ description && <p>{ description }</p> }
					{ purchase && isCurrent && (
						<ProductCardAction
							onClick={ this.handleManagePurchase( purchase.product_slug ) }
							href={ this.getManagePurchaseLink( purchase.domain, purchase.ID ) }
							label={ translate( 'Manage Subscription' ) }
							primary={ false }
						/>
					) }
				</div>
				{ children }
			</Card>
		);
	}
}

export default localize( ProductCard );
