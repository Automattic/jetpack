export default {
	label: {
		type: "string",
	},
	labelSlug: {
		type: "string",
	},
	timeStamp: {
		type: "string",
		default: "00:00",
	},
	showTimeStamp: {
		type: "boolen",
		default: false,
	},
	content: {
		type: 'array',
		source: 'children',
		selector: 'p',
	},
};
