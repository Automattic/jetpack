import INNER_BLOCKS_DEPRECATION from '../shared/deprecations/inner-blocks-deprecation';

export default [
	{
		...INNER_BLOCKS_DEPRECATION,
		attributes: {
			...INNER_BLOCKS_DEPRECATION.attributes,
			label: { type: 'string', default: 'Number' },
			max: { type: 'string' },
			min: { type: 'string' },
		},
	},
];
