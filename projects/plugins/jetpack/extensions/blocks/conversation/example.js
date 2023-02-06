import { __ } from '@wordpress/i18n';

const participants = [
	{
		slug: 'participant-0',
		label: 'Rosalind',
	},
	{
		slug: 'participant-1',
		label: 'Orlando',
	},
];

const template = [
	{
		name: 'core/heading',
		attributes: {
			content: __( 'Shakespeare text', 'jetpack' ),
			level: 4,
		},
	},
	{
		name: 'jetpack/dialogue',
		attributes: {
			...participants[ 0 ],
			content: __(
				'O, my dear Orlando, how it grieves me to see thee wear thy heart in a scarf!',
				'jetpack'
			),
			timestamp: '00:10',
		},
	},
	{
		name: 'jetpack/dialogue',
		attributes: {
			...participants[ 1 ],
			content: __( 'It is my arm.', 'jetpack' ),
			timestamp: '00:15',
		},
	},
	{
		name: 'jetpack/dialogue',
		attributes: {
			...participants[ 0 ],
			content: __( 'I thought thy heart had been wounded with the claws of a lion.', 'jetpack' ),
			timestamp: '00:32',
		},
	},
	{
		name: 'jetpack/dialogue',
		attributes: {
			...participants[ 1 ],
			content: __( 'Wounded it is, but with the eyes of a lady.', 'jetpack' ),
			timestamp: '00:37',
		},
	},
];

export default {
	attributes: {
		participants,
		showTimestamps: true,
		className: 'is-style-row',
	},
	innerBlocks: template,
};
