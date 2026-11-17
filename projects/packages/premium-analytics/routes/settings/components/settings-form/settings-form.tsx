import { getScriptData } from '@automattic/jetpack-script-data';
import { useStatsSettings, type StatsSettings } from '@jetpack-premium-analytics/data';
import {
	Card,
	DataForm,
	Notice,
	Spinner,
	Stack,
	VisuallyHidden,
	type Form,
} from '@jetpack-premium-analytics/externals';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { useDispatch } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { getFields } from './settings-form-fields';
import type { JSX } from 'react';

type CardGroup = { id: string; label: string; children: Array< keyof StatsSettings > };

/**
 * The form's cards and the fields each one holds, keeping only the fields the site offers.
 *
 * @param offered - The settings the site offers; every setting when the site does not say.
 * @return The cards left holding a field, in order.
 */
const getCardGroups = ( offered?: string[] ): CardGroup[] => {
	const groups: CardGroup[] = [
		{
			id: 'admin-bar',
			label: __( 'Admin bar widget', 'jetpack-premium-analytics-pkg' ),
			children: [ 'admin_bar' ],
		},
		{
			id: 'permissions',
			label: __( 'Manage permissions', 'jetpack-premium-analytics-pkg' ),
			children: [ 'roles', 'count_roles' ],
		},
		{
			id: 'reader',
			label: __( 'WordPress.com Reader', 'jetpack-premium-analytics-pkg' ),
			children: [ 'wpcom_reader_views_enabled' ],
		},
	];
	if ( ! offered ) {
		return groups;
	}

	return groups
		.map( group => ( {
			...group,
			children: group.children.filter( id => offered.includes( id ) ),
		} ) )
		.filter( group => group.children.length > 0 );
};

// apiFetch writes these itself when the request never reached the site.
const CLIENT_ERROR_CODES = [ 'fetch_error', 'offline_error' ];

/**
 * The reason the site gave for refusing a save, when it gave one.
 *
 * @param error - What apiFetch rejected with: the site's REST error body, or a client-side error.
 * @return The site's message, or null.
 */
function getSiteErrorMessage( error: unknown ): string | null {
	const { code, message } = ( error ?? {} ) as { code?: unknown; message?: unknown };
	return typeof code === 'string' &&
		! CLIENT_ERROR_CODES.includes( code ) &&
		typeof message === 'string'
		? message
		: null;
}

type SettingChange = { setting: keyof StatsSettings; enabled: boolean; role?: string };

/**
 * Each switch a save flipped and each role it added or removed, in the shape Odyssey Stats records.
 *
 * @param before - The settings the save changed.
 * @param edits  - The saved values.
 * @return One entry per change.
 */
function getSettingChanges(
	before: Partial< StatsSettings >,
	edits: Partial< StatsSettings >
): SettingChange[] {
	return ( Object.keys( edits ) as ( keyof StatsSettings )[] ).flatMap( setting => {
		const value = edits[ setting ];
		if ( ! Array.isArray( value ) ) {
			return [ { setting, enabled: Boolean( value ) } ];
		}
		const previous = ( before[ setting ] ?? [] ) as string[];
		return [
			...value
				.filter( role => ! previous.includes( role ) )
				.map( role => ( { setting, enabled: true, role } ) ),
			...previous
				.filter( role => ! value.includes( role ) )
				.map( role => ( { setting, enabled: false, role } ) ),
		];
	} );
}

/**
 * The Stats settings form: a card per group of settings the site offers, each change saved as it is made.
 *
 * @return The form, its loading or load error state, or nothing when the site offers no setting.
 */
export function SettingsForm(): JSX.Element | null {
	const statsSettings = getScriptData()?.premium_analytics?.stats_settings;
	const roles = statsSettings?.roles;
	const offered = statsSettings?.fields;
	const fields = useMemo( () => getFields( roles ?? [] ), [ roles ] );
	const cardGroups = useMemo( () => getCardGroups( offered ), [ offered ] );
	const offeredSettings = useMemo(
		() => cardGroups.flatMap( group => group.children ),
		[ cardGroups ]
	);
	const formLayout = useMemo< Form >(
		() => ( { layout: { type: 'card', isCollapsible: false }, fields: cardGroups } ),
		[ cardGroups ]
	);

	const { settings, isError, saveChange } = useStatsSettings( offeredSettings );
	const trackEvent = useTrackEvent();
	const { createSuccessNotice, createErrorNotice } = useDispatch( 'core/notices' );

	const onChange = useCallback(
		async ( edits: Partial< StatsSettings > ) => {
			try {
				await saveChange( edits );
			} catch ( error ) {
				const reason = getSiteErrorMessage( error );
				createErrorNotice(
					reason
						? sprintf(
								/* translators: %s: the reason the site gave. */
								__( 'Your Stats settings could not be saved: %s', 'jetpack-premium-analytics-pkg' ),
								reason
							)
						: __( 'Your Stats settings could not be saved.', 'jetpack-premium-analytics-pkg' ),
					{ id: 'stats-settings-save-failed', type: 'snackbar' }
				);
				return;
			}
			getSettingChanges( settings ?? {}, edits ).forEach( change =>
				trackEvent( 'jetpack_premium_analytics_settings_changed', change )
			);
			createSuccessNotice( __( 'Settings saved.', 'jetpack-premium-analytics-pkg' ), {
				id: 'stats-settings-saved',
				type: 'snackbar',
			} );
		},
		[ createErrorNotice, createSuccessNotice, saveChange, settings, trackEvent ]
	);

	if ( cardGroups.length === 0 ) {
		return null;
	}

	if ( settings ) {
		return (
			<DataForm data={ settings } fields={ fields } form={ formLayout } onChange={ onChange } />
		);
	}

	if ( isError ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>
					{ __(
						'Your Stats settings could not be loaded. Reload the page to try again.',
						'jetpack-premium-analytics-pkg'
					) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	// DataForm has no loading state, so draw its cards from the same form config until the data arrives.
	return (
		<Stack direction="column" gap="xl" aria-busy="true">
			<VisuallyHidden role="status">
				{ __( 'Loading your Stats settings…', 'jetpack-premium-analytics-pkg' ) }
			</VisuallyHidden>
			{ cardGroups.map( group => (
				<Card.Root key={ group.id }>
					<Card.Header>
						<Card.Title>{ group.label }</Card.Title>
					</Card.Header>
					<Card.Content>
						<Spinner />
					</Card.Content>
				</Card.Root>
			) ) }
		</Stack>
	);
}
