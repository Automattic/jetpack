const WOOADS_OPT_IN_URL = 'https://public-api.wordpress.com/me/wooads/opted';

export const isBlogOptInWooAds = () => {
	return window.wooAdsInitialState.wooAdsOptedIn || false;
};

export const setAutoRenewCampaign = async ( blogId, doRenew ) => {
	const params = {};
	await fetch( `${ WOOADS_OPT_IN_URL }?blogId=${ blogId }&ar=${ doRenew ? 1 : 0 }`, params );
};

export const getWooAdsUserCampaigns = () => {
	return window.wooAdsInitialState.campaigns || [];
};
