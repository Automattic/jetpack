import { InspectorControls, useBlockEditContext } from '@wordpress/block-editor';
import {
	BaseControl,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanelItem as ToolsPanelItem, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const PERCENTAGE_WIDTHS = [ 25, 50, 75, 100 ];

export default function JetpackFieldDimensionControls( { setAttributes, width } ) {
	const { clientId } = useBlockEditContext();
	const parentLayoutType = useSelect(
		select => {
			const { getBlockRootClientId, getBlockAttributes } = select( 'core/block-editor' );
			const rootClientId = getBlockRootClientId( clientId );
			return getBlockAttributes( rootClientId )?.layout?.type;
		},
		[ clientId ]
	);

	// The custom width control isn't shown for flex and grid layouts,
	// WordPress core displays its own dimension controls.
	//
	// The width control is also incompatible with constrained layout,
	// so it is not supported. This is due to the width of the constrained
	// content being unknown, so the correct styles cannot be calculated.
	//
	// Flow layout is much simpler to support, so it is supported.
	if (
		parentLayoutType === 'flex' ||
		parentLayoutType === 'grid' ||
		parentLayoutType === 'constrained'
	) {
		return null;
	}

	return (
		<InspectorControls group="dimensions">
			<ToolsPanelItem
				hasValue={ () => !! width }
				label={ __( 'Width', 'jetpack-forms' ) }
				onDeselect={ () =>
					setAttributes( {
						width: undefined,
					} )
				}
				isShownByDefault
			>
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
			</ToolsPanelItem>
		</InspectorControls>
	);
}
