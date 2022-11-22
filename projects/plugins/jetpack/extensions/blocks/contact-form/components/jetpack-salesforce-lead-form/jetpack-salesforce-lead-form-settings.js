import { BaseControl, PanelBody, TextControl, ExternalLink, Path } from '@wordpress/components';
import { Fragment, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../../../shared/block-icons';
import HelpMessage from '../../../../shared/help-message';
import renderMaterialIcon from '../../../../shared/render-material-icon';

export const salesforceLeadFormVariation = {
	name: 'salesforce-web-to-lead-form',
	title: __( 'Salesforce Lead Form', 'jetpack' ),
	description: __( 'Add a Salesforce Lead form to your site', 'jetpack' ),
	icon: renderMaterialIcon(
		<Path
			d="m113 21.3c8.78-9.14 21-14.8 34.5-14.8 18 0 33.6 10 42 24.9a58 58 0 0 1 23.7-5.05c32.4 0 58.7 26.5 58.7 59.2s-26.3 59.2-58.7 59.2c-3.96 0-7.82-0.398-11.6-1.15-7.35 13.1-21.4 22-37.4 22a42.7 42.7 0 0 1-18.8-4.32c-7.45 17.5-24.8 29.8-45 29.8-21.1 0-39-13.3-45.9-32a45.1 45.1 0 0 1-9.34 0.972c-25.1 0-45.4-20.6-45.4-45.9 0-17 9.14-31.8 22.7-39.8a52.6 52.6 0 0 1-4.35-21c0-29.2 23.7-52.8 52.9-52.8 17.1 0 32.4 8.15 42 20.8"
			fill={ getIconColor() }
		/>,
		48,
		48,
		'-16 -48 300 320'
	),
	innerBlocks: [
		[
			'jetpack/field-email',
			{
				required: true,
				label: __( 'Business Email', 'jetpack' ),
				id: 'email',
			},
		],
		[
			'jetpack/field-name',
			{
				required: true,
				label: __( 'First Name', 'jetpack' ),
				id: 'first_name',
			},
		],
		[
			'jetpack/field-name',
			{
				required: true,
				label: __( 'Last Name', 'jetpack' ),
				id: 'last_name',
			},
		],
		[
			'jetpack/field-text',
			{
				required: true,
				label: __( 'Job Title', 'jetpack' ),
				id: 'title',
			},
		],
		[
			'jetpack/field-text',
			{
				required: true,
				label: __( 'Company', 'jetpack' ),
				id: 'company',
			},
		],
		[
			'jetpack/field-telephone',
			{
				required: true,
				label: __( 'Phone Number', 'jetpack' ),
				id: 'phone',
			},
		],
		[
			'jetpack/button',
			{
				text: __( 'Submit', 'jetpack' ),
				element: 'button',
				lock: { remove: true },
			},
		],
	],
	attributes: {
		subject: __( 'New lead received from your website', 'jetpack' ),
		salesforceData: {
			organizationId: '',
			sendToSalesforce: true,
		},
		style: {
			spacing: {
				padding: {
					top: '16px',
					right: '16px',
					bottom: '16px',
					left: '16px',
				},
			},
		},
	},
};

export default ( { salesforceData, setAttributes, instanceId } ) => {
	const [ organizationIdError, setOrganizationIdError ] = useState( false );

	const setSalesforceData = attributePair => {
		setAttributes( {
			salesforceData: {
				...salesforceData,
				...attributePair,
			},
		} );
	};

	const setOrganizationId = value => {
		setOrganizationIdError( false );
		setSalesforceData( { organizationId: value.trim() } );
	};

	const onBlurOrgIdField = e => {
		setOrganizationIdError( ! e.target.value.trim().match( /^[a-zA-Z0-9]{15,18}$/ ) );
	};

	return (
		<Fragment>
			<PanelBody title={ __( 'Salesforce', 'jetpack' ) } initialOpen={ true }>
				<BaseControl>
					<TextControl
						label={ __( 'Organization ID', 'jetpack' ) }
						value={ salesforceData.organizationId || '' }
						placeholder={ __( 'Enter your Organization ID', 'jetpack' ) }
						onBlur={ onBlurOrgIdField }
						onChange={ setOrganizationId }
						help={ __( 'Enter the Salesforce organization ID to send Leads to.', 'jetpack' ) }
					/>
					{ organizationIdError && (
						<HelpMessage isError id={ `contact-form-${ instanceId }-email-error` }>
							{ __(
								'Invalid Organization ID. Should be a 15 - 18 characters long alphanumeric string.',
								'jetpack'
							) }
						</HelpMessage>
					) }
					<ExternalLink href="https://help.salesforce.com/s/articleView?id=000325251&type=1">
						{ __( 'Where to find your Salesforce Organization ID', 'jetpack' ) }
					</ExternalLink>
				</BaseControl>
			</PanelBody>
		</Fragment>
	);
};
