import { __ } from '@wordpress/i18n';
import { ProgressBar } from '@wordpress/components';
import { Icon, info } from '@wordpress/icons';
import { Badge, Popover, Stack, Text, VisuallyHidden } from '@wordpress/ui';
import { useId, useState } from 'react';
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
	const [ infoTrigger, setInfoTrigger ] = useState< HTMLButtonElement | null >( null );
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
							<Popover.Root>
								<Popover.Trigger
									openOnHover
									delay={ 200 }
									nativeButton={ false }
									// The badge only adds a hover target; the info button stays the control.
									role={ undefined }
									tabIndex={ undefined }
									aria-haspopup={ undefined }
									aria-expanded={ undefined }
									render={
										<Badge intent={ delta > 0 ? 'informational' : 'none' }>
											{ formatScoreDelta( delta ) }
										</Badge>
									}
								/>
								<Popover.Trigger
									ref={ setInfoTrigger }
									openOnHover
									delay={ 200 }
									aria-label={ __( 'About points', 'jetpack-boost' ) }
									className="jetpack-boost-overview__info-trigger"
								>
									<Icon icon={ info } className="jetpack-boost-overview__score-icon" />
								</Popover.Trigger>
								<Popover.Popup
									className="jetpack-boost-overview__score-popover jetpack-boost-overview__points-tooltip"
									positioner={ <Popover.Positioner anchor={ infoTrigger } /> }
								>
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
