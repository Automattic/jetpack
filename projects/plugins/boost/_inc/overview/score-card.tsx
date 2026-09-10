import { ProgressBar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Skeleton, Stack, Text } from '@wordpress/ui';
import {
	formatScoreDelta,
	getScoreDelta,
	getScoreTier,
	getScoreTierLabel,
	getTrendDirection,
} from './lib/score-utils';
import type { ScoreTier } from './lib/score-utils';
import type { ReactNode } from 'react';

type Props = {
	icon: ReactNode;
	label: string;
	help?: ReactNode;
	value: ReactNode;
	score?: number;
	tier?: ScoreTier;
	showProgress?: boolean;
	noBoost?: number | null;
	isLoading?: boolean;
	showPlaceholder?: boolean;
};

export default function ScoreCard( {
	icon,
	label,
	help,
	value,
	score,
	tier = score === undefined ? undefined : getScoreTier( score ),
	showProgress = true,
	noBoost,
	isLoading,
	showPlaceholder = isLoading,
}: Props ) {
	const delta = score === undefined ? null : getScoreDelta( score, noBoost );
	return (
		<section
			className="jetpack-boost-overview__score-section"
			aria-label={ label }
			aria-busy={ isLoading }
		>
			<Stack direction="row" align="center" gap="sm">
				{ icon }
				<Text render={ <h3 /> } variant="heading-md">
					{ label }
				</Text>
				{ help }
			</Stack>
			<Stack direction="row" align="center" gap="md">
				{ showPlaceholder ? (
					<Skeleton className="jetpack-boost-overview__score-placeholder" />
				) : (
					<>
						<Text variant="heading-2xl">{ value }</Text>
						{ tier !== undefined && (
							<Text
								className={ `jetpack-boost-overview__tier jetpack-boost-overview__tier--${ tier }` }
							>
								{ getScoreTierLabel( tier ) }
							</Text>
						) }
					</>
				) }
			</Stack>
			{ ! showPlaceholder && showProgress && score !== undefined && (
				<ProgressBar
					className={ `jetpack-boost-overview__progress jetpack-boost-overview__progress--${ tier }` }
					value={ score }
					aria-label={ label }
				/>
			) }
			{ ! showPlaceholder && delta !== null && (
				<Text
					variant="body-md"
					className={ `jetpack-boost-overview__delta jetpack-boost-overview__delta--${ getTrendDirection(
						delta
					) }` }
				>
					{ formatScoreDelta( delta ) } { __( 'compared to without Boost', 'jetpack-boost' ) }
				</Text>
			) }
		</section>
	);
}
