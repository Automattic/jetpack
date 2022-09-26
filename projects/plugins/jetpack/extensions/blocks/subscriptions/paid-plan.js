import { PanelBody, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import GetAddPaidPlanButton from './utils';

export function PaidPlanPanel() {
	const title = __( 'Paid Newsletter', 'jetpack' );
	const text = __( 'Set up a paid plan for readers to access your content.', 'jetpack' );
	return (
		<>
			<PanelBody title={ title } initialOpen={ true }>
				<PanelRow>{ text }</PanelRow>
				<PanelRow>
					<GetAddPaidPlanButton />
				</PanelRow>
			</PanelBody>
		</>
	);
}
