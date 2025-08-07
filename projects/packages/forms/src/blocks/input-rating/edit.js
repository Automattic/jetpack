import { useBlockProps } from '@wordpress/block-editor';
import { SVG, Path } from '@wordpress/components';

/**
 * Rating Input Edit Component
 *
 * Interactive rating component that renders clickable symbols (stars, hearts, etc.)
 * and handles user input. Reads values from parent field-rating block via context.
 *
 * @param {object} props            - Component props from WordPress block editor
 * @param {object} props.context    - Block context values from parent block
 * @param {string} props.clientId   - Unique identifier for the block instance
 * @param {object} props.attributes - Block attributes
 * @return {import('react').JSX.Element} Rating input editor component
 */
export default function RatingInputEdit( { attributes, context, clientId } ) {
	const max = context?.[ 'jetpack/field-rating-max' ] || 5;
	const defaultValue = context?.[ 'jetpack/field-rating-default' ] || 0;
	const className = context?.[ 'jetpack/field-rating-className' ] || '';
	const onChangeDefault = context?.[ 'jetpack/field-rating-onChangeDefault' ] || ( () => {} );

	// Build className and style without using experimental APIs
	const colorClassName = attributes?.className || '';
	const style = attributes?.style || undefined;

	// Get icon SVG based on className - default is stars
	const isHeartsStyle = className && className.includes( 'is-style-hearts' );
	const starSvg = (
		<SVG className="jetpack-field-rating__icon" viewBox="0 0 24 24" aria-hidden="true">
			<Path
				d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"
				strokeWidth="2"
				strokeLinejoin="round"
			></Path>
		</SVG>
	);
	const heartSvg = (
		<SVG className="jetpack-field-rating__icon" viewBox="0 0 24 24" aria-hidden="true">
			<Path
				d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
				strokeWidth="2"
				strokeLinejoin="round"
			></Path>
		</SVG>
	);
	const iconSvg = isHeartsStyle ? heartSvg : starSvg;

	const blockProps = useBlockProps( {
		className: `jetpack-rating-options ${ colorClassName }`.trim(),
		style,
	} );

	const handleChange = position => {
		onChangeDefault( defaultValue === position ? 0 : position );
	};

	// Generate rating options
	const ratingOptions = [];
	for ( let i = 1; i <= max; i++ ) {
		const radioId = `rating-${ clientId }-${ i }`;
		ratingOptions.push(
			<div key={ i } className="contact-form-field wp-block-jetpack-option">
				<input
					id={ radioId }
					type="radio"
					name={ `rating-${ clientId }` }
					value={ `${ i }/${ max }` }
					className="jetpack-field-rating__input radio grunion-field"
					checked={ defaultValue === i }
					onChange={ () => handleChange( i ) }
				/>
				<label
					htmlFor={ radioId }
					className="jetpack-field-rating__label grunion-radio-label rating"
				>
					{ iconSvg }
				</label>
			</div>
		);
	}

	return <div { ...blockProps }>{ ratingOptions }</div>;
}
