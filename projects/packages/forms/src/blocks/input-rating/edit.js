import { useBlockProps } from '@wordpress/block-editor';
import { RatingIcon } from '../field-rating/rating-icon.jsx';
import useInsertAfterOnEnterKeyDown from '../shared/hooks/use-insert-after-on-enter-key-down.js';

export default function RatingInputEdit( { context, clientId } ) {
	const max = context?.[ 'jetpack/field-rating-max' ] || 5;
	const defaultValue = context?.[ 'jetpack/field-rating-default' ] || 0;
	const iconStyle = context?.[ 'jetpack/field-rating-iconStyle' ] || 'stars';
	const onChangeDefault = context?.[ 'jetpack/field-rating-onChangeDefault' ] || ( () => {} );
	const onKeyDown = useInsertAfterOnEnterKeyDown( clientId );

	// Color and other support classes are injected by useBlockProps
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
					<RatingIcon iconStyle={ iconStyle } />
				</label>
			</div>
		);
	}

	return <div { ...blockProps }>{ ratingOptions }</div>;
}
