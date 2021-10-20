/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
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
export const MAX_COLUMNS = 8;
export const DEFAULT_COLUMNS = 2;
const MIN_ROUNDED_CORNERS = 0;
const MAX_ROUNDED_CORNERS = 20;
const DEFAULT_ROUNDED_CORNERS = 2;

const TiledGallerySettings = props => {
	const horizontalSettingsDivider = usePreferredColorSchemeStyle(
		styles.horizontalBorder,
		styles.horizontalBorderDark
	);

	const { setAttributes, linkTo, columns, roundedCorners } = props;
	const [ columnNumber, setColumnNumber ] = useState( columns ?? DEFAULT_COLUMNS );
	useEffect( () => {
		setColumnNumber( columns );
	}, [ columns ] );

	const [ roundedCornerRadius, setRoundedCornerRadius ] = useState(
		roundedCorners ?? DEFAULT_ROUNDED_CORNERS
	);
	const [ linkToURL, setLinkToURL ] = useState( linkTo ?? '' );

	const linkSettingsOptions = {
		url: {
			label: __( 'Link URL', 'jetpack' ),
			placeholder: __( 'Add URL', 'jetpack' ),
			autoFocus: true,
			autoFill: true,
		},
	};

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Tiled gallery settings', 'jetpack' ) } />
			<PanelBody>
				<UnitControl
					label={ __( 'Columns', 'jetpack' ) }
					min={ MIN_COLUMNS }
					max={ MAX_COLUMNS }
					value={ columnNumber }
					onChange={ value => {
						setColumnNumber( value );
						setAttributes( { columns: value } );
					} }
				/>
			</PanelBody>
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
			<PanelBody>
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
			</PanelBody>
		</InspectorControls>
	);
};

export default TiledGallerySettings;
