import { dateI18n } from '@wordpress/date';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { Text, VisuallyHidden } from '@wordpress/ui';
import useRerenderEvery from './use-rerender-every';
import './countdown.scss';

const pad = ( n: number ) => String( n ).padStart( 2, '0' );

/**
 * Time left until a moment, as a ticking "23h 59m 21s", with the exact time on hover.
 *
 * @param props    - Component props.
 * @param props.to - The moment counted down to.
 * @return The countdown.
 */
export default function Countdown( { to }: { to: Date } ) {
	useRerenderEvery( 1000, true );
	const total = Math.max( 0, Math.ceil( ( to.getTime() - Date.now() ) / 1000 ) );
	const hours = Math.floor( total / 3600 );
	const minutes = Math.floor( total / 60 ) % 60;
	const seconds = total % 60;
	const parts = [
		[ String( hours ), _x( 'h', 'hours, abbreviated', 'jetpack-protect-pkg' ) ],
		[ pad( minutes ), _x( 'm', 'minutes, abbreviated', 'jetpack-protect-pkg' ) ],
		[ pad( seconds ), _x( 's', 'seconds, abbreviated', 'jetpack-protect-pkg' ) ],
	];

	return (
		<Text
			variant="body-xl"
			className="jp-protect-countdown"
			render={ <time dateTime={ to.toISOString() } title={ dateI18n( 'M j, g:i A', to ) } /> }
		>
			<span aria-hidden="true">
				{ parts.map( ( [ digits, unit ] ) => (
					<span key={ unit } className="jp-protect-countdown__part">
						{ [ ...digits ].map( ( char, i ) => (
							// Keyed by value, so only a digit that changed remounts and replays its tick.
							<span key={ `${ i }-${ char }` } className="jp-protect-countdown__digit">
								{ char }
							</span>
						) ) }
						{ unit }
					</span>
				) ) }
			</span>
			<VisuallyHidden>
				{ sprintf(
					/* translators: %1$s is hours, %2$s minutes and %3$s seconds, such as "23 hours", "59 minutes", "21 seconds". */
					__( '%1$s, %2$s, %3$s', 'jetpack-protect-pkg' ),
					/* translators: %d is a number of hours. */
					sprintf( _n( '%d hour', '%d hours', hours, 'jetpack-protect-pkg' ), hours ),
					/* translators: %d is a number of minutes. */
					sprintf( _n( '%d minute', '%d minutes', minutes, 'jetpack-protect-pkg' ), minutes ),
					/* translators: %d is a number of seconds. */
					sprintf( _n( '%d second', '%d seconds', seconds, 'jetpack-protect-pkg' ), seconds )
				) }
			</VisuallyHidden>
		</Text>
	);
}
