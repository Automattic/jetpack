import { ProgressBar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Skeleton, Stack, Text, VisuallyHidden } from '@wordpress/ui';
import { useId } from 'react';
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
	noBoost,
	isLoading,
	showPlaceholder = isLoading,
}: Props ) {
	const headingId = useId();
	const delta = score === undefined ? null : getScoreDelta( score, noBoost );
	return (
		<section
			className="jetpack-boost-overview__score-section"
			aria-labelledby={ headingId }
			aria-busy={ isLoading }
		>
			<Stack direction="row" align="center" gap="sm">
				{ icon }
				<Text render={ <h3 id={ headingId } /> } variant="heading-md">
					{ label }
				</Text>
				{ help }
			</Stack>
			{ showPlaceholder && ! isLoading && (
				<VisuallyHidden>{ __( 'Score unavailable', 'jetpack-boost' ) }</VisuallyHidden>
			) }
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
			{ ! showPlaceholder && score !== undefined && (
				<ProgressBar
					className={ `jetpack-boost-overview__progress jetpack-boost-overview__progress--${ tier }` }
					value={ score }
					aria-label={ label }
				/>
			) }
			{ ! showPlaceholder && delta !== null && delta > 0 && (
				<Text
					variant="body-md"
					className={ `jetpack-boost-overview__delta jetpack-boost-overview__delta--${ getTrendDirection(
						delta
					) }` }
				>
					{ formatScoreDelta( delta ) }
				</Text>
			) }
		</section>
	);
}
