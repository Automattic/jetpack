import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import {
	validateRatingValue,
	validateMaxRating,
	updateClassNameWithVariation,
} from '../utils/rating-helpers';

/**
 * Custom hook for synchronizing rating attributes between parent and child blocks.
 *
 * @param {string}   clientId      - Current block's client ID
 * @param {object}   attributes    - Current block's attributes
 * @param {Function} setAttributes - Function to update current block's attributes
 * @return {object} Synchronization functions and state
 */
export default function useRatingSync( clientId, attributes, setAttributes ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Get parent or child block ID for synchronization
	const { relatedBlockId, isParent } = useSelect(
		select => {
			const { getBlockParents, getBlocks } = select( blockEditorStore );
			const parents = getBlockParents( clientId );
			const parentId = parents[ parents.length - 1 ];

			// Check if this is a parent block with rating-input child
			const children = getBlocks( clientId ) || [];
			const ratingInputChild = children.find( block => block.name === 'jetpack/rating-input' );

			return {
				relatedBlockId: ratingInputChild?.clientId || parentId,
				isParent: !! ratingInputChild,
			};
		},
		[ clientId ]
	);

	/**
	 * Updates max rating value with validation and sync.
	 */
	const updateMax = useCallback(
		newMax => {
			const validatedMax = validateMaxRating( newMax );
			const validatedDefault = validateRatingValue( attributes.default, 0, validatedMax );

			const newProps = {
				max: validatedMax,
				default: validatedDefault,
			};

			setAttributes( newProps );

			// Sync with related block
			if ( relatedBlockId ) {
				updateBlockAttributes( relatedBlockId, newProps );
			}
		},
		[ attributes.default, setAttributes, relatedBlockId, updateBlockAttributes ]
	);

	/**
	 * Updates default rating value with validation and sync.
	 */
	const updateDefault = useCallback(
		newDefault => {
			const validatedDefault = validateRatingValue( newDefault, 0, attributes.max || 5 );

			const newProps = { default: validatedDefault };
			setAttributes( newProps );

			// Sync with related block
			if ( relatedBlockId ) {
				updateBlockAttributes( relatedBlockId, newProps );
			}
		},
		[ attributes.max, setAttributes, relatedBlockId, updateBlockAttributes ]
	);

	/**
	 * Updates style variation with className manipulation and sync.
	 */
	const updateVariation = useCallback(
		newVariation => {
			if ( newVariation === attributes.variation ) {
				return;
			}

			const newClassName = updateClassNameWithVariation( attributes.className, newVariation );

			const newProps = {
				variation: newVariation,
				className: newClassName,
			};

			setAttributes( newProps );

			// Sync with related block
			if ( relatedBlockId ) {
				updateBlockAttributes( relatedBlockId, newProps );
			}
		},
		[
			attributes.variation,
			attributes.className,
			setAttributes,
			relatedBlockId,
			updateBlockAttributes,
		]
	);

	return {
		updateMax,
		updateDefault,
		updateVariation,
		relatedBlockId,
		isParent,
	};
}
