/**
 * Per-service traffic-attribution metadata used by the Overview traffic
 * chart. `hosts` is the set of referrer hostnames (lowercase, suffix
 * matched) we bucket into this service's series; `label` is the legend
 * caption; `stroke` is the line colour. Hex literals mirror the
 * `social-logo-colors.css` palette where possible so Publicize-supported
 * services read consistently with the connected-accounts service icons;
 * other social networks (Reddit, YouTube, …) ship with their canonical
 * brand colour so the chart can surface "you're getting traffic from
 * here, want to publish there?" as a discovery cue.
 *
 * The keys are deliberately a free-form `string` slug rather than the
 * `ConnectionService['id']` union — the chart shows any social-network
 * referrer the data contains, even when there's no Publicize integration
 * for that network.
 */
export type SocialServiceMeta = {
	hosts: string[];
	label: string;
	stroke: string;
};

export const SOCIAL_SERVICE_META: Record< string, SocialServiceMeta > = {
	bluesky: { hosts: [ 'bsky.app' ], label: 'Bluesky', stroke: '#1185fe' },
	discord: { hosts: [ 'discord.com', 'discord.gg' ], label: 'Discord', stroke: '#5865f2' },
	facebook: {
		hosts: [ 'facebook.com', 'fb.com', 'm.facebook.com', 'l.facebook.com' ],
		label: 'Facebook',
		stroke: '#0866ff',
	},
	'instagram-business': {
		hosts: [ 'instagram.com', 'l.instagram.com' ],
		label: 'Instagram',
		stroke: '#d93174',
	},
	linkedin: { hosts: [ 'linkedin.com', 'lnkd.in' ], label: 'LinkedIn', stroke: '#0976b4' },
	// Mastodon is federated; we match the major flagship instances and the
	// short-link service. Custom-instance traffic won't fold into the line
	// without an admin-defined allowlist — out of scope for PR 4.
	mastodon: {
		hosts: [ 'mastodon.social', 'mastodon.online', 'mas.to', 'mstdn.social' ],
		label: 'Mastodon',
		stroke: '#6364ff',
	},
	nextdoor: { hosts: [ 'nextdoor.com' ], label: 'Nextdoor', stroke: '#8ed500' },
	pinterest: { hosts: [ 'pinterest.com', 'pin.it' ], label: 'Pinterest', stroke: '#e60023' },
	reddit: { hosts: [ 'reddit.com', 'redd.it' ], label: 'Reddit', stroke: '#ff4500' },
	// X, Threads and TikTok are all black-branded. Three near-black lines on
	// one chart are indistinguishable, so only X keeps pure black (its most
	// iconic treatment); Threads takes a dark grey and TikTok its cyan accent
	// so the three stay legible in the chart and the legend swatches.
	threads: { hosts: [ 'threads.net', 'threads.com' ], label: 'Threads', stroke: '#454545' },
	tiktok: { hosts: [ 'tiktok.com' ], label: 'TikTok', stroke: '#25f4ee' },
	tumblr: { hosts: [ 'tumblr.com' ], label: 'Tumblr', stroke: '#35465c' },
	x: { hosts: [ 'x.com', 'twitter.com', 't.co' ], label: 'X', stroke: '#000000' },
	youtube: { hosts: [ 'youtube.com', 'youtu.be' ], label: 'YouTube', stroke: '#ff0000' },
};

/**
 * Resolve a referrer URL or hostname to a known social-service slug.
 * Matches by suffix so `m.facebook.com` and `l.facebook.com` both fold
 * into the `facebook` bucket.
 *
 * @param hostOrUrl - A hostname or full URL string from the referrers API.
 * @return The matching service slug, or `null` if the host is not a known social referrer.
 */
export function matchSocialService( hostOrUrl: string ): string | null {
	if ( ! hostOrUrl ) {
		return null;
	}
	let host = hostOrUrl.toLowerCase();
	try {
		host = new URL( host.startsWith( 'http' ) ? host : `https://${ host }` ).hostname;
	} catch {
		// Fall through with the raw string — already lowercased.
	}
	for ( const [ slug, meta ] of Object.entries( SOCIAL_SERVICE_META ) ) {
		if ( meta.hosts.some( h => host === h || host.endsWith( `.${ h }` ) ) ) {
			return slug;
		}
	}
	return null;
}
