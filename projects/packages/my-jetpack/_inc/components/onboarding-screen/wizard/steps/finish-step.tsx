import { JetpackLogo } from '@automattic/jetpack-components';
import { useReducedMotion } from '@wordpress/compose';
import { __, _n, sprintf } from '@wordpress/i18n';
import { check, lineSolid } from '@wordpress/icons';
import { ThemeProvider } from '@wordpress/theme';
import { ButtonLink, Card, Icon, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { BRAND_COLOR, tallyResults } from '../lib';
import styles from '../styles.module.scss';
import type { SetupModuleResult } from '../use-setup-modules';
import type { MouseEvent } from 'react';

type Tally = ReturnType< typeof tallyResults >;

type FinishStepProps = {
	// Owned by the wizard so the region can be labelled by the heading.
	titleId: string;
	results: SetupModuleResult[];
	// Where the two ways out lead.
	dashboardUrl: string;
	exitUrl: string;
	// Records that setup is finished.
	onLeave: ( event: MouseEvent< HTMLElement > ) => void;
	// True once one of the exits has been taken.
	isLeaving?: boolean;
};

/**
 * What the screen says, given what actually happened.
 *
 * "You're all set" is a claim, so it has to be true. A run that switched nothing
 * on says so, and anything that failed is named rather than folded into a total.
 *
 * @param results - What became of each module.
 * @param counts  - The same results, counted.
 * @return The heading and the line under it.
 */
function summarise( results: SetupModuleResult[], counts: Tally ) {
	if ( counts.failed ) {
		return {
			title: __( 'Some features need another look', 'jetpack-my-jetpack' ),
			description: __(
				'The rest are ready. You can try the others again in Jetpack settings.',
				'jetpack-my-jetpack'
			),
		};
	}

	// Only when the run moved nothing and nothing runs: switching modules off is a change.
	if ( ! results.some( result => result.changed || result.wanted ) ) {
		return {
			title: __( 'Nothing changed on your site', 'jetpack-my-jetpack' ),
			description: __(
				'Everything stays as it was. You can switch these on any time in Jetpack settings.',
				'jetpack-my-jetpack'
			),
		};
	}

	return {
		title: __( "You're all set", 'jetpack-my-jetpack' ),
		description: __(
			"That's the important stuff done. Everything here can be changed in Jetpack settings.",
			'jetpack-my-jetpack'
		),
	};
}

/**
 * A number of features, with the word for them.
 *
 * Its own string so that each number in the tally agrees with its own noun: one
 * `_n()` over the whole sentence can only decline on one of the two.
 *
 * @param count - How many features.
 * @return The count and its noun.
 */
function featureCount( count: number ): string {
	return sprintf(
		/* translators: %d: a number of Jetpack features. */
		_n( '%d feature', '%d features', count, 'jetpack-my-jetpack' ),
		count
	);
}

/**
 * What this run actually did, as a sentence.
 *
 * Only what changed: five of the six ship on, so most runs send no request at
 * all. Each line names setup, because the rows show end state and a bare count
 * reads as their total.
 *
 * @param counts     - What the run did, counted.
 * @param counts.on  - How many it switched on.
 * @param counts.off - How many it switched off.
 * @return The line above the list.
 */
function sessionTally( { on, off }: Tally ): string {
	if ( ! on && ! off ) {
		return __( 'Nothing needed changing on this site.', 'jetpack-my-jetpack' );
	}

	if ( on && off ) {
		return sprintf(
			/* translators: 1: a number of features switched on, e.g. "2 features". 2: a number switched off, e.g. "1 feature". */
			__( 'Setup switched on %1$s and switched off %2$s.', 'jetpack-my-jetpack' ),
			featureCount( on ),
			featureCount( off )
		);
	}

	if ( on ) {
		return sprintf(
			/* translators: %s: a number of features switched on, e.g. "2 features". */
			__( 'Setup switched on %s.', 'jetpack-my-jetpack' ),
			featureCount( on )
		);
	}

	return sprintf(
		/* translators: %s: a number of features switched off, e.g. "2 features". */
		__( 'Setup switched off %s.', 'jetpack-my-jetpack' ),
		featureCount( off )
	);
}

/**
 * What one row says on the right.
 *
 * @param result - What became of the module.
 * @return The status word.
 */
function statusLabel( result: SetupModuleResult ) {
	if ( ! result.ok ) {
		return __( 'Not changed', 'jetpack-my-jetpack' );
	}

	return result.wanted ? __( 'On', 'jetpack-my-jetpack' ) : __( 'Off', 'jetpack-my-jetpack' );
}

/**
 * The finish screen: the mark arriving, what happened, and the way out.
 *
 * It takes the whole sheet rather than sitting in the question column, because
 * there is nothing left to navigate. The rail counts steps that are all behind
 * you and the panel sells a flow you have just finished.
 *
 * @param props              - The component props.
 * @param props.titleId      - The id the region is labelled by.
 * @param props.results      - What became of each module.
 * @param props.dashboardUrl - Back to wp-admin.
 * @param props.exitUrl      - On to My Jetpack.
 * @param props.onLeave      - Records the finish, then follows the link.
 * @param props.isLeaving    - Whether an exit is already under way.
 * @return The rendered step.
 */
export function FinishStep( {
	titleId,
	results,
	dashboardUrl,
	exitUrl,
	onLeave,
	isLeaving = false,
}: FinishStepProps ) {
	const reduced = useReducedMotion();
	const counts = tallyResults( results );
	const summary = summarise( results, counts );
	const tally = sessionTally( counts );

	return (
		<div className={ styles.finish }>
			<Stack direction="column" align="center" gap="xl" className={ styles[ 'finish-column' ] }>
				{ /*
				 * The mark springs in over three discs washing outward, each sized in the
				 * stylesheet as a share of the window's long side so the wash clears the
				 * page edge at any size.
				 *
				 * Under reduced motion the discs are not rendered at all; see
				 * `.finish-wash` in the stylesheet.
				 */ }
				<div className={ styles[ 'finish-badge' ] }>
					{ ! reduced && (
						<>
							<span aria-hidden="true" className={ styles[ 'finish-wash' ] } />
							<span
								aria-hidden="true"
								className={ clsx( styles[ 'finish-wash' ], styles[ 'finish-wash--2' ] ) }
							/>
							<span
								aria-hidden="true"
								className={ clsx( styles[ 'finish-wash' ], styles[ 'finish-wash--3' ] ) }
							/>
						</>
					) }

					<span className={ styles[ 'finish-mark' ] }>
						<JetpackLogo showText={ false } height={ 64 } />
					</span>
				</div>

				<Stack direction="column" gap="sm">
					<Text
						variant="heading-2xl"
						id={ titleId }
						render={ <h1 /> }
						className={ clsx( styles[ 'finish-title' ], styles.wave, styles[ 'wave-1' ] ) }
					>
						{ summary.title }
					</Text>

					<Text
						variant="body-lg"
						render={ <p /> }
						className={ clsx( styles[ 'finish-lede' ], styles.wave, styles[ 'wave-2' ] ) }
					>
						{ summary.description }
					</Text>
				</Stack>

				{ results.length > 0 && (
					<Stack direction="column" gap="md" className={ styles[ 'finish-summary' ] }>
						<Text
							variant="body-md"
							render={ <p /> }
							className={ clsx( styles[ 'finish-note' ], styles.wave, styles[ 'wave-3' ] ) }
						>
							{ tally }
						</Text>

						{ /* Safari drops the list role off a `list-style: none` list, so the count goes unsaid. */ }
						<Card.Root
							render={ <ul /> }
							role="list"
							className={ clsx( styles[ 'finish-card' ], styles.wave, styles[ 'wave-3' ] ) }
						>
							{ results.map( result => (
								<Stack
									key={ result.slug }
									render={ <li /> }
									align="center"
									gap="md"
									className={ styles[ 'finish-row' ] }
								>
									<span
										aria-hidden="true"
										className={ clsx(
											styles[ 'finish-row__glyph' ],
											result.ok && result.wanted && styles[ 'finish-row__glyph--on' ]
										) }
									>
										<Icon icon={ result.ok && result.wanted ? check : lineSolid } />
									</span>
									<Text variant="body-md" className={ styles[ 'finish-row__name' ] }>
										{ result.name }
									</Text>
									<Text variant="body-md" className={ styles[ 'finish-row__state' ] }>
										{ statusLabel( result ) }
									</Text>
								</Stack>
							) ) }
						</Card.Root>
					</Stack>
				) }

				<Stack
					direction="column"
					gap="sm"
					className={ clsx( styles[ 'finish-actions' ], styles.wave, styles[ 'wave-4' ] ) }
				>
					<ThemeProvider color={ BRAND_COLOR }>
						<ButtonLink
							variant="solid"
							href={ exitUrl }
							onClick={ onLeave }
							aria-disabled={ isLeaving || undefined }
							className={ styles[ 'finish-primary' ] }
						>
							{ __( 'Go to My Jetpack', 'jetpack-my-jetpack' ) }
						</ButtonLink>
					</ThemeProvider>

					<ButtonLink
						variant="minimal"
						tone="neutral"
						href={ dashboardUrl }
						onClick={ onLeave }
						aria-disabled={ isLeaving || undefined }
						className={ styles[ 'finish-secondary' ] }
					>
						{ __( 'Back to your WordPress site', 'jetpack-my-jetpack' ) }
					</ButtonLink>
				</Stack>
			</Stack>
		</div>
	);
}
