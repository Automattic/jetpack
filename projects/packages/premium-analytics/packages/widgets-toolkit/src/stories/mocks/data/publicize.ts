/**
 * Mock Stats "publicize" response for the Reach widget. The shape matches what
 * `sanitizeStatsPublicizeResponse` reads (`{ services: [ { service, followers } ] }`);
 * follower counts are chosen so the ranked list interleaves the social services
 * with the WordPress.com / Email totals from the followers mock.
 */
export const mockStatsPublicizeData = {
	services: [
		{ service: 'facebook', followers: 24 },
		{ service: 'twitter', followers: 15 },
		{ service: 'linkedin', followers: 9 },
		{ service: 'tumblr', followers: 4 },
	],
};
