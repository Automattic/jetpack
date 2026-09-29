import { useReducedMotion } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { Icon, Text } from '@wordpress/ui';
import clsx from 'clsx';
import styles from './styles.module.scss';

/**
 * The arrival moment, on the step the user lands on after connecting.
 *
 * The mark blooms once, in the finish screen's own language at a smaller scale.
 * The line stays rather than fading: a confirmation on a timer is not one.
 *
 * @return The rendered notice.
 */
export function ConnectedNotice() {
	const reduced = useReducedMotion();

	return (
		<div className={ styles.connected } role="status">
			<span className={ styles.connected__mark }>
				{ /*
				 * Not rendered at all under reduced motion; see `.finish-wash` in
				 * the stylesheet.
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
