import { JetpackLogo } from '@automattic/jetpack-components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { check, lineSolid } from '@wordpress/icons';
import { Icon, LinkButton, Text } from '@wordpress/ui';
import clsx from 'clsx';
import styles from '../styles.module.scss';
import { useReducedMotion } from '../use-reduced-motion';
import type { SetupModuleResult } from '../use-setup-modules';
import type { MouseEvent } from 'react';

type FinishStepProps = {
	// Owned by the wizard so the region can be labelled by the heading.
	titleId: string;
	// Null until the feature step has run, which only happens by going through it.
	results: SetupModuleResult[] | null;
	// Where the two ways out lead.
	dashboardUrl: string;
	exitUrl: string;
	// Records that setup is finished, then follows the link.
	onLeave: ( event: MouseEvent< HTMLElement > ) => void;
};

/**
 * What the screen says, given what actually happened.
 *
 * "You're all set" is a claim, so it has to be true. A run that switched nothing
 * on says so, and anything that failed is named rather than folded into a total.
 *
 * @param results - What became of each module.
 * @return The heading and the line under it.
 */
function summarise( results: SetupModuleResult[] ) {
	const failed = results.filter( result => ! result.ok );

	if ( failed.length ) {
		return {
			title: __( 'Some features need another look', 'jetpack-my-jetpack' ),
			description: __(
				'The rest are ready. You can try the others again in Jetpack settings.',
				'jetpack-my-jetpack'
			),
		};
	}

	const on = results.filter( result => result.wanted );

	if ( ! on.length ) {
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
 * What this run actually did, as a sentence.
 *
 * Only what changed. Five of the six ship on, so most runs send no request at
 * all, and the line used to say "6 of 6 switched on in this session" for a run
 * that touched nothing — and "4 of 6 switched on" for one whose only two
 * requests were switching things off.
 *
 * @param results - What became of each module.
 * @return The line under the list.
 */
function sessionTally( results: SetupModuleResult[] ): string {
	const on = results.filter( result => result.changed && result.wanted && result.ok ).length;
	const off = results.filter( result => result.changed && ! result.wanted && result.ok ).length;

	if ( ! on && ! off ) {
		return __( 'Nothing needed changing on this site.', 'jetpack-my-jetpack' );
	}

	if ( on && off ) {
		return sprintf(
			/* translators: 1: how many features were switched on. 2: how many were switched off. */
			__( '%1$d switched on and %2$d switched off.', 'jetpack-my-jetpack' ),
			on,
			off
		);
	}

	if ( on ) {
		return sprintf(
			/* translators: %d: how many features were switched on. */
			_n( '%d switched on.', '%d switched on.', on, 'jetpack-my-jetpack' ),
			on
		);
	}

	return sprintf(
		/* translators: %d: how many features were switched off. */
		_n( '%d switched off.', '%d switched off.', off, 'jetpack-my-jetpack' ),
		off
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
 * @param props.results      - What became of each module, or null if the step was never run.
 * @param props.dashboardUrl - Back to wp-admin.
 * @param props.exitUrl      - On to My Jetpack.
 * @param props.onLeave      - Records the finish, then follows the link.
 * @return The rendered step.
 */
export function FinishStep( {
	titleId,
	results,
	dashboardUrl,
	exitUrl,
	onLeave,
}: FinishStepProps ) {
	const reduced = useReducedMotion();
	const rows = results ?? [];
	const summary = summarise( rows );
	const tally = sessionTally( rows );

	return (
		<div className={ styles.finish }>
			{ /*
			 * A plain element rather than Stack: Stack's own spacing is layered and
			 * beats a class of ours, so the gaps below would silently collapse to
			 * nothing. This screen wants four different gaps, so it owns them.
			 */ }
			<div className={ styles[ 'finish-column' ] }>
				{ /*
				 * The mark springs in over three discs washing outward. The scales are
				 * 12, 15 and 13, not the reference's 28, 34 and 30: at 28x a 64px badge
				 * is a 1792px disc, which is not a bloom, it is the whole window turning
				 * green.
				 *
				 * Under reduced motion the discs are not rendered at all. That is a
				 * different render rather than a shorter animation, which is why this
				 * step is the one place in the wizard that has to ask in JavaScript.
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

				<div className={ styles[ 'finish-head' ] }>
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
				</div>

				{ rows.length > 0 && (
					<div className={ styles[ 'finish-summary' ] }>
						{ /* Safari drops the list role off a `list-style: none` list, so the count goes unsaid. */ }
						<ul
							role="list"
							className={ clsx( styles[ 'finish-card' ], styles.wave, styles[ 'wave-3' ] ) }
						>
							{ rows.map( result => (
								<li key={ result.slug } className={ styles[ 'finish-row' ] }>
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
								</li>
							) ) }
						</ul>

						<Text
							variant="body-md"
							render={ <p /> }
							className={ clsx( styles[ 'finish-note' ], styles.wave, styles[ 'wave-3' ] ) }
						>
							{ tally }
						</Text>
					</div>
				) }

				<div className={ clsx( styles[ 'finish-actions' ], styles.wave, styles[ 'wave-4' ] ) }>
					<LinkButton
						variant="solid"
						href={ dashboardUrl }
						onClick={ onLeave }
						className={ clsx( styles[ 'primary-green' ], styles[ 'finish-primary' ] ) }
					>
						{ __( 'Back to WordPress', 'jetpack-my-jetpack' ) }
					</LinkButton>

					<LinkButton
						variant="minimal"
						tone="neutral"
						href={ exitUrl }
						onClick={ onLeave }
						className={ styles[ 'finish-secondary' ] }
					>
						{ __( 'Go to My Jetpack', 'jetpack-my-jetpack' ) }
					</LinkButton>
				</div>
			</div>
		</div>
	);
}
