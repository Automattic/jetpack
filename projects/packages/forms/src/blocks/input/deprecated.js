export default [
	{
		attributes: {
			placeholder: {
				type: 'string',
				default: '',
			},
			type: { type: 'string' },
			min: { type: 'string' },
			max: { type: 'string' },
		},
		supports: {
			reusable: false,
			html: false,
		},
		save: () => null,
		migrate: attributes => {
			const { min, max, ...restAttributes } = attributes;
			return {
				...restAttributes,
				min: min != null && min !== '' ? parseFloat( min ) : undefined,
				max: max != null && max !== '' ? parseFloat( max ) : undefined,
			};
		},
		isEligible: attributes => {
			return typeof attributes.min === 'string' || typeof attributes.max === 'string';
		},
	},
];
