const searchPricingSelectors = {
	getSearchPricing: state => state.searchPricing,
	getPriceBefore: state => state.searchPricing.full_price ?? 0,
	getPriceAfter: state =>
		// If discounted price is unavailable, use the full price.
		Number.isFinite( state.searchPricing.discount_price )
			? state.searchPricing.discount_price
			: this.getPriceBefore( state ),
	getPricingDiscountPercentage: state => {
		const before = this.getPriceBefore( state );
		const after = this.getPriceAfter( state );
		// Original price is less than or greater than the sale price. No discount!
		if ( before <= after ) {
			return 0;
		}
		return Math.round( ( ( before - after ) / before ) * 100 );
	},
	getPriceCurrencyCode: state => state.searchPricing.currency_code ?? 'USD',
	isNewPricing202208: state => state.searchPricing.pricing_version >= '202208',
	getPaidRequestsLimit: state => state.searchPricing.monthly_search_request_limit ?? 10000,
	getPaidRecordsLimit: state => state.searchPricing.record_limit ?? 10000,
	getAdditionalUnitQuantity: state => state.searchPricing.quantity_per_unit,
	getAdditionalUnitPrice: state => state.searchPricing.per_unit_fee / 12,
};

export default searchPricingSelectors;
