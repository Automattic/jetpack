const searchPricingSelectors = {
	getSearchPricing: state => state.searchPricing,
	getPriceBefore: state => state.searchPricing.full_price ?? 0,
	getPriceAfter: state => state.searchPricing.discount_price ?? 0,
	getPriceCurrencyCode: state => state.searchPricing.currency_code ?? 'USD',
};

export default searchPricingSelectors;
