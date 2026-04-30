import Gravatar from '@automattic/jetpack-components/gravatar';
import { Stack, Text } from '@wordpress/ui';
import type { Subscriber } from '../../data/types';

type Props = {
	subscriber: Subscriber;
};

/**
 * Identity cell — circular avatar followed by display name with the email
 * stacked underneath when distinct. Mirrors Forms' inbox-row layout where the
 * avatar lives next to the title (instead of in DataViews' boxy `mediaField`
 * slot, which adds a square outline that doesn't suit a circular Gravatar).
 *
 * @param props            - Component props.
 * @param props.subscriber - Subscriber row.
 * @return Identity cell.
 */
export default function SubscriberIdentity( { subscriber }: Props ): JSX.Element {
	const { display_name, email_address } = subscriber;
	const showEmail = !! email_address && email_address !== display_name;

	return (
		<Stack
			direction="row"
			align="center"
			gap="sm"
			className="jetpack-subscribers-dashboard__identity"
		>
			{ email_address ? (
				<Gravatar
					email={ email_address }
					displayName={ display_name }
					size={ 32 }
					useHovercard={ false }
					className="jetpack-subscribers-dashboard__identity-avatar"
				/>
			) : null }
			<Stack direction="column" gap="xs" className="jetpack-subscribers-dashboard__identity-text">
				<Text variant="body-md">{ display_name || email_address }</Text>
				{ showEmail ? (
					<Text variant="body-sm" className="jetpack-subscribers-dashboard__identity-email">
						{ email_address }
					</Text>
				) : null }
			</Stack>
		</Stack>
	);
}
