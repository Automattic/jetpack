/**
 * External dependencies
 */
import {
	AnalyticsQueryClientProvider,
	useStatsSettings,
	useStatsSettingsMutation,
	type StatsSettings,
} from '@jetpack-premium-analytics/data';
import {
	Button,
	Card,
	Drawer,
	Link,
	Notice,
	Stack,
	Text,
} from '@jetpack-premium-analytics/externals';
import { Spinner, ToggleControl } from '@wordpress/components';
import { useRegistry } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { useCallback, useId, useMemo, useState, type ReactNode } from 'react';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';
import { RoleSelect } from './role-select';
import styles from './settings-drawer.module.scss';

const STATS_SUPPORT_URL = 'https://jetpack.com/support/jetpack-stats/';

type SettingsDrawerProps = {
	open: boolean;
	onClose: () => void;
};

type SettingsFormProps = {
	onClose: () => void;
	mutation: ReturnType< typeof useStatsSettingsMutation >;
};

// apiFetch rejects with the site's REST error body, so a string `code` marks a message the site wrote.
const getSiteErrorMessage = ( error: unknown ) =>
	error &&
	typeof error === 'object' &&
	typeof ( error as { code?: unknown } ).code === 'string' &&
	typeof ( error as { message?: unknown } ).message === 'string'
		? ( error as { message: string } ).message
		: null;

// Role lists are sets: the order a reader ticks them in is not a change.
const normalize = ( value: unknown ) => ( Array.isArray( value ) ? [ ...value ].sort() : value );

/**
 * The edited settings that differ from the stored ones.
 *
 * @param stored - The settings the site holds.
 * @param draft  - The settings the reader edited.
 * @return The changed settings only.
 */
const getChanges = (
	stored: StatsSettings,
	draft: Partial< StatsSettings >
): Partial< StatsSettings > =>
	Object.fromEntries(
		( Object.keys( draft ) as Array< keyof StatsSettings > )
			.filter(
				key =>
					JSON.stringify( normalize( draft[ key ] ) ) !==
					JSON.stringify( normalize( stored[ key ] ) )
			)
			.map( key => [ key, draft[ key ] ] )
	);

/**
 * One titled group of settings.
 *
 * @param props          - Component props.
 * @param props.title    - The group's heading.
 * @param props.children - The group's settings.
 * @return The group.
 */
function SettingsGroup( { title, children }: { title: string; children: ReactNode } ) {
	return (
		<Stack direction="column" gap="md" render={ <section /> }>
			<Text variant="heading-md" render={ <h3 /> }>
				{ title }
			</Text>
			<Card.Root>
				<Card.Content>
					<Stack direction="column" gap="xl">
						{ children }
					</Stack>
				</Card.Content>
			</Card.Root>
		</Stack>
	);
}

/**
 * The Stats settings, in a drawer from the end of the page. Nothing is saved until Save.
 *
 * @param props         - Component props.
 * @param props.open    - Whether the drawer is open.
 * @param props.onClose - Called once the reader dismisses the drawer, or a save succeeds.
 * @return The drawer.
 */
export function SettingsDrawer( { open, onClose }: SettingsDrawerProps ) {
	// The page options menu renders in the page header, outside the widgets' query provider.
	return (
		<AnalyticsQueryClientProvider>
			<SettingsDrawerRoot open={ open } onClose={ onClose } />
		</AnalyticsQueryClientProvider>
	);
}

function SettingsDrawerRoot( { open, onClose }: SettingsDrawerProps ) {
	const mutation = useStatsSettingsMutation();

	const handleOpenChange = useCallback(
		( nextOpen: boolean ) => {
			if ( ! nextOpen && ! mutation.isPending ) {
				onClose();
			}
		},
		[ mutation.isPending, onClose ]
	);

	// The popup unmounts once it has slid out, so each opening starts from the stored settings.
	return (
		// The Drawer anchors to a physical edge, so the page's end edge is picked here.
		<Drawer.Root
			open={ open }
			onOpenChange={ handleOpenChange }
			swipeDirection={ isRTL() ? 'left' : 'right' }
		>
			<Drawer.Popup size="large" className={ styles.popup }>
				<SettingsForm onClose={ onClose } mutation={ mutation } />
			</Drawer.Popup>
		</Drawer.Root>
	);
}

