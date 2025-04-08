import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { compose, withInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import clsx from 'clsx';
import { useFormStyle, useFormWrapper } from '../../util/form';
import { withSharedFieldAttributes } from '../../util/with-shared-field-attributes';
import JetpackFieldControls from '../jetpack-field-controls';
import JetpackFieldLabel from '../jetpack-field-label';
import { useJetpackFieldStyles } from '../use-jetpack-field-styles';

const JetpackFieldChoiceEdit = props => {
	const { className, clientId, instanceId, setAttributes, isSelected, attributes, type } = props;
	const { required, requiredText, options, id, width } = attributes;

	useFormWrapper( props );

	const innerBlocks = useSelect(
		select => select( 'core/block-editor' ).getBlock( clientId ).innerBlocks,
		[ clientId ]
	);
	const classes = clsx( className, 'jetpack-field jetpack-field-multiple', {
		'is-selected': isSelected,
		'has-placeholder': ( options && options.length ) || innerBlocks.length,
	} );
	const formStyle = useFormStyle( clientId );
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const blockProps = useBlockProps( {
		id: `jetpack-field-multiple-${ instanceId }`,
		style: blockStyle,
		className: classes,
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		defaultBlock: `jetpack/field-option-${ type }`,
		template: [ [ `jetpack/field-option-${ type }` ] ],
		templateInsertUpdatesSelection: true,
	} );

	return (
		<>
			<div { ...blockProps }>
				<JetpackFieldLabel
					required={ required }
					requiredText={ requiredText }
					label={ attributes.label }
					setAttributes={ setAttributes }
					isSelected={ isSelected }
					attributes={ attributes }
					style={ formStyle }
				/>
				<ul { ...innerBlocksProps } className="jetpack-field-multiple__list" />
			</div>

			<JetpackFieldControls
				blockClassNames={ classes }
				clientId={ clientId }
				id={ id }
				required={ required }
				attributes={ attributes }
				setAttributes={ setAttributes }
				type={ type }
				width={ width }
				hidePlaceholder
			/>
		</>
	);
};

export default compose(
	withSharedFieldAttributes( [
		'borderRadius',
		'borderWidth',
		'labelFontSize',
		'fieldFontSize',
		'lineHeight',
		'labelLineHeight',
		'inputColor',
		'labelColor',
		'fieldBackgroundColor',
		'buttonBackgroundColor',
		'buttonBorderRadius',
		'buttonBorderWidth',
		'borderColor',
	] ),
	withInstanceId
)( JetpackFieldChoiceEdit );
