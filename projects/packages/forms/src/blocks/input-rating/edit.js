import {
	useBlockProps,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import Stars from '../field-rating/stars';

export default function RatingInputEdit( { clientId, attributes, setAttributes } ) {
	const { maxRating, value } = attributes;

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
		setAttributes( { maxRating: newMax, maxrating: newMax } );

		// propagate to parent field-rating so it is saved and rendered on front-end
		if ( parentClientId ) {
			updateBlockAttributes( parentClientId, { maxRating: newMax, maxrating: newMax } );
		}
	};

	const updateValue = newVal => {
		setAttributes( { value: newVal } );
		if ( parentClientId ) {
			updateBlockAttributes( parentClientId, { defaultValue: newVal } );
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
						value={ maxRating }
						onChange={ updateMax }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<Stars maxRating={ maxRating } value={ value } onChange={ updateValue } />
			</div>
		</>
	);
}
