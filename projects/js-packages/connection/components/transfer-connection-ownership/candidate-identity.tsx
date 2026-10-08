/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './style.scss';

export interface AvatarBadgeProps {
	/** Avatar URL. Falls back to initials when empty. */
	avatar?: string;
	/** Name the badge stands for. */
	name: string;
}

/**
 * Round avatar for one person, falling back to their initials.
 *
 * @param {AvatarBadgeProps} props - Component props.
 * @return {import('react').ReactNode} The AvatarBadge component.
 */
export const AvatarBadge = ( { avatar, name }: AvatarBadgeProps ) => {
	if ( avatar ) {
		return (
			<img
				className="jp-connection__transfer-ownership__avatar"
				src={ avatar }
				alt=""
				width={ 38 }
				height={ 38 }
			/>
		);
	}

	const initials = name
		.split( /\s+/ )
		.slice( 0, 2 )
		.map( part => part.charAt( 0 ) )
		.join( '' )
		.toUpperCase();

	return (
		<span className="jp-connection__transfer-ownership__avatar is-initials" aria-hidden="true">
			{ initials }
		</span>
	);
};

export interface CandidateIdentityProps {
	/** Avatar URL for the person named. */
	avatar?: string;
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
const CandidateIdentity = ( { avatar, displayName, login, email }: CandidateIdentityProps ) => (
	<div className="jp-connection__transfer-ownership__identity">
		<AvatarBadge avatar={ avatar } name={ displayName } />
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
