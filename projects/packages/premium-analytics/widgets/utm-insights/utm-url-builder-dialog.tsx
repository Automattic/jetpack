/**
 * External dependencies
 */
import { Button, Dialog, InputControl, Notice } from '@jetpack-premium-analytics/externals';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './utm-url-builder-dialog.module.scss';

const COPY_NOTICE_ID = 'jetpack-premium-analytics-utm-url-copy';

type UtmValues = {
	destination: string;
	campaign: string;
	source: string;
	medium: string;
};

function parseDestination( destination: string ): URL | null {
	const address = destination.trim();
	if ( ! /^https?:\/\//i.test( address ) ) {
		return null;
	}

	try {
		return new URL( address );
	} catch {
		return null;
	}
}

function buildTrackedUrl(
	url: URL | null,
	{ campaign, source, medium }: Omit< UtmValues, 'destination' >
): string | null {
	if ( ! url ) {
		return null;
	}

	const parameters = {
		utm_campaign: campaign.trim(),
		utm_source: source.trim(),
		utm_medium: medium.trim(),
	};
	if ( ! Object.values( parameters ).some( Boolean ) ) {
		return null;
	}

	for ( const [ key, value ] of Object.entries( parameters ) ) {
		url.searchParams.delete( key );
		if ( value ) {
			url.searchParams.set( key, value );
		}
	}

	return url.toString();
}

export function UtmUrlBuilderDialog( { onClose }: { onClose: () => void } ) {
	const [ values, setValues ] = useState< UtmValues >( {
		destination: '',
		campaign: '',
		source: '',
		medium: '',
	} );
	const { createSuccessNotice } = useDispatch( 'core/notices' );
	const [ hasCopyFailed, setHasCopyFailed ] = useState( false );
	const destinationUrl = parseDestination( values.destination );
	const isDestinationInvalid = values.destination.trim() !== '' && ! destinationUrl;
	const trackedUrl = buildTrackedUrl( destinationUrl, values );
	const copyFailedMessage = __(
		'Could not copy the URL. Select it and copy it manually.',
		'jetpack-premium-analytics-pkg'
	);

	const setField = useCallback( ( field: keyof UtmValues, value: string ) => {
		setValues( current => ( { ...current, [ field ]: value } ) );
	}, [] );
	const setDestination = useCallback(
		( value: string ) => setField( 'destination', value ),
		[ setField ]
	);
	const setCampaign = useCallback(
		( value: string ) => setField( 'campaign', value ),
		[ setField ]
	);
	const setSource = useCallback( ( value: string ) => setField( 'source', value ), [ setField ] );
	const setMedium = useCallback( ( value: string ) => setField( 'medium', value ), [ setField ] );
	const handleOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				onClose();
			}
		},
		[ onClose ]
	);

	const copyUrl = useCallback( async () => {
		if ( ! trackedUrl ) {
			return;
		}

		try {
			await navigator.clipboard.writeText( trackedUrl );
		} catch {
			setHasCopyFailed( true );
			return;
		}
		// A snackbar renders under an open dialog, so the dialog closes first.
		onClose();
		createSuccessNotice( __( 'Copied URL to clipboard.', 'jetpack-premium-analytics-pkg' ), {
			id: COPY_NOTICE_ID,
			type: 'snackbar',
		} );
	}, [ createSuccessNotice, onClose, trackedUrl ] );

	return (
		<Dialog.Root open onOpenChange={ handleOpenChange }>
			<Dialog.Popup size="large">
				<Dialog.Header>
					<Dialog.Title>{ __( 'Build URL', 'jetpack-premium-analytics-pkg' ) }</Dialog.Title>
					<Dialog.CloseIcon />
				</Dialog.Header>
				<Dialog.Content>
					<div className={ styles.layout }>
						<div className={ styles.form }>
							<p>
								{ __(
									'Generate URLs to share and track UTM parameters.',
									'jetpack-premium-analytics-pkg'
								) }
							</p>
							<InputControl
								label={ __( 'Destination URL', 'jetpack-premium-analytics-pkg' ) }
								type="url"
								value={ values.destination }
								onValueChange={ setDestination }
								description={
									isDestinationInvalid
										? __(
												'Enter a full URL that starts with https:// or http://.',
												'jetpack-premium-analytics-pkg'
											)
										: undefined
								}
							/>
							<InputControl
								label={ __( 'UTM campaign', 'jetpack-premium-analytics-pkg' ) }
								value={ values.campaign }
								onValueChange={ setCampaign }
								placeholder={ __( 'e.g. promotion', 'jetpack-premium-analytics-pkg' ) }
							/>
							<InputControl
								label={ __( 'UTM source', 'jetpack-premium-analytics-pkg' ) }
								value={ values.source }
								onValueChange={ setSource }
								placeholder={ __( 'e.g. newsletter', 'jetpack-premium-analytics-pkg' ) }
							/>
							<InputControl
								label={ __( 'UTM medium', 'jetpack-premium-analytics-pkg' ) }
								value={ values.medium }
								onValueChange={ setMedium }
								placeholder={ __( 'e.g. email, social', 'jetpack-premium-analytics-pkg' ) }
							/>
							<div className={ styles.result }>
								<h3>{ __( 'Your URL to share', 'jetpack-premium-analytics-pkg' ) }</h3>
								<div className={ styles.resultValue }>
									{ trackedUrl ??
										__(
											'Fill out campaign parameters to see the URL',
											'jetpack-premium-analytics-pkg'
										) }
								</div>
							</div>
							{ hasCopyFailed && (
								<Notice.Root intent="error" spokenMessage={ copyFailedMessage }>
									<Notice.Description>{ copyFailedMessage }</Notice.Description>
								</Notice.Root>
							) }
						</div>
						<aside className={ styles.help }>
							<h3>{ __( 'Why should I use this?', 'jetpack-premium-analytics-pkg' ) }</h3>
							<p>
								{ __(
									'UTM codes help track where your traffic comes from. Adding them to your URLs gives you insights into what works and where to optimize.',
									'jetpack-premium-analytics-pkg'
								) }
							</p>
							<dl>
								<dt>
									<code>utm_campaign</code>
								</dt>
								<dd>
									{ __( 'Name your campaign', 'jetpack-premium-analytics-pkg' ) }
									<em>
										{ __( 'Example: christmas, flash-sale', 'jetpack-premium-analytics-pkg' ) }
									</em>
								</dd>
								<dt>
									<code>utm_source</code>
								</dt>
								<dd>
									{ __( 'Define where traffic originates', 'jetpack-premium-analytics-pkg' ) }
									<em>
										{ __(
											'Example: newsletter, facebook, google',
											'jetpack-premium-analytics-pkg'
										) }
									</em>
								</dd>
								<dt>
									<code>utm_medium</code>
								</dt>
								<dd>
									{ __( 'Define the channel type', 'jetpack-premium-analytics-pkg' ) }
									<em>{ __( 'Example: email, social, cpc', 'jetpack-premium-analytics-pkg' ) }</em>
								</dd>
							</dl>
							<p>
								{ __(
									'Use your generated URLs in social posts, emails, or ads. Jetpack Stats will track UTM codes, giving you accurate insights into your traffic.',
									'jetpack-premium-analytics-pkg'
								) }
							</p>
						</aside>
					</div>
				</Dialog.Content>
				<Dialog.Footer>
					<Button variant="solid" size="compact" disabled={ ! trackedUrl } onClick={ copyUrl }>
						{ __( 'Copy to clipboard', 'jetpack-premium-analytics-pkg' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
