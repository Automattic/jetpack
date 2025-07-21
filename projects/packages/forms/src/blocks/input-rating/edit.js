import { useBlockProps, store as blockEditorStore, BlockControls } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import RatingToolbar from '../shared/components/rating-toolbar';
import { DEFAULT_GLYPHS } from './constants';
import Symbols from './symbols';

export default function RatingInputEdit( { clientId, attributes, setAttributes } ) {
	const {
		max,
		default: defaultValue,
		variation = 'stars',
		className: classNameAttr = '',
	} = attributes;

	const { parentClientId } = useSelect(
		select => {
			const { getBlockRootClientId } = select( blockEditorStore );
			return { parentClientId: getBlockRootClientId( clientId ) };
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const updateDefault = newVal => {
		setAttributes( { default: newVal } );

		if ( parentClientId ) {
			updateBlockAttributes( parentClientId, {
				default: newVal,
			} );
		}
	};

	const glyphs = DEFAULT_GLYPHS;
	const glyphKeys = Object.keys( glyphs );

	// Get the parent block's className to determine the selected style.
	const parentClassName = useSelect(
		select => {
			if ( ! parentClientId ) {
				return '';
			}
			const parentBlock = select( blockEditorStore ).getBlock( parentClientId );
			return parentBlock?.attributes?.className || '';
		},
		[ parentClientId ]
	);

	const matchedKey =
		glyphKeys.find( key => parentClassName.includes( `is-style-${ key }` ) ) || glyphKeys[ 0 ];

	// Persist the variation attribute to both this block and the parent field wrapper.
	useEffect( () => {
		setAttributes( { variation: matchedKey } );
		if ( parentClientId ) {
			updateBlockAttributes( parentClientId, { variation: matchedKey } );
		}
	}, [ matchedKey, parentClientId, setAttributes, updateBlockAttributes ] );

	const iconChar = glyphs[ matchedKey ].char;

	// Shared toolbar handlers
	const updateMax = newMax => {
		const newProps = {
			max: newMax,
			default: newMax < defaultValue ? newMax : defaultValue,
		};
		setAttributes( newProps );
		if ( parentClientId ) {
			updateBlockAttributes( parentClientId, newProps );
		}
	};

	const updateVariation = newVariation => {
		if ( newVariation === variation ) {
			return;
		}

		// Retrieve parent className to replicate style class manipulation
		const cleanedClassName = ( classNameAttr || '' ).replace( /is-style-[^\s]+/g, '' ).trim();
		const newClassName = `${ cleanedClassName } ${ `is-style-${ newVariation }` }`.trim();

		setAttributes( {
			variation: newVariation,
			className: newClassName,
		} );

		if ( parentClientId ) {
			updateBlockAttributes( parentClientId, {
				variation: newVariation,
				className: newClassName,
			} );
		}
	};

	const blockProps = useBlockProps( { 'aria-label': __( 'Select rating', 'jetpack-forms' ) } );

	return (
		<div { ...blockProps }>
			<BlockControls>
				<RatingToolbar
					variation={ variation }
					max={ max }
					onUpdateVariation={ updateVariation }
					onUpdateMax={ updateMax }
				/>
			</BlockControls>

			<Symbols max={ max } value={ defaultValue } onChange={ updateDefault } char={ iconChar } />
		</div>
	);
}
