import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { Icon, Text } from '@wordpress/ui';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { useReducedMotion } from './use-reduced-motion';

/**
 * The arrival moment, on the step the user lands on after connecting.
 *
 * Connecting is the hardest thing in the flow and the likeliest to fail, and
 * the ones who get through it used to land back here with nothing to say it
 * worked. The mark blooms once, in the finish screen's own language at a
 * smaller scale, and the line stays rather than fading: a confirmation that
 * disappears on a timer is not a confirmation.
 *
 * @return The rendered notice.
 */
export function ConnectedNotice() {
	const reduced = useReducedMotion();

	return (
		<div className={ styles.connected } role="status">
			<span className={ styles.connected__mark }>
				{ /*
				 * Not rendered at all under reduced motion, which is a different
				 * render rather than a shorter animation; same call as the finish
				 * screen's, and the same reason it has to ask in JavaScript.
				 */ }
				{ ! reduced && (
					<>
						<span aria-hidden="true" className={ styles.connected__wash } />
						<span
							aria-hidden="true"
							className={ clsx( styles.connected__wash, styles[ 'connected__wash--2' ] ) }
						/>
					</>
				) }

				<span className={ styles.connected__tick } aria-hidden="true">
					<Icon icon={ check } />
				</span>
			</span>

			<Text variant="body-md" render={ <p /> } className={ styles.connected__text }>
				{ __( 'Connected to WordPress.com', 'jetpack-my-jetpack' ) }
			</Text>
		</div>
	);
}
