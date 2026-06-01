/**
 * GlobalToggles — settings panel for autoupdates and email notifications.
 *
 * Fetches current settings on mount and lets the user toggle them optimistically,
 * rolling back on error and surfacing a Notice when something goes wrong.
 *
 * @package
 */

import { Spinner, ToggleControl } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Notice, Stack, Text } from '@wordpress/ui';
import { getSettings, updateSettings } from '../api/abilities';
import type { Settings } from '../api/types';

type InFlight = 'autoupdates' | 'email_notifications' | null;

/**
 * Settings panel that exposes the autoupdates and email notification toggles.
 *
 * @return The settings card element, a loading placeholder, or an error notice.
 */
const GlobalToggles = () => {
	const [ settings, setSettings ] = useState< Settings | null >( null );
	const [ loading, setLoading ] = useState( true );
	const [ fetchError, setFetchError ] = useState< string | null >( null );
	const [ updateError, setUpdateError ] = useState< string | null >( null );
	const [ inFlight, setInFlight ] = useState< InFlight >( null );

	useEffect( () => {
		let cancelled = false;
		getSettings()
			.then( data => {
				if ( ! cancelled ) {
					setSettings( data );
					setLoading( false );
				}
			} )
			.catch( ( err: unknown ) => {
				if ( ! cancelled ) {
					const msg =
						err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
							? err.message
							: __( 'Could not load settings.', 'jetpack-beta' );
					setFetchError( msg );
					setLoading( false );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [] );

	const handleAutoupdates = useCallback(
		( checked: boolean ) => {
			if ( inFlight !== null ) {
				return;
			}
			if ( ! settings ) {
				return;
			}
			const previous = settings;
			setSettings( { ...settings, autoupdates: checked } );
			setUpdateError( null );
			setInFlight( 'autoupdates' );
			updateSettings( { autoupdates: checked } )
				.then( updated => {
					setSettings( updated );
				} )
				.catch( ( err: unknown ) => {
					setSettings( previous );
					const msg =
						err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
							? err.message
							: __( 'Could not save autoupdates setting.', 'jetpack-beta' );
					setUpdateError( msg );
				} )
				.finally( () => {
					setInFlight( null );
				} );
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps -- inFlight read only guards re-entrancy; stale closure is safe because inFlight is set before any await
		[ settings ]
	);

	const handleEmailNotifications = useCallback(
		( checked: boolean ) => {
			if ( inFlight !== null ) {
				return;
			}
			if ( ! settings ) {
				return;
			}
			const previous = settings;
			setSettings( { ...settings, email_notifications: checked } );
			setUpdateError( null );
			setInFlight( 'email_notifications' );
			updateSettings( { email_notifications: checked } )
				.then( updated => {
					setSettings( updated );
				} )
				.catch( ( err: unknown ) => {
					setSettings( previous );
					const msg =
						err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
							? err.message
							: __( 'Could not save email notifications setting.', 'jetpack-beta' );
					setUpdateError( msg );
				} )
				.finally( () => {
					setInFlight( null );
				} );
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps -- inFlight read only guards re-entrancy; stale closure is safe because inFlight is set before any await
		[ settings ]
	);

	if ( loading ) {
		return <Spinner />;
	}

	if ( fetchError ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>{ fetchError }</Notice.Description>
			</Notice.Root>
		);
	}

	if ( ! settings ) {
		return null;
	}

	const showEmailToggle = settings.autoupdates && ! settings.skip_email;

	return (
		<Card.Root>
			<Card.Content>
				<Stack direction="column" gap="md">
					<Text variant="heading-sm">{ __( 'Settings', 'jetpack-beta' ) }</Text>
					{ updateError && (
						<Notice.Root intent="error">
							<Notice.Description>{ updateError }</Notice.Description>
						</Notice.Root>
					) }
					<Stack direction="row" gap="xl" align="center">
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Autoupdates', 'jetpack-beta' ) }
							checked={ settings.autoupdates }
							onChange={ handleAutoupdates }
							disabled={ inFlight === 'autoupdates' }
						/>
						{ showEmailToggle && (
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Email Notifications', 'jetpack-beta' ) }
								checked={ settings.email_notifications }
								onChange={ handleEmailNotifications }
								disabled={ inFlight === 'email_notifications' }
							/>
						) }
					</Stack>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default GlobalToggles;
