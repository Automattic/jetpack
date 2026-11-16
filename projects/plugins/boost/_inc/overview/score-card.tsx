import { __ } from '@wordpress/i18n';
import { Badge, Meter, Popover, Stack, Text, VisuallyHidden } from '@wordpress/ui';
import { useId } from 'react';
import {
	formatScoreDelta,
	getScoreDelta,
	getScoreGain,
	getScoreTier,
	getScoreTierLabel,
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
	isStale?: boolean;
	closePopover?: boolean;
};

/**
 * What the badge's tooltip says about the comparison behind it.
 *
 * The badge clamps a worse-than-baseline comparison to zero, so a drop is only legible in words —
 * these match the "Speed score has fallen" notice that reports the same drop.
 *
 * @param delta - Points against the Boost-disabled baseline, or null when there is no comparison.
 */
function explainDelta( delta: number | null ): string {
	if ( delta !== null && delta > 0 ) {
		return __( 'Points gained from optimizations', 'jetpack-boost' );
	}

	if ( delta !== null && delta < 0 ) {
		return __( 'Speed score has fallen', 'jetpack-boost' );
	}

	return __( 'No improvements in score', 'jetpack-boost' );
}

export default function ScoreCard( {
	icon,
	label,
	help,
	value,
	score,
	tier = score === undefined ? undefined : getScoreTier( score ),
	noBoost,
	isStale = false,
	closePopover = false,
}: Props ) {
	const headingId = useId();
	const delta = getScoreDelta( score, noBoost, isStale );
	const gain = getScoreGain( score, noBoost, isStale );
	return (
		<section className="jetpack-boost-overview__score-section" aria-labelledby={ headingId }>
			<Stack direction="row" align="center" gap="sm">
				{ icon }
				<Text render={ <h3 id={ headingId } /> } variant="heading-md">
					{ label }
				</Text>
				{ help }
			</Stack>
			<Stack direction="row" align="baseline" gap="md">
				<Text variant="heading-2xl">{ value }</Text>
				{ tier !== undefined && (
					<Text
						className={ `jetpack-boost-overview__tier jetpack-boost-overview__tier--${ tier }` }
					>
						{ getScoreTierLabel( tier ) }
					</Text>
				) }
			</Stack>
			{ score !== undefined && (
				<div className="jetpack-boost-overview__score-meter">
					<Meter.Root
						className="jetpack-boost-overview__progress"
						value={ score }
						aria-label={ label }
					>
						<Meter.Track>
							<Meter.Indicator className={ `jetpack-boost-overview__progress--${ tier }` } />
						</Meter.Track>
					</Meter.Root>
					{ gain !== null && (
						<Badge
							key={ closePopover ? 'running' : 'loaded' }
							className="jetpack-boost-overview__delta"
							intent={ gain > 0 ? 'informational' : 'none' }
							infotip={ {
								popover: Popover,
								popup: (
									<Popover.Popup className="jetpack-boost-overview__score-popover jetpack-boost-overview__points-tooltip">
										<VisuallyHidden render={ <Popover.Title /> }>
											{ __( 'About points', 'jetpack-boost' ) }
										</VisuallyHidden>
										<Popover.Description>{ explainDelta( delta ) }</Popover.Description>
									</Popover.Popup>
								),
							} }
						>
							{ formatScoreDelta( gain ) }
						</Badge>
					) }
				</div>
			) }
		</section>
	);
}
