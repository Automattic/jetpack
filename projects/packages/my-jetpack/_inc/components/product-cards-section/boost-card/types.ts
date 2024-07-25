import type { FC } from 'react';

export type SpeedScores = Window[ 'myJetpackInitialState' ][ 'latestBoostSpeedScores' ];

interface BoostSpeedScoreProps {
	shouldShowTooltip: boolean;
	onTooltipClicked: () => void;
}

export type BoostSpeedScoreType = FC< BoostSpeedScoreProps >;
