import { useCallback } from '@wordpress/element';
import { range } from 'lodash';

/**
 * Interactive star-rating row.
 *
 * Renders a horizontal set of clickable stars that let the user choose a rating
 * between 1 and `maxRating`. When a star is selected the `onChange` callback
 * is fired with the new numeric value so parent blocks can update their
 * attributes.
 *
 * @param {object}   props                 - Component props.
 * @param {number}   props.maxRating       - Highest selectable rating (≥2).
 * @param {number}   [props.value=0]       - Currently selected rating.
 * @param {Function} [props.onChange=noop] - Handler called with the new rating.
 *
 * @return {JSX.Element}  Wrapping <div> containing the interactive stars.
 */
export default function Stars( { maxRating, value = 0, onChange = () => {} } ) {
	const handleSelect = useCallback( position => () => onChange( position ), [ onChange ] );

	return (
		<div className="jetpack-field-rating__wrapper">
			{ range( 1, maxRating + 1 ).map( position => (
				<span
					key={ position }
					className="jetpack-field-rating__button"
					role="button"
					tabIndex={ 0 }
					onClick={ handleSelect( position ) }
					onKeyDown={ e => ( e.code === 'Enter' ? handleSelect( position )() : null ) }
				>
					<span className={ value >= position ? '' : 'is-rating-unfilled' }>{ '★' }</span>
				</span>
			) ) }
		</div>
	);
}
