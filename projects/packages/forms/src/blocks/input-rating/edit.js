import {
	useBlockProps,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import Stars from '../field-rating/stars';

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

	const updateMax = newMax => {
		// update local attribute so the control reflects immediately
		setAttributes( { max: newMax } );

		// propagate to parent field-rating so it is saved and rendered on front-end
		if ( parentClientId ) {
			updateBlockAttributes( parentClientId, { max: newMax } );
		}
	};

	const updateValue = newVal => {
		setAttributes( { value: newVal } );
		if ( parentClientId ) {
			updateBlockAttributes( parentClientId, { default: newVal } );
		}
	};

	const blockProps = useBlockProps();

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
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<Stars max={ max } value={ defaultValue } onChange={ updateValue } />
			</div>
		</>
	);
}
