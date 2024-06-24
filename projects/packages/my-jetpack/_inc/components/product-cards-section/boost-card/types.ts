import type { FC } from 'react';

export type SpeedScores = Window[ 'myJetpackInitialState' ][ 'latestBoostSpeedScores' ];

interface BoostSpeedScoreProps {
	shouldShowTooltip: boolean;
}

export type BoostSpeedScoreType = FC< BoostSpeedScoreProps >;
