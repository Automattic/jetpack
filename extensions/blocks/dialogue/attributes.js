export default {
	speaker: {
		type: "string",
	},
	speakerSlug: {
		type: "string",
	},
	color: {
		type: "string",
	},
	backgroundColor: {
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
	placeholder: {
		type: "string",
	},
};
