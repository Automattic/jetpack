/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { useStatsSettings } from '@jetpack-premium-analytics/data';
import {
	Button,
	Card,
	Drawer,
	Link,
	Notice,
	Spinner,
	Stack,
	Text,
} from '@jetpack-premium-analytics/externals';
import { HorizontalRule, ToggleControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useId, useState } from 'react';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';
import { DrawerGroup, PageDrawer } from '../page-drawer';
import { RoleSelect } from './role-select';

const STATS_SUPPORT_URL = 'https://jetpack.com/support/jetpack-stats/';

type SettingsDrawerProps = {
	open: boolean;
	onClose: () => void;
};

// apiFetch writes these itself when the request never reached the site.
const CLIENT_ERROR_CODES = [ 'fetch_error', 'offline_error' ];

// apiFetch rejects with the site's REST error body, so a string `code` marks a message the site wrote.
const getSiteErrorMessage = ( error: unknown ) => {
	const { code, message } = ( error ?? {} ) as { code?: unknown; message?: unknown };
	return typeof code === 'string' &&
		! CLIENT_ERROR_CODES.includes( code ) &&
		typeof message === 'string'
		? message
		: null;
};

const getStatsSettingsContext = () => {
	const context = getScriptData()?.premium_analytics?.stats_settings;
	return { roles: context?.roles ?? [], modules_url: context?.modules_url ?? null };
};

/**
 * The Stats settings, in a drawer from the end of the page. Nothing is saved until Save.
 *
 * @param props         - Component props.
 * @param props.open    - Whether the drawer is open.
 * @param props.onClose - Called once the reader dismisses the drawer, or a save succeeds.
 * @return The drawer.
 */
export function SettingsDrawer( { open, onClose }: SettingsDrawerProps ) {
	const { isSaving, discard } = useStatsSettings( { enabled: open } );

	const close = useCallback( () => {
		discard();
		onClose();
	}, [ discard, onClose ] );

	return (
		<PageDrawer
			open={ open }
			onClose={ close }
			title={ __( 'Settings', 'jetpack-premium-analytics-pkg' ) }
			isBusy={ isSaving }
		>
			<SettingsForm onClose={ onClose } />
		</PageDrawer>
	);
}

function SettingsForm( { onClose }: Pick< SettingsDrawerProps, 'onClose' > ) {
	const trackEvent = useTrackEvent();
	const { createSuccessNotice } = useDispatch( 'core/notices' );
	const {
		settings,
		isError,
		changedFields,
		isSaving,
		update,
		save: saveSettings,
	} = useStatsSettings();
	const [ saveError, setSaveError ] = useState< string | null >( null );
	const readerHeadingId = useId();
	const { roles, modules_url: modulesUrl } = getStatsSettingsContext();

	const save = useCallback( async () => {
		setSaveError( null );
		try {
			await saveSettings();
		} catch ( error ) {
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
			return;
		}
		trackEvent( 'jetpack_premium_analytics_settings_save', {
			settings: changedFields.join( ',' ),
		} );
		createSuccessNotice( __( 'Settings saved.', 'jetpack-premium-analytics-pkg' ), {
			type: 'snackbar',
		} );
		onClose();
	}, [ changedFields, createSuccessNotice, onClose, saveSettings, trackEvent ] );

	return (
		<>
			<Drawer.Content>
				{ isError && ! settings && (
					<Notice.Root intent="error">
						<Notice.Description>
							{ __(
								'Your Stats settings could not be loaded. Close this panel and try again.',
								'jetpack-premium-analytics-pkg'
							) }
						</Notice.Description>
					</Notice.Root>
				) }
				{ ! settings && ! isError && <Spinner /> }
				{ settings && (
					<Stack direction="column" gap="2xl">
						{ saveError && (
							<Notice.Root intent="error">
								<Notice.Description>{ saveError }</Notice.Description>
							</Notice.Root>
						) }
						<DrawerGroup title={ __( 'Admin bar widget', 'jetpack-premium-analytics-pkg' ) }>
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
						</DrawerGroup>
						<DrawerGroup title={ __( 'Manage permissions', 'jetpack-premium-analytics-pkg' ) }>
							<RoleSelect
								label={ __(
									'Allow Jetpack Stats to be viewed by:',
									'jetpack-premium-analytics-pkg'
								) }
								roles={ roles }
								value={ settings.roles }
								lockedRole="administrator"
								disabled={ isSaving }
								onChange={ viewRoles => update( { roles: viewRoles } ) }
							/>
							<RoleSelect
								label={ __( 'Count logged in page views from:', 'jetpack-premium-analytics-pkg' ) }
								roles={ roles }
								value={ settings.count_roles }
								disabled={ isSaving }
								onChange={ countRoles => update( { count_roles: countRoles } ) }
							/>
							<Card.FullBleed render={ <HorizontalRule /> } />
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
						</DrawerGroup>
						{ modulesUrl && (
							<DrawerGroup title={ __( 'Activation', 'jetpack-premium-analytics-pkg' ) }>
								<Text>
									{ createInterpolateElement(
										__(
											'Stats is a Jetpack module. Activate or deactivate it from <link>Jetpack modules</link>.',
											'jetpack-premium-analytics-pkg'
										),
										{ link: <Link href={ modulesUrl } /> }
									) }
								</Text>
							</DrawerGroup>
						) }
					</Stack>
				) }
			</Drawer.Content>
			<Drawer.Footer>
				<Drawer.Action variant="minimal" tone="neutral" disabled={ isSaving }>
					{ __( 'Cancel', 'jetpack-premium-analytics-pkg' ) }
				</Drawer.Action>
				<Button
					variant="solid"
					onClick={ save }
					disabled={ changedFields.length === 0 || isSaving }
				>
					{ isSaving
						? __( 'Saving…', 'jetpack-premium-analytics-pkg' )
						: __( 'Save', 'jetpack-premium-analytics-pkg' ) }
				</Button>
			</Drawer.Footer>
		</>
	);
}
