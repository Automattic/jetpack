import { useBlockProps } from '@wordpress/block-editor';
import { SVG, Path } from '@wordpress/components';
import useInsertAfterOnEnterKeyDown from '../shared/hooks/use-insert-after-on-enter-key-down.js';

export default function RatingInputEdit( { context, clientId } ) {
	const max = context?.[ 'jetpack/field-rating-max' ] || 5;
	const defaultValue = context?.[ 'jetpack/field-rating-default' ] || 0;
	const iconStyle = context?.[ 'jetpack/field-rating-iconStyle' ] || 'stars';
	const onChangeDefault = context?.[ 'jetpack/field-rating-onChangeDefault' ] || ( () => {} );
	const onKeyDown = useInsertAfterOnEnterKeyDown( clientId );

	// Color and other support classes are injected by useBlockProps

	// Get icon SVG based on iconStyle (default: stars)
	const isHeartsStyle = iconStyle === 'hearts';
	const starSvg = (
		<SVG className="jetpack-field-rating__icon" viewBox="0 0 24 24" aria-hidden="true">
			<Path
				d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinejoin="round"
			></Path>
		</SVG>
	);
	const heartSvg = (
		<SVG className="jetpack-field-rating__icon" viewBox="0 0 24 24" aria-hidden="true">
			<Path
				d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinejoin="round"
			></Path>
		</SVG>
	);
	const iconSvg = isHeartsStyle ? heartSvg : starSvg;

	const blockProps = useBlockProps( {
		className: 'jetpack-field-rating__options',
	} );

	const handleChange = position => {
		onChangeDefault( defaultValue === position ? 0 : position );
	};

	// Generate rating options
	const ratingOptions = [];
	for ( let i = 1; i <= max; i++ ) {
		const radioId = `rating-${ clientId }-${ i }`;
		ratingOptions.push(
			<div key={ i } className="jetpack-field-rating__option">
				<input
					id={ radioId }
					type="radio"
					name={ `rating-${ clientId }` }
					value={ `${ i }/${ max }` }
					className="jetpack-field-rating__input visually-hidden"
					checked={ defaultValue === i }
					onChange={ () => handleChange( i ) }
					onKeyDown={ onKeyDown }
				/>
				<label htmlFor={ radioId } className="jetpack-field-rating__label">
					{ iconSvg }
				</label>
			</div>
		);
	}

	return <div { ...blockProps }>{ ratingOptions }</div>;
}
