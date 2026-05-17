export type PodcastStatsPeriod = '7d' | '30d' | '90d' | 'all' | 'custom';

export type PodcastStatsRange = {
	from: string;
	to: string;
};

export type PodcastStatsSelection = {
	period: PodcastStatsPeriod;
	range: PodcastStatsRange;
};

export type PodcastStatsAppRow = {
	app: string;
	plays: number;
	pct: number;
};

export type PodcastStatsCountryRow = {
	country: string;
	plays: number;
	pct: number;
};

export type PodcastStatsTopEpisode = {
	post_id: number;
	title: string;
	plays: number;
};

export type PodcastStatsTopDay = {
	date: string;
	plays: number;
};

export type PodcastStatsSummaryResponse = {
	range: PodcastStatsRange;
	total_plays: number;
	by_day: Record< string, number >;
	by_app: PodcastStatsAppRow[];
	by_country: PodcastStatsCountryRow[];
	top_episodes: PodcastStatsTopEpisode[];
};

export type PodcastStatsOverviewResponse = {
	totals: {
		last_7_days: { plays: number; delta_pct: number | null };
		last_30_days: { plays: number; delta_pct: number | null };
		last_90_days: { plays: number; delta_pct: number | null };
		all_time: { plays: number };
	};
	top_day: PodcastStatsTopDay | null;
	by_app: PodcastStatsAppRow[];
	by_country: PodcastStatsCountryRow[];
	top_episodes: PodcastStatsTopEpisode[];
};

export type PodcastShowStats = PodcastStatsSummaryResponse & {
	period: PodcastStatsPeriod;
	top_day: PodcastStatsTopDay | null;
	all_time_plays: number;
};

export type PodcastEpisodeDetailStatsResponse = {
	range: PodcastStatsRange;
	total_plays: number;
	by_day: Record< string, number >;
	by_app: PodcastStatsAppRow[];
	by_country: PodcastStatsCountryRow[];
	first_play_date: string | null;
	top_day: PodcastStatsTopDay | null;
};

export type PodcastEpisodeDetailStats = PodcastEpisodeDetailStatsResponse & {
	period: PodcastStatsPeriod;
};
