/*
 * The types are manually defined here because zod is not able to infer the types from the schema without making the properties optional.
 * Discussion: p1702283674728769-slack-C016BBAFHHS
 *
 * TODO: Ones we have enabled strictNullChecks in our codebase, we can remove the manual types and use the ones from the zod schema.
 */

export type Period = {
	timestamp: number;
	dimensions: {
		desktop_overall_score: number;
		desktop_lcp: number;
		desktop_cls: number;
		desktop_tbt: number;
		mobile_overall_score: number;
		mobile_lcp: number;
		mobile_cls: number;
		mobile_tbt: number;
	};
};

export type Annotation = {
	timestamp: number;
	text: string;
};

export type PerformanceHistoryData = {
	periods: Period[];
	annotations: Annotation[];
	startDate: number;
	endDate: number;
};
