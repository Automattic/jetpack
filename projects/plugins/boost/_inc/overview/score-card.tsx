import { IconTooltip } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { ProgressBar } from '@wordpress/components';
import { Badge, Stack, Text } from '@wordpress/ui';
import { useId } from 'react';
import {
	formatScoreDelta,
	getScoreDelta,
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
};

export default function ScoreCard( {
	icon,
	label,
	help,
	value,
	score,
	tier = score === undefined ? undefined : getScoreTier( score ),
	noBoost,
}: Props ) {
	const headingId = useId();
	const delta = score === undefined ? null : getScoreDelta( score, noBoost );
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
					<ProgressBar
						className={ `jetpack-boost-overview__progress jetpack-boost-overview__progress--${ tier }` }
						value={ score }
						aria-label={ label }
					/>
					{ delta !== null && (
						<Stack
							direction="row"
							align="center"
							gap="sm"
							className="jetpack-boost-overview__delta"
						>
							<Badge intent={ delta > 0 ? 'informational' : 'none' }>
								{ formatScoreDelta( delta ) }
							</Badge>
							<IconTooltip placement="bottom" inline={ false } shift hoverShow>
								{ __( 'Points gained from optimizations', 'jetpack-boost' ) }
							</IconTooltip>
						</Stack>
					) }
				</div>
			) }
		</section>
	);
}
