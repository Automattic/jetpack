const participants = [
	{
		participantSlug: 'participant-0',
		participant: 'Rosalind',
		hasBoldStyle: true,
		hasUppercaseStyle: true,
	},
	{
		participantSlug: 'participant-1',
		participant: 'Orlando',
		hasItalicStyle: true,
		hasUppercaseStyle: true,
	},
];

const template = [
	{
		name: 'core/heading',
		attributes: {
			content: 'Shakespeare text',
			level: 4,
		},
	},
	{
		name: 'jetpack/dialogue',
		attributes: {
			...participants[ 0 ],
			content: 'O, my dear Orlando, how it grieves me to see thee wear thy heart in a scarf!',
			timestamp: '00:10',
		},
	},
	{
		name: 'jetpack/dialogue',
		attributes: {
			...participants[ 1 ],
			content: 'It is my arm.',
			timestamp: '00:15',
		},
	},
	{
		name: 'jetpack/dialogue',
		attributes: {
			...participants[ 0 ],
			content: 'I thought thy heart had been wounded with the claws of a lion.',
			timestamp: '00:32',
		},
	},
	{
		name: 'jetpack/dialogue',
		attributes: {
			...participants[ 1 ],
			content: 'Wounded it is, but with the eyes of a lady.',
			timestamp: '00:37',
		},
	},
];

export default {
	attributes: {
		participants,
		showTimestamps: true,
		className: 'is-style-column',
	},
	innerBlocks: template,
};