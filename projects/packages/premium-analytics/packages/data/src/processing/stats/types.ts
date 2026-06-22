export type StatsItemAction = {
	type: string;
	data: unknown;
};

export type StatsNormalizedItemBase< TChild = unknown > = {
	label: unknown;
	children?: TChild[] | null;
};

export interface StatsTopPostsItem extends StatsNormalizedItemBase< StatsTopPostsItem > {
	id?: string | number;
	views: number;
	link: string | null;
	page?: string | null;
	public?: unknown;
	type?: unknown;
	date?: unknown;
	status?: unknown;
	video_play?: unknown;
	actions?: StatsItemAction[];
}

export interface StatsReferrersItem extends StatsNormalizedItemBase< StatsReferrersItem > {
	views: number;
	link: string | null;
	icon: string | null;
	labelIcon: string | null;
	actions?: StatsItemAction[];
	actionMenu?: number;
}

export interface StatsClicksItem extends StatsNormalizedItemBase< StatsClicksItem > {
	views: number;
	link: string | null;
	icon: string | null;
	labelIcon: string | null;
}

export type StatsSearchTermsItem = StatsNormalizedItemBase & {
	views: number;
	className: string;
	children: null;
};

export type StatsFileDownloadsItem = StatsNormalizedItemBase & {
	downloads: number;
	shortLabel?: string;
	link?: string;
	linkTitle: unknown;
	labelIcon: string;
	children: null;
};

export type StatsTopAuthorsItem = StatsNormalizedItemBase< StatsTopPostsItem > & {
	views: number;
	icon: string | null;
	iconClassName?: string;
	className?: string | null;
};

export type StatsLocationsItem = StatsNormalizedItemBase & {
	views: number;
	countryCode?: string;
	countryFull?: string;
	region?: string;
	coordinates?: unknown;
	children: null;
};

export type StatsVideoPlaysItem = StatsNormalizedItemBase & {
	id?: string | number;
	plays: number;
	impressions: number;
	watch_time: number;
	retention_rate: number;
	link: string | null;
	children: null;
};

export type StatsNormalizedItem =
	| StatsTopPostsItem
	| StatsReferrersItem
	| StatsClicksItem
	| StatsSearchTermsItem
	| StatsFileDownloadsItem
	| StatsTopAuthorsItem
	| StatsLocationsItem
	| StatsVideoPlaysItem;

export type StatsNormalizedDataPoint< TItem extends StatsNormalizedItem = StatsNormalizedItem > = {
	time_interval: string;
	date_start: string;
	date_end: string;
	items: TItem[];
	[ key: string ]: unknown;
};

export type StatsNormalizedSummary = {
	date_start?: string;
	date_end?: string;
	[ key: string ]: unknown;
};

export type StatsNormalizedReport< TItem extends StatsNormalizedItem = StatsNormalizedItem > = {
	summary: StatsNormalizedSummary;
	data: Array< StatsNormalizedDataPoint< TItem > >;
};

export type StatsRecord = Record< string, unknown >;
export type StatsIntervalFields = Pick<
	StatsNormalizedDataPoint,
	'time_interval' | 'date_start' | 'date_end'
>;
