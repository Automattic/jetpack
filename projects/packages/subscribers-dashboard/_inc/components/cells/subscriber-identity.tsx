import { Stack, Text } from '@wordpress/ui';
import type { Subscriber } from '../../data/types';

type Props = {
	subscriber: Subscriber;
};

/**
 * Identity cell — display name with the email stacked underneath when distinct. The avatar is
 * rendered separately by DataViews via `mediaField`, so we don't draw it here.
 *
 * @param props            - Component props.
 * @param props.subscriber - Subscriber row.
 * @return Identity cell.
 */
export default function SubscriberIdentity( { subscriber }: Props ): JSX.Element {
	const { display_name, email_address } = subscriber;
	const showEmail = !! email_address && email_address !== display_name;

	return (
		<Stack direction="column" gap="xs" className="jetpack-subscribers-dashboard__identity">
			<Text variant="body-md">{ display_name || email_address }</Text>
			{ showEmail ? (
				<Text variant="body-sm" className="jetpack-subscribers-dashboard__identity-email">
					{ email_address }
				</Text>
			) : null }
		</Stack>
	);
}
