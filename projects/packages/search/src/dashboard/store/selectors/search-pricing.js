const searchPricingSelectors = {
	getSearchPricing: state => state.searchPricing,
	getPriceBefore: state => state.searchPricing.full_price ?? 0,
	getPriceAfter: state => state.searchPricing.discount_price ?? 0,
	getPriceCurrencyCode: state => state.searchPricing.currency_code ?? 'USD',
	isNewPricing202208: state => state.searchPricing.pricing_version >= '202208',
	getPaidRequestsLimit: state => state.searchPricing.monthly_search_request_limit ?? 10000,
	getPaidRecordsLimit: state => state.searchPricing.record_limit ?? 10000,
	getAdditionalUnitQuantity: state => state.searchPricing.quantity_per_unit,
	getAdditionalUnitFee: state => state.searchPricing.per_unit_fee,
};

export default searchPricingSelectors;
