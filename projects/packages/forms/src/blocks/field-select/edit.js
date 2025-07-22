import {
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import { ALLOWED_INNER_BLOCKS } from '../shared/util/constants';

export default function DropdownFieldEdit( props ) {
	const { attributes, clientId, isSelected, name, setAttributes } = props;
	const { id, options, required, width } = attributes;
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const { isInnerBlockSelected, inputBlockAttributes } = useSelect(
		select => {
			const { getBlock, hasSelectedInnerBlock } = select( blockEditorStore );
			return {
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
				inputBlockAttributes: getBlock( clientId ).innerBlocks[ 1 ]?.attributes,
			};
		},
		[ clientId ]
	);

	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-field-dropdown', {
			'is-selected': isSelected || isInnerBlockSelected,
			'has-placeholder': !! inputBlockAttributes?.placeholder,
		} ),
		style: blockStyle,
	} );

	const optionsWrapper = useRef( undefined );
	useFormWrapper( { attributes, clientId, name } );

	const template = useMemo( () => {
		return [
			[ 'jetpack/label', { required } ],
			[
				'jetpack/input',
				{ type: 'dropdown', placeholder: __( 'Select one option', 'jetpack-forms' ) },
			],
			[ 'jetpack/dropdown', { options, lock: { move: true, remove: true } } ],
		];
	}, [ required, options ] );

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'jetpack-field-dropdown__wrapper' },
		{
			allowedBlocks: [ ...ALLOWED_INNER_BLOCKS, 'jetpack/dropdown' ],
			template,
			templateLock: 'all',
		}
	);
	/*
	const optionWrapperStyles = {
		className: 'jetpack-field-dropdown__popover',
	};

	const changeFocus = ( index, cursorToEnd ) =>
		setFocus( optionsWrapper.current, '[role=textbox]', index, cursorToEnd );
*/
	return (
		<>
			<div { ...blockProps }>
				<div { ...innerBlocksProps } />
				<JetpackFieldControls
					id={ id }
					required={ required }
					attributes={ attributes }
					setAttributes={ setAttributes }
					width={ width }
					type="dropdown"
				/>
				<InspectorControls>
					<PanelBody title={ __( 'Options', 'jetpack-forms' ) }>
						{ options.filter( opt => opt ).length && (
							<ul>
								{ options.map( ( option, index ) => ( option ? <li>{ option }</li> : null ) ) }
							</ul>
						) }
					</PanelBody>
				</InspectorControls>
			</div>
		</>
	);
}
