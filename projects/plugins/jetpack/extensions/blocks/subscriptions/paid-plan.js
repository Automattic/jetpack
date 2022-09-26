import { PanelBody, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import GetAddPaidPlanButton from './utils';

export function PaidPlanPanel() {
	const title = __( 'Paid Newsletter', 'jetpack' );
	const text = __( 'Create plans for the readers to pay for the content', 'jetpack' );
	return (
		<>
			<PanelBody title={ title } opened={ true }>
				<PanelRow>{ text }</PanelRow>
				<PanelRow>
					<GetAddPaidPlanButton />
				</PanelRow>
			</PanelBody>
		</>
	);
}
