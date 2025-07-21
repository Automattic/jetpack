import { useBlockProps, BlockControls } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import RatingToolbar from '../shared/components/rating-toolbar';
import useRatingSync from '../shared/hooks/use-rating-sync';
import { getIconVariationFromClassName } from '../shared/utils/rating-helpers';
import { DEFAULT_GLYPHS } from './constants';
import Symbols from './symbols';

/**
 * Rating Input Edit Component
 *
 * Interactive rating component that renders clickable symbols (stars, hearts, etc.)
 * and handles user input. Synchronizes with parent field-rating block.
 *
 * @param {object}   props               - Component props from WordPress block editor
 * @param {string}   props.clientId      - Block client ID
 * @param {object}   props.attributes    - Block attributes
 * @param {Function} props.setAttributes - Function to update block attributes
 * @return {import('react').JSX.Element} Rating input editor component
 */
export default function RatingInputEdit( { clientId, attributes, setAttributes } ) {
	const { max = 5, default: defaultValue = 0, variation = 'stars', className = '' } = attributes;

	// Use shared rating synchronization hook
	const { updateMax, updateDefault, updateVariation } = useRatingSync(
		clientId,
		attributes,
		setAttributes
	);

	// Determine current icon variation - memoized for performance
	const currentVariation = useMemo( () => {
		return getIconVariationFromClassName( className, variation );
	}, [ className, variation ] );

	// Get icon character for current variation - memoized for performance
	const iconChar = useMemo( () => {
		const glyphs = DEFAULT_GLYPHS;
		return glyphs[ currentVariation ]?.char || glyphs.stars.char;
	}, [ currentVariation ] );

	const blockProps = useBlockProps( {
		'aria-label': __( 'Rating input', 'jetpack-forms' ),
		className: 'jetpack-rating-input-wrapper',
	} );

	return (
		<div { ...blockProps }>
			<BlockControls>
				<RatingToolbar
					variation={ currentVariation }
					max={ max }
					onUpdateVariation={ updateVariation }
					onUpdateMax={ updateMax }
				/>
			</BlockControls>

			<Symbols max={ max } value={ defaultValue } onChange={ updateDefault } char={ iconChar } />
		</div>
	);
}
