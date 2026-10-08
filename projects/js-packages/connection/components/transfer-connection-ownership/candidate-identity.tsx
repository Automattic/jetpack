/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './style.scss';

export interface AvatarBadgeProps {
	/** Name the badge stands for. */
	name: string;
	/** Whether this is the person taking ownership over. */
	isIncoming?: boolean;
}

/**
 * Round initials badge for one person.
 *
 * Initials rather than a Gravatar: the outgoing owner has no avatar to show — script data
 * carries their name alone — so fetching one for the other side would only mismatch it.
 *
 * @param {AvatarBadgeProps} props - Component props.
 * @return {import('react').ReactNode} The AvatarBadge component.
 */
export const AvatarBadge = ( { name, isIncoming }: AvatarBadgeProps ) => {
	const initials = name
		.split( /\s+/ )
		.slice( 0, 2 )
		.map( part => part.charAt( 0 ) )
		.join( '' )
		.toUpperCase();

	return (
		<span
			className={
				isIncoming
					? 'jp-connection__transfer-ownership__avatar is-incoming'
					: 'jp-connection__transfer-ownership__avatar'
			}
			aria-hidden="true"
		>
			{ initials }
		</span>
	);
};

export interface CandidateIdentityProps {
	/** Display name. */
	displayName: string;
	/** Login, shown under the name. */
	login: string;
	/** Email address, shown beside the login. */
	email?: string;
}

/**
 * Avatar, display name and login for one person, shown on the done step.
 *
 * @param {CandidateIdentityProps} props - Component props.
 * @return {import('react').ReactNode} The CandidateIdentity component.
 */
const CandidateIdentity = ( { displayName, login, email }: CandidateIdentityProps ) => (
	<div className="jp-connection__transfer-ownership__identity">
		<AvatarBadge name={ displayName } isIncoming />
		<span className="jp-connection__transfer-ownership__who">
			<strong>{ displayName }</strong>
			<span className="jp-connection__transfer-ownership__meta">
				{ email
					? sprintf(
							/* translators: %1$s: user login. %2$s: user email address. */
							__( '%1$s (%2$s)', 'jetpack-connection-js' ),
							login,
							email
						)
					: login }
			</span>
		</span>
	</div>
);

export default CandidateIdentity;
