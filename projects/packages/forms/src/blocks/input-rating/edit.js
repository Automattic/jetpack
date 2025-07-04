import {
	useBlockProps,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import Stars from './stars';

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
				<Stars max={ max } value={ defaultValue } onChange={ updateDefault } />
			</div>
		</>
	);
}
