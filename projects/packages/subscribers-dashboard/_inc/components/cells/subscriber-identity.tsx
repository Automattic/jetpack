import type { Subscriber } from '../../data/types';

type Props = {
	subscriber: Subscriber;
};

/**
 * Identity cell — gravatar + display name + email stacked, mirroring Calypso's
 * `subscriber-profile--compact` block.
 *
 * @param props            - Component props.
 * @param props.subscriber - Subscriber row.
 * @return Identity cell.
 */
export default function SubscriberIdentity( { subscriber }: Props ): JSX.Element {
	const { display_name, email_address, avatar } = subscriber;
	const showEmail = !! email_address && email_address !== display_name;

	return (
		<div className="jetpack-subscribers-dashboard__identity">
			{ avatar ? (
				<img
					className="jetpack-subscribers-dashboard__identity-avatar"
					src={ avatar }
					alt=""
					width={ 40 }
					height={ 40 }
				/>
			) : null }
			<div className="jetpack-subscribers-dashboard__identity-text">
				<span className="jetpack-subscribers-dashboard__identity-name">
					{ display_name || email_address }
				</span>
				{ showEmail ? (
					<span className="jetpack-subscribers-dashboard__identity-email">{ email_address }</span>
				) : null }
			</div>
		</div>
	);
}
