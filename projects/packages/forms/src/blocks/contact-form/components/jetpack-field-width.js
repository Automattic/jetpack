import { useBlockEditContext } from '@wordpress/block-editor';
import {
	BaseControl,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const PERCENTAGE_WIDTHS = [ 25, 50, 75, 100 ];

export default function JetpackFieldWidth( { setAttributes, width } ) {
	const { clientId } = useBlockEditContext();
	const parentLayoutType = useSelect(
		select => {
			const { getBlockRootClientId, getBlockAttributes } = select( 'core/block-editor' );
			const rootClientId = getBlockRootClientId( clientId );
			return getBlockAttributes( rootClientId )?.layout?.type;
		},
		[ clientId ]
	);

	if ( parentLayoutType === 'flex' || parentLayoutType === 'grid' ) {
		return null;
	}

	return (
		<BaseControl
			help={ __(
				'Adjust the width of the field to include multiple fields on a single line.',
				'jetpack-forms'
			) }
			__nextHasNoMarginBottom
		>
			<ToggleGroupControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				aria-label={ __( 'Width', 'jetpack-forms' ) }
				isBlock
				label={ __( 'Width', 'jetpack-forms' ) }
				onChange={ value => setAttributes( { width: value } ) }
				value={ width }
			>
				{ PERCENTAGE_WIDTHS.map( widthValue => {
					return (
						<ToggleGroupControlOption
							key={ widthValue }
							label={ `${ widthValue }%` }
							value={ widthValue }
						/>
					);
				} ) }
			</ToggleGroupControl>
		</BaseControl>
	);
}
