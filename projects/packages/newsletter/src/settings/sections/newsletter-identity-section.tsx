/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import { DataForm, type Field } from '@wordpress/dataviews';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import type { SiteIdentity } from '../api';

interface NewsletterIdentitySectionProps {
	data: SiteIdentity;
	onChange: ( updates: Partial< SiteIdentity > ) => void;
	onSave: () => void;
	isSaving: boolean;
	hasChanges: boolean;
	/** Fields staged in this section's changeset, fed into section_save analytics. */
	changedKeys?: string[];
}

/**
 * Newsletter Identity Section Component
 *
 * Edits the site title and tagline — `blogname` and `blogdescription` — from
 * the Newsletter settings page. A second door onto the same two options as
 * Settings → General, so someone setting up a newsletter doesn't have to leave
 * for the thing readers see first.
 *
 * Unlike its sibling sections this one isn't gated on the newsletter being
 * enabled: a site has a title and tagline either way.
 *
 * @param {NewsletterIdentitySectionProps} props - Component props
 * @return {JSX.Element} The newsletter identity section
 */
export function NewsletterIdentitySection( {
	data,
	onChange,
	onSave,
	isSaving,
	hasChanges,
	changedKeys,
}: NewsletterIdentitySectionProps ): JSX.Element {
	const siteType = getSiteType();

	const handleSave = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_section_save', {
			site_type: siteType,
			section: 'identity',
			changed_keys: ( changedKeys ?? [] ).join( ',' ),
			change_count: ( changedKeys ?? [] ).length,
		} );
		onSave();
	}, [ changedKeys, onSave, siteType ] );

	const fields: Field< SiteIdentity >[] = [
		{
			id: 'title',
			label: __( 'Newsletter title', 'jetpack-newsletter' ),
			type: 'text' as const,
		},
		{
			id: 'description',
			label: __( 'Tagline', 'jetpack-newsletter' ),
			type: 'text' as const,
			description: __(
				'Shows on your site and in inboxes, under your name.',
				'jetpack-newsletter'
			),
		},
	];

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Newsletter identity', 'jetpack-newsletter' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<DataForm
					data={ data }
					fields={ fields }
					form={ {
						layout: {
							type: 'regular',
							labelPosition: 'top',
						},
						fields: [ 'title', 'description' ],
					} }
					onChange={ onChange }
				/>
				<div className="newsletter-card-footer">
					<Button
						onClick={ handleSave }
						disabled={ isSaving || ! hasChanges }
						loading={ isSaving }
						loadingAnnouncement={ __( 'Saving…', 'jetpack-newsletter' ) }
					>
						{ __( 'Save', 'jetpack-newsletter' ) }
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	);
}
