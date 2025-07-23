import { useBlockProps } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { DEFAULT_GLYPHS } from './constants';
import Symbols from './symbols';

/**
 * Rating Input Edit Component
 *
 * Interactive rating component that renders clickable symbols (stars, hearts, etc.)
 * and handles user input. Reads values from parent field-rating block via context.
 *
 * @param {object} props         - Component props from WordPress block editor
 * @param {object} props.context - Block context values from parent block
 * @return {import('react').JSX.Element} Rating input editor component
 */
export default function RatingInputEdit( { context } ) {
	// Get all values from context provided by parent field-rating block
	const max = context?.[ 'jetpack/field-rating-max' ] || 5;
	const defaultValue = context?.[ 'jetpack/field-rating-default' ] || 0;
	const className = context?.[ 'jetpack/field-rating-className' ] || 'is-style-stars';

	// Get icon character based on className - memoized for performance
	const iconChar = useMemo( () => {
		const glyphs = DEFAULT_GLYPHS;
		if ( className.includes( 'is-style-hearts' ) ) {
			return glyphs.hearts?.char || glyphs.stars.char;
		}
		return glyphs.stars.char;
	}, [ className ] );

	const blockProps = useBlockProps( {
		'aria-label': __( 'Rating input', 'jetpack-forms' ),
		className: 'jetpack-rating-input-wrapper',
	} );

	return (
		<div { ...blockProps }>
			<Symbols max={ max } value={ defaultValue } onChange={ () => {} } char={ iconChar } />
		</div>
	);
}
