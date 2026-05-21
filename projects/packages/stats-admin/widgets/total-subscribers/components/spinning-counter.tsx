import { formatNumber } from '@automattic/number-formatters';
import { useEffect, useState } from '@wordpress/element';
import clsx from 'clsx';
import styles from '../style.module.css';

const SPIN_INTERVAL_MS = 55;
const SPIN_DURATION_MS = 650;
const SETTLE_DURATION_MS = 700;

type SpinningCounterProps = {
	value: number | null;
	isLoading: boolean;
};

type DigitSpinnerProps = {
	target: number;
	delay: number;
	animate: boolean;
};

/**
 * Spins a single digit column before landing on the target.
 *
 * @param props         - Component props.
 * @param props.target  - Final digit value (0–9).
 * @param props.delay   - Stagger before this column starts spinning.
 * @param props.animate - Whether to run the spin animation.
 * @return Digit column element.
 */
function DigitSpinner( { target, delay, animate }: DigitSpinnerProps ): JSX.Element {
	const [ digit, setDigit ] = useState( animate ? 0 : target );

	useEffect( () => {
		if ( ! animate ) {
			setDigit( target );
			return;
		}

		let spinTimer: ReturnType< typeof setInterval > | undefined;
		let settleTimer: ReturnType< typeof setTimeout > | undefined;
		let settleFrame: number | undefined;

		const startTimer = setTimeout( () => {
			spinTimer = setInterval( () => {
				setDigit( Math.floor( Math.random() * 10 ) );
			}, SPIN_INTERVAL_MS );

			settleTimer = setTimeout( () => {
				if ( spinTimer ) {
					clearInterval( spinTimer );
				}

				const settleStart = performance.now();

				const tick = ( now: number ) => {
					const elapsed = now - settleStart;
					const progress = Math.min( 1, elapsed / SETTLE_DURATION_MS );
					const eased = 1 - Math.pow( 1 - progress, 3 );
					const interpolated = Math.round( eased * target );

					setDigit( interpolated );

					if ( progress < 1 ) {
						settleFrame = requestAnimationFrame( tick );
					} else {
						setDigit( target );
					}
				};

				settleFrame = requestAnimationFrame( tick );
			}, SPIN_DURATION_MS );
		}, delay );

		return () => {
			clearTimeout( startTimer );
			if ( spinTimer ) {
				clearInterval( spinTimer );
			}
			if ( settleTimer ) {
				clearTimeout( settleTimer );
			}
			if ( settleFrame ) {
				cancelAnimationFrame( settleFrame );
			}
		};
	}, [ animate, delay, target ] );

	return (
		<span className={ styles.digit } aria-hidden="true">
			{ digit }
		</span>
	);
}

/**
 * Displays a large number with a quick slot-machine style digit spin on load.
 *
 * @param props           - Component props.
 * @param props.value     - Target count once loaded.
 * @param props.isLoading - Whether the count is still loading.
 * @return Animated counter element.
 */
export function SpinningCounter( { value, isLoading }: SpinningCounterProps ): JSX.Element {
	const [ shouldAnimate, setShouldAnimate ] = useState( true );
	const displayValue = isLoading ? null : value;
	const formatted = displayValue === null ? '0000' : formatNumber( Math.max( 0, displayValue ) );

	useEffect( () => {
		if ( isLoading ) {
			setShouldAnimate( true );
			return;
		}

		if ( value === null ) {
			return;
		}

		setShouldAnimate( true );
		const timer = setTimeout(
			() => setShouldAnimate( false ),
			SPIN_DURATION_MS + SETTLE_DURATION_MS + formatted.length * 40
		);

		return () => clearTimeout( timer );
	}, [ formatted.length, isLoading, value ] );

	return (
		<span
			className={ clsx( styles.counter, {
				[ styles.counterLoading ]: isLoading,
			} ) }
			aria-busy={ isLoading }
			aria-live="polite"
		>
			{ formatted.split( '' ).map( ( character, index ) => {
				if ( character >= '0' && character <= '9' ) {
					return (
						<DigitSpinner
							key={ `${ index }-${ character }` }
							target={ Number( character ) }
							delay={ index * 40 }
							animate={ isLoading || shouldAnimate }
						/>
					);
				}

				return (
					<span key={ `${ index }-${ character }` } className={ styles.separator }>
						{ character }
					</span>
				);
			} ) }
		</span>
	);
}
