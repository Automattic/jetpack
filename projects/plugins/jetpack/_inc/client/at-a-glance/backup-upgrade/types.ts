export interface BackupUpgradeBaseProps {
	/**
	 * The total number of comments for the site.
	 */
	comments: number;
	/**
	 * The total number of plugins for the site.
	 */
	plugins: number;
	/**
	 * The total number of published posts for the site.
	 */
	posts: number;
}
export interface BarChartProps extends BackupUpgradeBaseProps {
	onClosePopup: () => void;
}
