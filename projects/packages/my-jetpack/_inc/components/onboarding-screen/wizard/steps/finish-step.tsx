import { __, _n, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import styles from '../styles.module.scss';
import type { SetupModuleResult } from '../use-setup-modules';

type FinishStepProps = {
	// Owned by the wizard so the panel region can be labelled by the heading.
	titleId: string;
	// Null until the feature step has run, which only happens by going through it.
	results: SetupModuleResult[] | null;
};

/**
 * What the screen says, given what actually happened.
 *
 * Nothing switched on reads as "nothing changed", never as a completion the user
 * did not ask for. Anything that failed is said out loud: a tick over a module
 * that never came on is the worst thing this flow could do.
 *
 * @param results - What became of each module.
 * @return The heading and the line under it.
 */
function summarise( results: SetupModuleResult[] ) {
	const failed = results.filter( result => ! result.ok );

	if ( failed.length ) {
		return {
			title: sprintf(
				/* translators: %d: how many features could not be changed. */
				_n(
					'%d feature could not be changed',
					'%d features could not be changed',
					failed.length,
					'jetpack-my-jetpack'
				),
				failed.length
			),
			description: __(
				'The rest are set up. You can try the others again from Jetpack settings.',
				'jetpack-my-jetpack'
			),
		};
	}

	const on = results.filter( result => result.wanted && result.ok );

	if ( ! on.length ) {
		return {
			title: __( 'Nothing changed on your site', 'jetpack-my-jetpack' ),
			description: __(
				'Everything stays as it was. Turn any of these on later from Jetpack settings.',
				'jetpack-my-jetpack'
			),
		};
	}

	if ( on.length === results.length ) {
		return {
			title: __( 'Your site is set up', 'jetpack-my-jetpack' ),
			description: __(
				'Anything switched off stays available in Jetpack settings.',
				'jetpack-my-jetpack'
			),
		};
	}

	return {
		title: sprintf(
			/* translators: 1: how many features are on. 2: how many were offered. */
			__( '%1$d of %2$d features are on', 'jetpack-my-jetpack' ),
			on.length,
			results.length
		),
		description: __(
			'Anything switched off stays available in Jetpack settings.',
			'jetpack-my-jetpack'
		),
	};
}

/**
 * The finish screen: what happened, module by module.
 *
 * @param props         - The component props.
 * @param props.titleId - The id the panel region is labelled by.
 * @param props.results - What became of each module, or null if the step was skipped past.
 * @return The rendered step.
 */
export function FinishStep( { titleId, results }: FinishStepProps ) {
	const summary = results
		? summarise( results )
		: {
				title: __( 'Nothing changed on your site', 'jetpack-my-jetpack' ),
				description: __(
					'Everything stays as it was. Turn any of these on later from Jetpack settings.',
					'jetpack-my-jetpack'
				),
			};

	return (
		<Stack direction="column" gap="xl">
			<Stack direction="column" gap="xs">
				<Text variant="heading-2xl" id={ titleId } render={ <h1 /> }>
					{ summary.title }
				</Text>
				<Text variant="body-lg" render={ <p /> } className={ styles[ 'step-description' ] }>
					{ summary.description }
				</Text>
			</Stack>

			{ results && results.length > 0 && (
				<ul className={ styles[ 'finish-rows' ] }>
					{ results.map( ( result, index ) => (
						<li
							key={ result.slug }
							className={ styles[ 'finish-row' ] }
							style={ { '--row-index': index } as React.CSSProperties }
						>
							<Text variant="body-lg" className={ styles[ 'finish-row__name' ] }>
								{ result.name }
							</Text>
							<Text
								variant="body-md"
								className={
									styles[ result.ok ? 'finish-row__state' : 'finish-row__state--failed' ]
								}
							>
								{ /* eslint-disable-next-line no-nested-ternary */ }
								{ ! result.ok
									? __( 'Could not be changed', 'jetpack-my-jetpack' )
									: result.wanted
										? __( 'On', 'jetpack-my-jetpack' )
										: __( 'Off', 'jetpack-my-jetpack' ) }
							</Text>
						</li>
					) ) }
				</ul>
			) }
		</Stack>
	);
}
