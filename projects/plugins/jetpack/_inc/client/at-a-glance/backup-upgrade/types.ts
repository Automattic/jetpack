export interface BackupUpgradeBaseProps {
	comments: number;
	plugins: number;
	posts: number;
}
export interface BarChartProps extends BackupUpgradeBaseProps {
	onClosePopup: () => void;
}
