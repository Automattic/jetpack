export interface BoostScoreBarProps {
	score: number;
	prevScore?: number;
	isLoading: boolean;
	showPrevScores: boolean;
	active: boolean;
	scoreBarType: 'mobile' | 'desktop';
	noBoostScoreTooltip: string | null;
}
