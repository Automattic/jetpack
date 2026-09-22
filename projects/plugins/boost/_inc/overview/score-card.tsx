import { __ } from '@wordpress/i18n';
import { ProgressBar } from '@wordpress/components';
import { Icon, info } from '@wordpress/icons';
import { Badge, Popover, Stack, Text, VisuallyHidden } from '@wordpress/ui';
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
	// The badge states what Boost improved, so a worse-than-baseline comparison reads as zero.
	const gain = delta === null ? null : Math.max( 0, delta );
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
					{ gain !== null && (
						<Stack
							direction="row"
							align="center"
							gap="sm"
							className="jetpack-boost-overview__delta"
						>
							<Badge intent={ gain > 0 ? 'informational' : 'none' }>
								{ formatScoreDelta( gain ) }
							</Badge>
							<Popover.Root>
								<Popover.Trigger
									openOnHover
									delay={ 200 }
									aria-label={ __( 'About points', 'jetpack-boost' ) }
									className="jetpack-boost-overview__info-trigger"
								>
									<Icon icon={ info } className="jetpack-boost-overview__score-icon" />
								</Popover.Trigger>
								<Popover.Popup>
									<VisuallyHidden render={ <Popover.Title /> }>
										{ __( 'About points', 'jetpack-boost' ) }
									</VisuallyHidden>
									<Popover.Description>
										{ __( 'Points gained from optimizations', 'jetpack-boost' ) }
									</Popover.Description>
								</Popover.Popup>
							</Popover.Root>
						</Stack>
					) }
				</div>
			) }
		</section>
	);
}
