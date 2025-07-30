import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Interactive rating symbol row with full accessibility support.
 *
 * Renders a horizontal set of clickable symbols letting the user choose a
 * rating between 1 and `max`. Supports keyboard navigation, screen readers,
 * and provides comprehensive ARIA labeling.
 *
 * @param {object}   props                 - Component props.
 * @param {number}   props.max             - Highest selectable rating (≥2, ≤10).
 * @param {number}   [props.value=0]       - Currently selected rating (0 for no selection).
 * @param {Function} [props.onChange=noop] - Handler called with the new rating value.
 * @param {*}        [props.icon='★']      - React element or character to display for each symbol.
 * @param {string}   [props.uniqueId='']   - Unique identifier to prevent conflicts between multiple instances.
 * @return {import('react').JSX.Element} Accessible rating control component.
 */
export default function Symbols( {
	max,
	value = 0,
	onChange = () => {},
	icon = '★',
	uniqueId = '',
} ) {
	// Memoize rating positions array for performance
	const ratings = useMemo( () => Array.from( { length: max }, ( _, i ) => i + 1 ), [ max ] );

	const handleSelect = useCallback(
		position => () => {
			onChange( value === position ? 0 : position );
		},
		[ onChange, value ]
	);

	// Handle keyboard navigation
	const handleKeyDown = useCallback(
		( event, position ) => {
			const { code } = event;

			switch ( code ) {
				case 'Enter':
				case 'Space':
					event.preventDefault();
					onChange( position );
					break;
				case 'ArrowRight':
				case 'ArrowUp':
					event.preventDefault();
					if ( position < max ) {
						// Focus next rating button
						const nextLabel = event.target.closest(
							'.jetpack-field-rating__label'
						).nextElementSibling;
						const nextButton = nextLabel?.querySelector( '.jetpack-field-rating__button' );
						nextButton?.focus();
					}
					break;
				case 'ArrowLeft':
				case 'ArrowDown':
					event.preventDefault();
					if ( position > 1 ) {
						// Focus previous rating button
						const prevLabel = event.target.closest(
							'.jetpack-field-rating__label'
						).previousElementSibling;
						const prevButton = prevLabel?.querySelector( '.jetpack-field-rating__button' );
						prevButton?.focus();
					}
					break;
			}
		},
		[ max, onChange ]
	);

	const wrapperProps = {
		className: 'jetpack-field-rating__wrapper',
		role: 'radiogroup',
		'aria-label': __( 'Rating', 'jetpack-forms' ),
		'aria-describedby': `rating-instructions-${ uniqueId }`,
	};

	return (
		<>
			<div id={ `rating-instructions-${ uniqueId }` } className="screen-reader-text">
				{ __(
					'Use arrow keys to navigate between rating options, Enter or Space to select.',
					'jetpack-forms'
				) }
			</div>
			<div { ...wrapperProps }>
				{ ratings.map( position => {
					const isSelected = value >= position;
					const isCurrentSelection = value === position;

					const inputId = `rating-${ uniqueId }-${ position }`;

					return (
						<label key={ position } className="jetpack-field-rating__label" htmlFor={ inputId }>
							<input
								id={ inputId }
								type="radio"
								name={ `rating-${ uniqueId }` }
								value={ position }
								checked={ value === position }
								onChange={ handleSelect( position ) }
								className="jetpack-field-rating__input screen-reader-text"
								aria-label={ `${ position } ${ __( 'out of', 'jetpack-forms' ) } ${ max } ${ __(
									'stars',
									'jetpack-forms'
								) }` }
							/>
							<span
								role="presentation"
								tabIndex={ isCurrentSelection || ( value === 0 && position === 1 ) ? 0 : -1 }
								aria-hidden="true"
								className="jetpack-field-rating__button"
								onKeyDown={ event => handleKeyDown( event, position ) }
							>
								<span className={ isSelected ? 'is-rating-filled' : 'is-rating-unfilled' }>
									{ icon }
								</span>
							</span>
						</label>
					);
				} ) }
			</div>
		</>
	);
}

// Symbols component with comprehensive accessibility and performance optimizations
