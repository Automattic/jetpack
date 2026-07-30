/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import { DataForm, type Field } from '@wordpress/dataviews';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, Fieldset } from '@wordpress/ui';
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

/** The `focus` value that asks this section for the title field. */
const FOCUS_TITLE = 'newsletter-title';

/**
 * Whether the address asks for `field` to take focus on arrival.
 *
 * Read straight off the URL rather than through the router: this section also
 * renders on the legacy settings surface, which mounts outside any route
 * context, so a `useSearch()` here would throw there. The SPA router packs its
 * own path and search into a single `p` param, hence the second parse.
 *
 * @param field - The focus target to look for.
 * @return Whether the current address asks for it.
 */
function addressAsksToFocus( field: string ): boolean {
	if ( typeof window === 'undefined' ) {
		return false;
	}

	const routed = new URLSearchParams( window.location.search ).get( 'p' ) ?? '';
	const query = routed.includes( '?' ) ? routed.slice( routed.indexOf( '?' ) + 1 ) : '';

	return new URLSearchParams( query ).get( 'focus' ) === field;
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

	// `DataForm` owns the inputs, so there is no prop to focus one — reach for it
	// through the fields wrapper instead. The form declares `title` first, so it
	// is the first input in the section.
	const fieldsRef = useRef< HTMLDivElement >( null );

	useEffect( () => {
		if ( ! addressAsksToFocus( FOCUS_TITLE ) ) {
			return;
		}

		const input = fieldsRef.current?.querySelector< HTMLInputElement >( 'input' );

		input?.focus();
		// Select the existing name so it can be typed straight over — arriving
		// here means the intent was to change it.
		input?.select();
	}, [] );

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
				{ /* `display: contents` so this wrapper is only a handle for the
				     focus lookup above and leaves the card layout untouched. */ }
				{ /* Locked while a save is in flight: the response is merged back into
				     state and the staged set is cleared, so an edit made mid-save
				     would be silently discarded. */ }
				<Fieldset.Root disabled={ isSaving }>
					<div ref={ fieldsRef } style={ { display: 'contents' } }>
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
					</div>
				</Fieldset.Root>
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
