import type { StatsArchivesItem } from './archives';
import type { StatsClicksItem } from './clicks';
import type { StatsCommentFollowersItem } from './comment-followers';
import type { StatsCommentsItem } from './comments';
import type { StatsDevicesItem } from './devices';
import type { StatsEmailBreakdownItem } from './email-breakdown';
import type { StatsEmailSummaryItem } from './email-summary';
import type { StatsFileDownloadsItem } from './file-downloads';
import type { StatsFollowersItem } from './followers';
import type { StatsLocationsItem } from './locations';
import type { StatsPublicizeItem } from './publicize';
import type { StatsReferrersItem } from './referrers';
import type { StatsSearchTermsItem } from './search-terms';
import type { StatsTagsItem } from './tags';
import type { StatsTopAuthorsItem } from './top-authors';
import type { StatsTopPostsItem } from './top-posts';
import type { StatsUtmItem } from './utm';
import type { StatsVideoPlaysItem } from './video-plays';

export type StatsNormalizedItemBase< TChild = unknown > = {
	label: unknown;
	children?: TChild[] | null;
};

export type StatsItemAction = {
	type: string;
	data: unknown;
};

export type StatsNormalizedItem =
	| StatsTopPostsItem
	| StatsDevicesItem
	| StatsReferrersItem
	| StatsClicksItem
	| StatsSearchTermsItem
	| StatsFileDownloadsItem
	| StatsTopAuthorsItem
	| StatsLocationsItem
	| StatsVideoPlaysItem
	| StatsUtmItem
	| StatsEmailSummaryItem
	| StatsEmailBreakdownItem
	| StatsArchivesItem
	| StatsCommentFollowersItem
	| StatsFollowersItem
	| StatsCommentsItem
	| StatsTagsItem
	| StatsDevicesItem
	| StatsPublicizeItem;

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
