import { __ } from '@wordpress/i18n';
import { commentAuthorAvatar } from '@wordpress/icons';
import { Card, CollapsibleCard, Stack } from '@wordpress/ui';
import CardTitleIcon from '../../components/card-title-icon';
import StatusIndicator from '../../components/status-indicator';
import { useAuthorProfile } from '../../data/use-author-profile';
import AuthorProfileSection from './schema-settings/author-profile-section';
import type { SettingStatus } from '../../components/status-indicator';

/**
 * Per-user Author profile settings card.
 *
 * Holds the form behind the Person / ProfilePage schema for the signed-in
 * user: name, bio, website, and avatar come from (and write back to) the
 * WordPress user profile, plus the Jetpack-owned job title and social profile
 * fields. Site-level schema entities live in the Schema card; this card is
 * about the current user only.
 *
 * Collapsed by default and built from the shared `CollapsibleCard` compound,
 * matching the other Settings modules (Canonical URLs, Title structure, Site
 * verification, Schema).
 *
 * @return The Author profile settings card.
 */
function AuthorProfileCard() {
	const form = useAuthorProfile();
	const { profile, isLoading, hasLoadError } = form;

	// Fields the header status counts as "set": the optional ones an author fills
	// in (name and avatar are always present, so they'd never discriminate).
	// Hidden until the profile loads.
	const fieldsSet = [
		profile.description,
		profile.url,
		profile.jobTitle,
		profile.sameAs.length > 0,
	];
	const setCount = fieldsSet.filter( Boolean ).length;

	let profileStatus: SettingStatus = 'not-started';
	if ( setCount === fieldsSet.length ) {
		profileStatus = 'complete';
	} else if ( setCount > 0 ) {
		profileStatus = 'in-progress';
	}

	return (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header render={ <h2 /> }>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>
						<CardTitleIcon
							icon={ commentAuthorAvatar }
							title={ __( 'Author profile', 'jetpack-seo' ) }
						/>
					</Card.Title>
					{ ! isLoading && ! hasLoadError && (
						<CollapsibleCard.HeaderDescription>
							<StatusIndicator status={ profileStatus } />
						</CollapsibleCard.HeaderDescription>
					) }
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<AuthorProfileSection form={ form } />
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}

export default AuthorProfileCard;
