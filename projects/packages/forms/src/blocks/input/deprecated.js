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
			const parsedMin = parseFloat( min );
			const parsedMax = parseFloat( max );
			return {
				...restAttributes,
				min: Number.isFinite( parsedMin ) ? parsedMin : undefined,
				max: Number.isFinite( parsedMax ) ? parsedMax : undefined,
			};
		},
		isEligible: attributes => {
			return typeof attributes.min === 'string' || typeof attributes.max === 'string';
		},
	},
];
