import { PanelBody, PanelRow, Button } from "@wordpress/components";
import { __, sprintf } from '@wordpress/i18n';

import { getPaidPlanLink } from "./utils";

export function PaidPlanPanel(){
	const title = __( 'Paid Newsletter', 'jetpack' );
	const text = __( 'Create plans for the readers to pay for the content', 'jetpack' );
	return (
		<>
			<PanelBody title={ title } opened={ true }>
				<PanelRow>
					{ text }
				</PanelRow>
				<PanelRow>
					<Button variant="primary" href={ getPaidPlanLink() } target="_blank">{ __( 'Add paid plan', 'jetpack' ) }</Button>
				</PanelRow>
				{/* <PanelRow>
					Secure Payments are set up. <a href="">Configure</a>
				</PanelRow> */}
			</PanelBody>
		</>
	);
};
