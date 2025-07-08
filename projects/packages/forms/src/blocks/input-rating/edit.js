import {
	useBlockProps,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { DEFAULT_GLYPHS } from './constants';
import Symbols from './symbols';

export default function RatingInputEdit( { clientId, attributes, setAttributes } ) {
	const { max, default: defaultValue, className = '' } = attributes;

	const { parentClientId } = useSelect(
		select => {
			const { getBlockRootClientId } = select( blockEditorStore );
			return { parentClientId: getBlockRootClientId( clientId ) };
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const updateMax = newMax => {
		// update local attribute so the control reflects immediately
		const newProps = {
			max: newMax,
			default: newMax < defaultValue ? newMax : defaultValue,
		};
		setAttributes( newProps );

		// propagate to parent field-rating so it is saved and rendered on front-end
		if ( parentClientId ) {
			updateBlockAttributes( parentClientId, newProps );
		}
	};

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
	const matchedKey =
		glyphKeys.find( key => className.includes( `is-style-${ key }` ) ) || glyphKeys[ 0 ];

	const iconChar = glyphs[ matchedKey ].char;

	const blockProps = useBlockProps( { 'aria-label': __( 'Select rating', 'jetpack-forms' ) } );

	return (
		<>
			<InspectorControls>
				<PanelBody title="Rating settings">
					<RangeControl
						label="Highest rating"
						min={ 2 }
						max={ 10 }
						value={ max }
						onChange={ updateMax }
					/>
					<RangeControl
						label="Default value"
						min={ 0 }
						max={ max }
						value={ defaultValue }
						onChange={ updateDefault }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<Symbols max={ max } value={ defaultValue } onChange={ updateDefault } char={ iconChar } />
			</div>
		</>
	);
}
