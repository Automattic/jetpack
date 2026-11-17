export type AnnouncementMedia = {
	/*
	 * What the media is.
	 */
	type: 'image' | 'video';

	/*
	 * Where it is served from.
	 */
	url: string;

	/*
	 * Text alternative. An empty string marks the media as decorative.
	 */
	alt: string;
};

/*
 * One record of the `jetpack` / `announcement` entity, as the REST route serves it.
 */
export type Announcement = {
	/*
	 * Namespaced identifier, `vendor/slug`. Opaque to the client.
	 */
	id: string;

	/*
	 * When it was published: ISO 8601, GMT.
	 */
	date: string;

	/*
	 * Plain text.
	 */
	title: string;

	/*
	 * Plain text, one or two sentences, or an empty string.
	 */
	excerpt: string;

	/*
	 * HTML, sanitized by the server, or an empty string.
	 */
	content: string;

	/*
	 * An image or a video shown with the announcement.
	 */
	media: AnnouncementMedia | null;

	/*
	 * URL of the full article, or an empty string.
	 */
	link: string;

	/*
	 * The channels it is published to.
	 */
	channels: string[];
};

/*
 * When the current user saw each announcement, by id: ISO 8601, GMT.
 */
export type SeenDates = Record< string, string >;
