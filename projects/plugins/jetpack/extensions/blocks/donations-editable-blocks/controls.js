/**
 * WordPress dependencies
 */
import { ExternalLink, PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * External dependencies
 */
import getSiteFragment from '../../shared/get-site-fragment';

/**
 * Internal dependencies
 */
import { ANNUAL_DONATION_TAB, MONTHLY_DONATION_TAB } from './common/constants';

const Controls = props => {
	const { attributes, setAttributes, onChange } = props;

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Settings', 'jetpack' ) }>
				<ToggleControl
					checked={ attributes[ MONTHLY_DONATION_TAB ] }
					onChange={ value => {
						setAttributes( { [ MONTHLY_DONATION_TAB ]: value } );
						onChange( MONTHLY_DONATION_TAB, value );
					} }
					label={ __( 'Show monthly donations', 'jetpack' ) }
				/>
				<ToggleControl
					checked={ attributes[ ANNUAL_DONATION_TAB ] }
					onChange={ value => {
						setAttributes( { [ ANNUAL_DONATION_TAB ]: value } );
						onChange( ANNUAL_DONATION_TAB, value );
					} }
					label={ __( 'Show annual donations', 'jetpack' ) }
				/>
				<ExternalLink href={ `https://wordpress.com/earn/payments/${ getSiteFragment() }` }>
					{ __( 'View donation earnings', 'jetpack' ) }
				</ExternalLink>
			</PanelBody>
		</InspectorControls>
	);
};

export default Controls;
