import { __ } from '@wordpress/i18n';
import { commentAuthorAvatar } from '@wordpress/icons';
import { Card, CollapsibleCard, Notice, Stack } from '@wordpress/ui';
import CardTitleIcon from '../../components/card-title-icon';
import PlanLockedNote from '../../components/plan-locked-note';
import StatusIndicator from '../../components/status-indicator';
import { useAuthorProfile } from '../../data/use-author-profile';
import AuthorProfileSection from './schema-settings/author-profile-section';
import type { SettingStatus } from '../../components/status-indicator';

interface Props {
	disabled?: boolean;
	planLocked?: boolean;
	disabledReason?: string;
}

/**
 * Schema settings for the signed-in author's profile.
 *
 * @param props                - Component props.
 * @param props.disabled       - Whether editing is disabled.
 * @param props.planLocked     - Whether the plan prevents editing.
 * @param props.disabledReason - Explanation shown while editing is disabled.
 * @return The Author profile settings card.
 */
function AuthorProfileCard( {
	disabled: outputDisabled = false,
	planLocked = false,
	disabledReason,
}: Props ) {
	const disabled = outputDisabled || planLocked;
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
		profileStatus = 'incomplete';
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
					{ ( planLocked || ( ! isLoading && ! hasLoadError ) ) && (
						<CollapsibleCard.HeaderDescription>
							<StatusIndicator status={ planLocked ? 'plan-locked' : profileStatus } />
						</CollapsibleCard.HeaderDescription>
					) }
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack
					direction="column"
					gap="lg"
					role="group"
					aria-label={ __( 'Author profile settings', 'jetpack-seo' ) }
					aria-describedby={ disabled ? 'jetpack-seo-author-profile-disabled' : undefined }
				>
					{ planLocked && <PlanLockedNote id="jetpack-seo-author-profile-disabled" /> }
					{ ! planLocked && disabled && disabledReason && (
						<Notice.Root intent="warning" id="jetpack-seo-author-profile-disabled">
							<Notice.Description>{ disabledReason }</Notice.Description>
						</Notice.Root>
					) }
					<AuthorProfileSection form={ form } disabled={ disabled } />
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}

export default AuthorProfileCard;
