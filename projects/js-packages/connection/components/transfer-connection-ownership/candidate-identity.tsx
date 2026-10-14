/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import './style.scss';

export interface AvatarBadgeProps {
	/** Avatar URL. */
	avatar?: string;
	/** Whether this is the person taking ownership over. */
	isIncoming?: boolean;
}

/**
 * Round avatar for one person.
 *
 * @param {AvatarBadgeProps} props - Component props.
 * @return {import('react').ReactNode} The AvatarBadge component.
 */
export const AvatarBadge = ( { avatar, isIncoming }: AvatarBadgeProps ) => {
	if ( ! avatar ) {
		return null;
	}

	return (
		<img
			src={ avatar }
			alt=""
			width={ 48 }
			height={ 48 }
			className={
				isIncoming
					? 'jp-connection__transfer-ownership__avatar is-incoming'
					: 'jp-connection__transfer-ownership__avatar'
			}
		/>
	);
};

export interface CandidateIdentityProps {
	/** Display name. */
	displayName: string;
	/** Login, shown under the name. */
	login: string;
	/** Email address, shown beside the login. */
	email?: string;
	/** Avatar URL. */
	avatar?: string;
}

/**
 * Initials, display name and login for one person.
 *
 * @param {CandidateIdentityProps} props - Component props.
 * @return {import('react').ReactNode} The CandidateIdentity component.
 */
const CandidateIdentity = ( { displayName, login, email, avatar }: CandidateIdentityProps ) => (
	<Stack
		direction="row"
		align="center"
		gap="md"
		className="jp-connection__transfer-ownership__identity"
	>
		<AvatarBadge avatar={ avatar } isIncoming />
		<Stack direction="column" className="jp-connection__transfer-ownership__who">
			<Text render={ <strong /> }>{ displayName }</Text>
			<Text className="jp-connection__transfer-ownership__meta">
				{ email
					? sprintf(
							/* translators: %1$s: user login. %2$s: user email address. */
							__( '%1$s (%2$s)', 'jetpack-connection-js' ),
							login,
							email
						)
					: login }
			</Text>
		</Stack>
	</Stack>
);

export default CandidateIdentity;
