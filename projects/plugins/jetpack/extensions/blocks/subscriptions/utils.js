import { Button, ToolbarButton } from '@wordpress/components';
import { _x } from '@wordpress/i18n';

export const getPaidPlanLink = hasNewsletterPlans => {
	const link = 'https://wordpress.com/earn/payments-plans/' + location.hostname;
	return hasNewsletterPlans ? link : link + '#add-newsletter-payment-plan';
};

export const isNewsletterFeatureEnabled = () => {
	return !! window?.Jetpack_Editor_Initial_State?.available_blocks[
		'paid-newsletters-in-subscriptions' // We probably want to introduce a new "extension" instaed of reusing this one.
	];
};

export default function GetAddPaidPlanButton( { context = 'other', hasNewsletterPlans } ) {
	const addPaidPlanButtonText = hasNewsletterPlans
		? _x( 'Manage plans', 'unused context to distinguish translations', 'jetpack' )
		: _x( 'Add paid plan', '', 'jetpack' );

	if ( 'toolbar' === context ) {
		return (
			<ToolbarButton href={ getPaidPlanLink( hasNewsletterPlans ) } target="_blank">
				{ addPaidPlanButtonText }
			</ToolbarButton>
		);
	}

	return (
		<Button variant="primary" href={ getPaidPlanLink( hasNewsletterPlans ) } target="_blank">
			{ addPaidPlanButtonText }
		</Button>
	);
}
