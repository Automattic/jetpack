export type PodcatcherId =
	| 'pocketcasts'
	| 'apple'
	| 'spotify'
	| 'youtube'
	| 'amazon'
	| 'podcastindex';

export type PodcastShowUrls = Record< PodcatcherId, string >;

export interface PodcastSettings {
	podcasting_category_id: number;
	podcasting_title: string;
	podcasting_talent_name: string;
	podcasting_summary: string;
	podcasting_copyright: string;
	podcasting_explicit: boolean;
	podcasting_image: string;
	podcasting_image_id: number;
	podcasting_category_1: string;
	podcasting_category_2: string;
	podcasting_category_3: string;
	podcasting_email: string;
	podcasting_show_urls: PodcastShowUrls;
}

// `podcasting_show_urls` is Partial because the server merges patches into the
// stored map — callers can send `{ apple: 'url' }` without touching siblings.
export type PodcastSettingsUpdate = Partial< Omit< PodcastSettings, 'podcasting_show_urls' > > & {
	podcasting_show_urls?: Partial< PodcastShowUrls >;
};

export interface Episode {
	id: number;
	date: string;
	modified: string;
	slug: string;
	status: 'publish' | 'future' | 'draft' | 'pending' | 'private';
	link: string;
	title: { rendered: string };
	excerpt: { rendered: string };
	featured_media: number;
	categories: number[];
	_embedded?: {
		'wp:featuredmedia'?: Array< {
			id: number;
			source_url: string;
			media_details?: {
				sizes?: Record< string, { source_url: string } >;
			};
		} >;
	};
}

export interface EpisodeStats {
	post_id: number;
	duration_seconds: number;
	plays_all: number;
	plays_7d: number;
	plays_30d: number;
	plays_90d: number;
}

export type TabName = 'settings' | 'episodes' | 'distribution';
