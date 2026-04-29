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
		<div className="jetpack-subscribers-dashboard__identity-text">
			<span className="jetpack-subscribers-dashboard__identity-name">
				{ display_name || email_address }
			</span>
			{ showEmail ? (
				<span className="jetpack-subscribers-dashboard__identity-email">{ email_address }</span>
			) : null }
		</div>
	);
}
