import save from '../../save';

export default {
	attributes: {
		newPlanName: {
			type: 'string',
			default: 'Monthly Subscription',
		},
		newPlanCurrency: {
			type: 'string',
			default: 'USD',
		},
		newPlanPrice: {
			type: 'number',
			default: 5,
		},
		newPlanInterval: {
			type: 'string',
			default: '1 month',
		},
		selectedPlanId: {
			type: 'number',
			default: 0,
		},
		isPreview: {
			type: 'boolean',
			default: false,
		},
		isPremiumContentChild: {
			type: 'boolean',
			default: true,
		},
	},
	isEligible: attributes => 'selectedPlanId' in attributes,
	migrate: attributes => {
		const { selectedPlanId, ...rest } = attributes;
		const selectedPlanIds = selectedPlanId ? [ selectedPlanId ] : [];
		return { ...rest, selectedPlanIds };
	},
	save,
};
