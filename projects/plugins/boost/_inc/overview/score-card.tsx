import { __ } from '@wordpress/i18n';
import { Skeleton, Stack, Text } from '@wordpress/ui';
import {
	formatScoreDelta,
	getScoreDelta,
	getScoreTier,
	getTrendDirection,
} from './lib/score-utils';
import type { ReactNode } from 'react';

type Props = {
	icon: ReactNode;
	label: string;
	value: ReactNode;
	score?: number;
	noBoost?: number | null;
	isLoading?: boolean;
	showPlaceholder?: boolean;
};

export default function ScoreCard( {
	icon,
	label,
	value,
	score,
	noBoost,
	isLoading,
	showPlaceholder = isLoading,
}: Props ) {
	const tier = score === undefined ? undefined : getScoreTier( score );
	const delta = score === undefined ? null : getScoreDelta( score, noBoost );
	return (
		<section
			className="jetpack-boost-overview__score-section"
			aria-label={ label }
			aria-busy={ isLoading }
		>
			<Stack direction="row" align="center" gap="sm">
				{ icon }
				<Text render={ <h3 /> } variant="body-md">
					{ label }
				</Text>
			</Stack>
			<Stack direction="row" align="center" gap="md">
				{ showPlaceholder ? (
					<Skeleton className="jetpack-boost-overview__score-placeholder" />
				) : (
					<Text variant="heading-2xl">{ value }</Text>
				) }
			</Stack>
			{ ! showPlaceholder && score !== undefined && (
				<progress
					className={ `jetpack-boost-overview__progress jetpack-boost-overview__progress--${ tier }` }
					value={ score }
					max={ 100 }
					aria-label={ label }
				/>
			) }
			{ ! showPlaceholder && delta !== null && (
				<Text
					variant="body-sm"
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
