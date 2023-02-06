import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl, UnitControl } from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getActiveStyleName } from '../../shared/block-styles';
import { LAYOUT_CIRCLE, LAYOUT_STYLES, MAX_COLUMNS, MAX_ROUNDED_CORNERS } from './constants';
import LayoutPicker from './layout-picker.native';
import styles from './styles.scss';

const MIN_COLUMNS = 1;
export const DEFAULT_COLUMNS = 2;
const MIN_ROUNDED_CORNERS = 0;
const DEFAULT_ROUNDED_CORNERS = 2;

const TiledGallerySettings = props => {
	const horizontalSettingsDivider = usePreferredColorSchemeStyle(
		styles.horizontalBorder,
		styles.horizontalBorderDark
	);

	const { setAttributes, numImages, columns, roundedCorners, clientId, className } = props;
	const [ columnNumber, setColumnNumber ] = useState( columns ?? DEFAULT_COLUMNS );
	useEffect( () => {
		setColumnNumber( columns );
	}, [ columns ] );

	const [ roundedCornerRadius, setRoundedCornerRadius ] = useState(
		roundedCorners ?? DEFAULT_ROUNDED_CORNERS
	);

	const layoutStyle = getActiveStyleName( LAYOUT_STYLES, className );

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Tiled gallery settings', 'jetpack' ) } />

			<PanelBody>
				<LayoutPicker clientId={ clientId } className={ className } />
			</PanelBody>
			<PanelBody>
				<UnitControl
					label={ __( 'Columns', 'jetpack' ) }
					min={ MIN_COLUMNS }
					max={ MAX_COLUMNS }
					value={ Math.min( columnNumber, numImages ) }
					onChange={ value => {
						setColumnNumber( value );
						setAttributes( { columns: value } );
					} }
				/>
			</PanelBody>
			{ layoutStyle !== LAYOUT_CIRCLE && (
				<PanelBody style={ horizontalSettingsDivider }>
					<RangeControl
						label={ __( 'Rounded corners', 'jetpack' ) }
						minimumValue={ MIN_ROUNDED_CORNERS }
						maximumValue={ MAX_ROUNDED_CORNERS }
						value={ roundedCornerRadius }
						onChange={ value => {
							setRoundedCornerRadius( value );
							setAttributes( { roundedCorners: value } );
						} }
					/>
				</PanelBody>
			) }
		</InspectorControls>
	);
};

export default TiledGallerySettings;
