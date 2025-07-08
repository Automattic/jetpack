import { useCallback } from '@wordpress/element';

/**
 * Interactive rating symbol row (stars, hearts, etc.).
 *
 * Renders a horizontal set of clickable symbols letting the user choose a
 * rating between 1 and `max`. The currently selected symbol is controlled by
 * the `value` prop. When a symbol is selected, `onChange` is fired with the
 * new numeric value so parent blocks can update their attributes.
 *
 * @param {object}   props                 - Component props.
 * @param {number}   props.max             - Highest selectable rating (≥2).
 * @param {number}   [props.value=0]       - Currently selected rating.
 * @param {Function} [props.onChange=noop] - Handler called with the new rating.
 * @param {string}   [props.char='★']      - Character to display for each symbol.
 *
 * @return {import('react').JSX.Element}  Wrapping <div> containing the interactive stars.
 */
export default function Symbols( { max, value = 0, onChange = () => {}, char = '★' } ) {
	const handleSelect = useCallback( position => () => onChange( position ), [ onChange ] );

	return (
		<div className="jetpack-field-rating__wrapper">
			{ Array.from( Array( max ), ( _, i ) => i + 1 ).map( position => (
				<span
					key={ position }
					className="jetpack-field-rating__button"
					role="button"
					tabIndex={ 0 }
					onClick={ handleSelect( position ) }
					onKeyDown={ e => ( e.code === 'Enter' ? handleSelect( position )() : null ) }
				>
					<span className={ value >= position ? 'is-rating-filled' : 'is-rating-unfilled' }>
						{ char }
					</span>
				</span>
			) ) }
		</div>
	);
}
