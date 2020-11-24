export default {
	label: {
		type: "string",
		default: "new",
	},
	labelSlug: {
		type: "string",
		default: "new",
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
