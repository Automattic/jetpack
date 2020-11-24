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
		type: "boolean",
		default: false,
	},
	content: {
		type: 'array',
		source: 'children',
		selector: 'p',
	},
};
