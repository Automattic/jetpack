const participants = [
	{
		participantSlug: 'participant-0',
		participant: 'Oliveira',
		hasBoldStyle: true,
	},
	{
		participantSlug: 'participant-1',
		participant: 'la Maga',
		hasBoldStyle: true,
	},
];

const template = [
	{
		name: 'core/heading',
		attributes: {
			content: 'Rayuela (Fragmento)',
			level: 4,
		},
	},
	{
		name: 'jetpack/dialogue',
		attributes: {
			...participants[ 0 ],
			content: '¿Qué entendés por snob?',
			timestamp: '00:10',
		},
	},
	{
		name: 'jetpack/dialogue',
		attributes: {
			...participants[ 1 ],
			content: 'Bueno,yo me vine en tercera clase, pero creo que si hubiera venido en segunda Luciana hubiera ido a despedirme.',
			timestamp: '00:15',
		},
	},
	{
		name: 'jetpack/dialogue',
		attributes: {
			...participants[ 0 ],
			content: 'La mejor definición que he oído nunca.',
			timestamp: '00:32',
		},
	},
	{
		name: 'jetpack/dialogue',
		attributes: {
			...participants[ 1 ],
			content: 'Y además estaba Rocamadour.',
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