import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import './self-only-notice.scss';

type Props = {
	onAddSubscribers: () => void;
};

/**
 * Prompt shown above the table when the viewer's own subscription is the only row. The list is
 * technically populated, so DataViews' `empty` slot — and the "Add subscribers" CTA it carries —
 * never fires; this keeps that nudge in front of a creator who has nobody to send to yet.
 *
 * @param props                  - Component props.
 * @param props.onAddSubscribers - Opens the Add Subscribers modal.
 * @return Notice element.
 */
export default function SelfOnlyNotice( { onAddSubscribers }: Props ): JSX.Element {
	// Explicit `spokenMessage` because Notice.Root otherwise renderToString()s its children
	// mid-render, which corrupts hook order once those children include an action button.
	const message = __(
		'You’re currently your only subscriber. Invite readers by email to grow your newsletter.',
		'jetpack-newsletter'
	);

	return (
		<Notice.Root
			className="jetpack-newsletter-self-only-notice"
			intent="info"
			spokenMessage={ message }
		>
			<Notice.Description>{ message }</Notice.Description>
			<Notice.Actions>
				<Notice.ActionButton onClick={ onAddSubscribers }>
					{ __( 'Add subscribers', 'jetpack-newsletter' ) }
				</Notice.ActionButton>
			</Notice.Actions>
		</Notice.Root>
	);
}
