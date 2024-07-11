import { InnerBlocks } from '@wordpress/block-editor';
import { compose, withInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import clsx from 'clsx';
import { useFormStyle } from '../util/form';
import { withSharedFieldAttributes } from '../util/with-shared-field-attributes';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

const ALLOWED_BLOCKS = [ 'jetpack/field-option' ];

function JetpackFieldMultiple( props ) {
	const {
		className,
		clientId,
		id,
		type,
		instanceId,
		required,
		requiredText,
		label,
		setAttributes,
		isSelected,
		width,
		options,
		attributes,
	} = props;
	const formStyle = useFormStyle( clientId );

	const innerBlocks = useSelect(
		select => {
			return select( 'core/block-editor' ).getBlock( clientId ).innerBlocks;
		},
		[ clientId ]
	);

	const classes = clsx( className, 'jetpack-field jetpack-field-multiple', {
		'is-selected': isSelected,
		'has-placeholder': ( options && options.length ) || innerBlocks.length,
	} );

	const { blockStyle } = useJetpackFieldStyles( attributes );

	return (
		<>
			<div
				id={ `jetpack-field-multiple-${ instanceId }` }
				className={ classes }
				style={ blockStyle }
			>
				<JetpackFieldLabel
					required={ required }
					requiredText={ requiredText }
					label={ label }
					setAttributes={ setAttributes }
					isSelected={ isSelected }
					attributes={ attributes }
					style={ formStyle }
				/>
				<div className="jetpack-field-multiple__list">
					<InnerBlocks
						allowedBlocks={ ALLOWED_BLOCKS }
						template={ [ [ `jetpack/field-option-${ type }`, {} ] ] }
						templateInsertUpdatesSelection={ false }
					/>
				</div>
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
}

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
)( JetpackFieldMultiple );
