import { BaseControl, PanelBody, TextControl, ExternalLink, Path } from '@wordpress/components';
import { Fragment, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import HelpMessage from '../../components/help-message';
import { getIconColor } from '../../util/block-icons';
import renderMaterialIcon from '../../util/render-material-icon';

export const salesforceLeadFormVariation = {
	name: 'salesforce-web-to-lead-form',
	title: __( 'Salesforce Lead Form', 'jetpack-forms' ),
	description: __( 'Add a Salesforce Lead form to your site', 'jetpack-forms' ),
	icon: renderMaterialIcon(
		<Path
			d="M10.6778 7.72509C11.1949 7.1895 11.9152 6.8509 12.7094 6.8509C13.7682 6.8509 14.6855 7.4419 15.178 8.31608C15.6028 8.12524 16.0768 8.02059 16.5755 8.02059C18.4839 8.02059 20.0229 9.57811 20.0229 11.4988C20.0229 13.4196 18.4777 14.9771 16.5755 14.9771C16.3415 14.9771 16.1138 14.9525 15.8983 14.9094C15.4674 15.6789 14.6424 16.2022 13.6944 16.2022C13.3004 16.2022 12.9248 16.1099 12.5924 15.9498C12.1553 16.9779 11.1334 17.7043 9.94523 17.7043C8.70783 17.7043 7.64896 16.9225 7.24265 15.8205C7.06412 15.8574 6.87943 15.8759 6.69475 15.8759C5.21725 15.8759 4.02295 14.6693 4.02295 13.1733C4.02295 12.176 4.55854 11.3018 5.35885 10.834C5.19263 10.4584 5.10029 10.0398 5.10029 9.59658C5.09413 7.8913 6.49159 6.5 8.20302 6.5C9.21264 6.5 10.1114 6.98018 10.6778 7.72509Z"
			fill={ getIconColor() }
		/>,
		24,
		24,
		'0 0 24 24'
	),
	innerBlocks: [
		[
			'jetpack/field-email',
			{
				required: true,
				label: __( 'Business Email', 'jetpack-forms' ),
				id: 'email',
			},
		],
		[
			'jetpack/field-name',
			{
				required: true,
				label: __( 'First Name', 'jetpack-forms' ),
				id: 'first_name',
			},
		],
		[
			'jetpack/field-name',
			{
				required: true,
				label: __( 'Last Name', 'jetpack-forms' ),
				id: 'last_name',
			},
		],
		[
			'jetpack/field-text',
			{
				required: true,
				label: __( 'Job Title', 'jetpack-forms' ),
				id: 'title',
			},
		],
		[
			'jetpack/field-text',
			{
				required: true,
				label: __( 'Company', 'jetpack-forms' ),
				id: 'company',
			},
		],
		[
			'jetpack/field-telephone',
			{
				required: true,
				label: __( 'Phone Number', 'jetpack-forms' ),
				id: 'phone',
			},
		],
		[
			'jetpack/button',
			{
				text: __( 'Submit', 'jetpack-forms' ),
				element: 'button',
				lock: { remove: true },
			},
		],
	],
	attributes: {
		subject: __( 'New lead received from your website', 'jetpack-forms' ),
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

	const betaBadgeStyle = {
		padding: '3px 6px',
		'border-radius': '4px',
		background: '#2FB41F',
		color: 'white',
		display: 'block',
		'font-weight': 600,
		'font-size': '11px',
	};

	return (
		<Fragment>
			<PanelBody title={ __( 'Salesforce', 'jetpack-forms' ) } initialOpen={ true }>
				<BaseControl>
					<TextControl
						label={ __( 'Organization ID', 'jetpack-forms' ) }
						value={ salesforceData.organizationId || '' }
						placeholder={ __( 'Enter your Organization ID', 'jetpack-forms' ) }
						onBlur={ onBlurOrgIdField }
						onChange={ setOrganizationId }
						help={ __( 'Enter the Salesforce organization ID to send Leads to.', 'jetpack-forms' ) }
					/>
					{ organizationIdError && (
						<HelpMessage isError id={ `contact-form-${ instanceId }-email-error` }>
							{ __(
								'Invalid Organization ID. Should be a 15 - 18 characters long alphanumeric string.',
								'jetpack-forms'
							) }
						</HelpMessage>
					) }
					<ExternalLink href="https://help.salesforce.com/s/articleView?id=000325251&type=1">
						{ __( 'Where to find your Salesforce Organization ID', 'jetpack-forms' ) }
					</ExternalLink>
					<p style={ { 'margin-top': '32px', display: 'flex', 'font-size': '12px', gap: '8px' } }>
						<div>
							<span style={ betaBadgeStyle }>BETA</span>
						</div>
						<div>
							{ __(
								'This premium feature is currently free to use as it is in beta.',
								'jetpack-forms'
							) }
						</div>
					</p>
				</BaseControl>
			</PanelBody>
		</Fragment>
	);
};
