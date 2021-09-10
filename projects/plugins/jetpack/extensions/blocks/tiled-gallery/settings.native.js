/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	LinkSettingsNavigation,
	PanelBody,
	RangeControl,
	UnitControl,
} from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const MIN_COLUMNS = 1;
const MAX_COLUMNS = 2;
const DEFAULT_COLUMNS = 1;
const MIN_ROUNDED_CORNERS = 0;
const MAX_ROUNDED_CORNERS = 20;
const DEFAULT_ROUNDED_CORNERS = 2;

const TiledGallerySettings = props => {
	const horizontalSettingsDivider = usePreferredColorSchemeStyle(
		styles.horizontalBorder,
		styles.horizontalBorderDark
	);

	const [ columnNumber, setColumnNumber ] = useState( DEFAULT_COLUMNS );
	const [ roundedCornerRadius, setRoundedCornerRadius ] = useState( DEFAULT_ROUNDED_CORNERS );
	const [ linkToURL, setLinkToURL ] = useState( '' );

	const linkSettingsOptions = {
		url: {
			label: __( 'Link URL' ),
			placeholder: __( 'Add URL' ),
			autoFocus: true,
			autoFill: true,
		},
	};

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Tiled gallery settings' ) } />
			<PanelBody>
				<UnitControl
					label={ __( 'Columns' ) }
					min={ MIN_COLUMNS }
					max={ MAX_COLUMNS }
					value={ columnNumber }
					onChange={ value => {
						setColumnNumber( value );
					} }
				/>
			</PanelBody>
			<PanelBody style={ horizontalSettingsDivider }>
				<RangeControl
					label={ __( 'Rounded corners' ) }
					minimumValue={ MIN_ROUNDED_CORNERS }
					maximumValue={ MAX_ROUNDED_CORNERS }
					value={ roundedCornerRadius }
					onChange={ value => {
						setRoundedCornerRadius( value );
					} }
				/>
			</PanelBody>
			<LinkSettingsNavigation
				url={ linkToURL }
				setAttributes={ value => {
					setLinkToURL( value.url );
				} }
				withBottomSheet={ false }
				hasPicker
				options={ linkSettingsOptions }
				showIcon={ false }
			/>
		</InspectorControls>
	);
};

export default TiledGallerySettings;
