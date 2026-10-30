import { __, sprintf } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import getOutput from '../data/get-output';
import styles from './paused-note.module.scss';
import type { FC } from 'react';

// Module scope, so the production minifier can't fold the two lines into one
// `__()` call. See feedback_i18n_ternary_minifier_fold.
const offLabel = __( 'Paused on this site.', 'jetpack-seo' );

/**
 * The short line at the top of a card that is locked while Jetpack's SEO output is
 * paused. The tab's `SeoPausedBanner` explains the cause, so this only says which
 * cards it applies to.
 *
 * @param props    - Component props.
 * @param props.id - Optional id, for the card's controls to reference with `aria-describedby`.
 * @return The paused line.
 */
const PausedNote: FC< { id?: string } > = ( { id } ) => {
	const plugin = getOutput().conflicting_plugin;

	return (
		<Text variant="body-sm" render={ <p /> } id={ id } className={ styles.note }>
			{ plugin
				? sprintf(
						/* translators: %s: name of the SEO plugin that manages the site's SEO, e.g. Yoast SEO. */
						__( 'Paused while %s is active.', 'jetpack-seo' ),
						plugin
					)
				: offLabel }
		</Text>
	);
};

export default PausedNote;
