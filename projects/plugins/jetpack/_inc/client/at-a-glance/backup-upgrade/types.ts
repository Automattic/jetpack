export interface BarChartBaseProps {
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
export type BarChartProps = BarChartBaseProps & {
	onClosePopup: () => void;
};

export type BackupUpgradeProps = BarChartBaseProps & {
	isFetchingData: boolean;
};

export type PopupProps = Omit< BarChartProps, 'plugins' >;
