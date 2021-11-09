/**
 * WordPress dependencies
 */
import { BlockStyles, InspectorControls } from '@wordpress/block-editor';
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
import { LAYOUT_CIRCLE, LAYOUT_STYLES } from './constants';
import { getActiveStyleName } from '../../shared/block-styles';

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

	const { setAttributes, linkTo, columns, roundedCorners, clientId, className } = props;
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

	const layoutStyle = getActiveStyleName( LAYOUT_STYLES, className );

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Tiled gallery settings', 'jetpack' ) } />
			<PanelBody style={ styles.panelBody }>
				<BlockStyles clientId={ clientId } url={ `https://placekitten.com/${ 300 }/${ 300 }` } />
			</PanelBody>
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
