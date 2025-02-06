import { __ } from '@wordpress/i18n';

const example = {
	innerBlocks: [
		{
			name: 'jetpack/timeline-item',
			innerBlocks: [
				{
					name: 'core/heading',
					attributes: {
						content: __( 'Spring', 'jetpack-mu-wpcom' ),
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
						content: __( 'Summer', 'jetpack-mu-wpcom' ),
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
						content: __( 'Fall', 'jetpack-mu-wpcom' ),
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
						content: __( 'Winter', 'jetpack-mu-wpcom' ),
					},
				},
			],
		},
	],
};

export default example;
