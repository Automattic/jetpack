import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import useCreateForm from '../../../../../dashboard/hooks/use-create-form.ts';

type Props = {
	className?: string;
};

export default function CreateSalesforceLeadFormButton( { className }: Props ) {
	const { openNewForm } = useCreateForm();

	const handleClick = () => {
		openNewForm( {
			formPattern: 'salesforce-lead-form',
			analyticsEvent: () => {
				if ( window.jetpackAnalytics?.tracks ) {
					window.jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_salesforce_lead_form_click' );
				}
			},
		} );
	};

	return (
		<Button variant="primary" onClick={ handleClick } className={ className }>
			{ __( 'Create Salesforce lead form', 'jetpack-forms' ) }
		</Button>
	);
}
