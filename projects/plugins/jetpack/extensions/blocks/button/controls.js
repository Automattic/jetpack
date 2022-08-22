import { useDispatch, useSelect } from '@wordpress/data';
import { WidthPanel } from '../../shared/width-panel';
import ButtonBorderPanel from './button-border-panel';
import ButtonColorsPanel from './button-colors-panel';

export default function ButtonControls( {
	attributes,
	backgroundColor,
	clientId,
	context,
	fallbackBackgroundColor,
	fallbackTextColor,
	setAttributes,
	setBackgroundColor,
	setTextColor,
	textColor,
	gradientValue,
	setGradient,
	isGradientAvailable,
} ) {
	const { align, borderRadius } = attributes;
	const isWidthSetOnParentBlock = 'jetpack/parentBlockWidth' in context;
	const width = isWidthSetOnParentBlock ? context[ 'jetpack/parentBlockWidth' ] : attributes.width;

	const parentBlock = useSelect( select => {
		const { getBlock, getBlockRootClientId } = select( 'core/block-editor' );
		return getBlock( getBlockRootClientId( clientId ) );
	} );
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const setWidth = newWidth => {
		if ( isWidthSetOnParentBlock ) {
			updateBlockAttributes( parentBlock.clientId, {
				width: newWidth,
			} );
			return;
		}

		setAttributes( { width: newWidth } );
	};

	return (
		<>
			<ButtonColorsPanel
				{ ...{
					backgroundColor,
					fallbackBackgroundColor,
					fallbackTextColor,
					gradientValue,
					setBackgroundColor,
					setGradient,
					setTextColor,
					textColor,
					isGradientAvailable,
				} }
			/>
			<ButtonBorderPanel borderRadius={ borderRadius } setAttributes={ setAttributes } />
			<WidthPanel align={ align } width={ width } onChange={ setWidth } />
		</>
	);
}
