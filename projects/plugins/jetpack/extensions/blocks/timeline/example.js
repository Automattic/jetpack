import { __ } from '@wordpress/i18n';

const example = {
	innerBlocks: [
		{
			name: 'jetpack/timeline-item',
			innerBlocks: [
				{
					name: 'core/heading',
					attributes: {
						content: __( 'Spring', 'jetpack' ),
					},
				},
			],
		},
		{
			name: 'jetpack/timeline-item',
			innerBlocks: [
				{
					name: 'core/heading',
					attributes: {
						content: __( 'Summer', 'jetpack' ),
					},
				},
			],
		},
		{
			name: 'jetpack/timeline-item',
			innerBlocks: [
				{
					name: 'core/heading',
					attributes: {
						content: __( 'Fall', 'jetpack' ),
					},
				},
			],
		},
		{
			name: 'jetpack/timeline-item',
			innerBlocks: [
				{
					name: 'core/heading',
					attributes: {
						content: __( 'Winter', 'jetpack' ),
					},
				},
			],
		},
	],
};

export default example;