function SettingsForm( { onClose, mutation }: SettingsFormProps ) {
	const trackEvent = useTrackEvent();
	const registry = useRegistry();
	const { data, isError } = useStatsSettings();
	const { mutate, isPending: isSaving } = mutation;
	// Only the edited fields, so a refetch mid-edit cannot send back stale values of the others.
	const [ draft, setDraft ] = useState< Partial< StatsSettings > >( {} );
	const [ saveError, setSaveError ] = useState< string | null >( null );
	const readerHeadingId = useId();

	const settings = data && { ...data.settings, ...draft };
	const changes = useMemo(
		() => ( data ? getChanges( data.settings, draft ) : {} ),
		[ data, draft ]
	);
	const hasChanges = Object.keys( changes ).length > 0;

	const update = useCallback( ( values: Partial< StatsSettings > ) => {
		setDraft( current => ( { ...current, ...values } ) );
	}, [] );

	const save = useCallback( () => {
		setSaveError( null );
		mutate( changes, {
			onSuccess: () => {
				trackEvent( 'jetpack_premium_analytics_settings_save', {
					settings: Object.keys( changes ).join( ',' ),
				} );
				registry
					.dispatch( 'core/notices' )
					.createSuccessNotice( __( 'Settings saved.', 'jetpack-premium-analytics-pkg' ), {
						type: 'snackbar',
					} );
				onClose();
			},
			onError: error => {
				const reason = getSiteErrorMessage( error );
				setSaveError(
					reason
						? sprintf(
								/* translators: %s: the reason the site gave. */
								__( 'Your Stats settings could not be saved: %s', 'jetpack-premium-analytics-pkg' ),
								reason
							)
						: __( 'Your Stats settings could not be saved.', 'jetpack-premium-analytics-pkg' )
				);
			},
		} );
	}, [ changes, mutate, onClose, registry, trackEvent ] );

	return (
		<>
			<Drawer.Header>
				<Drawer.Title>{ __( 'Settings', 'jetpack-premium-analytics-pkg' ) }</Drawer.Title>
				<Drawer.CloseIcon />
			</Drawer.Header>
			<Drawer.Content>
				{ isError && ! data && (
					<Notice.Root intent="error">
						<Notice.Description>
							{ __(
								'Your Stats settings could not be loaded. Close this panel and try again.',
								'jetpack-premium-analytics-pkg'
							) }
						</Notice.Description>
					</Notice.Root>
				) }
				{ ! data && ! isError && <Spinner /> }
				{ data && settings && (
					<Stack direction="column" gap="2xl">
						{ saveError && (
							<Notice.Root intent="error">
								<Notice.Description>{ saveError }</Notice.Description>
							</Notice.Root>
						) }
						<SettingsGroup title={ __( 'Admin bar widget', 'jetpack-premium-analytics-pkg' ) }>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __(
									'Include a small chart in admin bar',
									'jetpack-premium-analytics-pkg'
								) }
								help={
									<>
										{ __(
											'Displays a 48-hour traffic snapshot and information on your site activity, including visitors and popular posts or pages.',
											'jetpack-premium-analytics-pkg'
										) }{ ' ' }
										<Link href={ STATS_SUPPORT_URL } openInNewTab>
											{ __( 'Learn more', 'jetpack-premium-analytics-pkg' ) }
										</Link>
									</>
								}
								checked={ settings.admin_bar }
								disabled={ isSaving }
								onChange={ ( isOn: boolean ) => update( { admin_bar: isOn } ) }
							/>
						</SettingsGroup>
						<SettingsGroup title={ __( 'Manage permissions', 'jetpack-premium-analytics-pkg' ) }>
							<RoleSelect
								label={ __(
									'Allow Jetpack Stats to be viewed by:',
									'jetpack-premium-analytics-pkg'
								) }
								roles={ data.roles }
								value={ settings.roles }
								lockedRole="administrator"
								disabled={ isSaving }
								onChange={ roles => update( { roles } ) }
							/>
							<RoleSelect
								label={ __( 'Count logged in page views from:', 'jetpack-premium-analytics-pkg' ) }
								roles={ data.roles }
								value={ settings.count_roles }
								disabled={ isSaving }
								onChange={ countRoles => update( { count_roles: countRoles } ) }
							/>
							<Card.FullBleed className={ styles.divider } />
							<Stack direction="column" gap="sm" role="group" aria-labelledby={ readerHeadingId }>
								<Text id={ readerHeadingId }>
									{ __( 'WordPress.com Reader', 'jetpack-premium-analytics-pkg' ) }
								</Text>
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __( 'Show post views for this site', 'jetpack-premium-analytics-pkg' ) }
									checked={ settings.wpcom_reader_views_enabled }
									disabled={ isSaving }
									onChange={ ( isOn: boolean ) => update( { wpcom_reader_views_enabled: isOn } ) }
								/>
							</Stack>
						</SettingsGroup>
						{ data.modules_url && (
							<SettingsGroup title={ __( 'Activation', 'jetpack-premium-analytics-pkg' ) }>
								<Text>
									{ createInterpolateElement(
										__(
											'Stats is a Jetpack module. Activate or deactivate it from <link>Jetpack modules</link>.',
											'jetpack-premium-analytics-pkg'
										),
										{ link: <Link href={ data.modules_url } /> }
									) }
								</Text>
							</SettingsGroup>
						) }
					</Stack>
				) }
			</Drawer.Content>
			<Drawer.Footer>
				<Drawer.Action variant="minimal" tone="neutral" disabled={ isSaving }>
					{ __( 'Cancel', 'jetpack-premium-analytics-pkg' ) }
				</Drawer.Action>
				<Button variant="solid" onClick={ save } disabled={ ! hasChanges || isSaving }>
					{ isSaving
						? __( 'Saving…', 'jetpack-premium-analytics-pkg' )
						: __( 'Save', 'jetpack-premium-analytics-pkg' ) }
				</Button>
			</Drawer.Footer>
		</>
	);
}
