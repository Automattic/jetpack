import { __, sprintf } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import { useAuthorProfile } from '../../data/use-author-profile';
import AuthorProfileSection from './schema-settings/author-profile-section';
import './style.scss';

const notSetLabel = __( 'Not set', 'jetpack-seo' );

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

	// Fields the header badge counts as "set": the optional ones an author fills
	// in (name and avatar are always present). Hidden until the profile loads.
	const fieldsSet = [
		profile.description,
		profile.url,
		profile.jobTitle,
		profile.sameAs.length > 0,
	];
	const setCount = fieldsSet.filter( Boolean ).length;

	return (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>{ __( 'Author profile', 'jetpack-seo' ) }</Card.Title>
					{ ! isLoading && ! hasLoadError && (
						<Badge intent={ setCount === fieldsSet.length ? 'stable' : 'draft' }>
							{ setCount > 0
								? sprintf(
										/* translators: %1$d: number of filled author profile fields. %2$d: total number of fields. */
										__( '%1$d of %2$d set', 'jetpack-seo' ),
										setCount,
										fieldsSet.length
								  )
								: notSetLabel }
						</Badge>
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
