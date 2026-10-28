export type TopPlatformsAttributes = {
	/**
	 * Device dimension to rank: browsers or operating systems.
	 */
	platformDimension?: 'browser' | 'platform';
};

/**
 * Shows Browser and OS breakdown as a ranked leaderboard. The active
 * dimension is `platformDimension` (`relevance: 'high'`), so the widget host
 * renders its control.
 */
export default {
	example: {
		attributes: {
			platformDimension: 'browser',
		},
	},
};
