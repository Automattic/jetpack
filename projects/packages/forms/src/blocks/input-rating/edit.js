import { useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { DEFAULT_GLYPHS } from './constants';
import Symbols from './symbols';

export default function RatingInputEdit( { clientId, attributes, setAttributes } ) {
	const { max, default: defaultValue } = attributes;

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

	const iconChar = glyphs[ matchedKey ].char;

	const blockProps = useBlockProps( { 'aria-label': __( 'Select rating', 'jetpack-forms' ) } );

	return (
		<div { ...blockProps }>
			<Symbols max={ max } value={ defaultValue } onChange={ updateDefault } char={ iconChar } />
		</div>
	);
}
