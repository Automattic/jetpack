
export const getPaidPlanLink = () => {
	const siteSlug = location.hostname;
	return 'https://wordpress.com/earn/payments-plans/' + siteSlug + '#add-new-payment-plan';
};
