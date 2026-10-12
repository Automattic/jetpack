/**
 * External dependencies
 */
import { Button, Dialog } from '@jetpack-premium-analytics/externals';
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './utm-url-builder-dialog.module.scss';

type UtmValues = {
	destination: string;
	campaign: string;
	source: string;
	medium: string;
};

function buildTrackedUrl( { destination, campaign, source, medium }: UtmValues ): string | null {
	const address = destination.trim();
	if ( ! /^https?:\/\//i.test( address ) ) {
		return null;
	}

	try {
		const url = new URL( address );
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
	} catch {
		return null;
	}
}

export function UtmUrlBuilderDialog( { onClose }: { onClose: () => void } ) {
	const [ values, setValues ] = useState< UtmValues >( {
		destination: '',
		campaign: '',
		source: '',
		medium: '',
	} );
	const [ copyState, setCopyState ] = useState< 'idle' | 'copied' | 'failed' >( 'idle' );
	const trackedUrl = buildTrackedUrl( values );

	const setField = useCallback( ( field: keyof UtmValues, value: string ) => {
		setValues( current => ( { ...current, [ field ]: value } ) );
		setCopyState( 'idle' );
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
			setCopyState( 'copied' );
		} catch {
			setCopyState( 'failed' );
		}
	}, [ trackedUrl ] );

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
							<TextControl
								label={ __( 'Destination URL', 'jetpack-premium-analytics-pkg' ) }
								type="url"
								value={ values.destination }
								onChange={ setDestination }
							/>
							<TextControl
								label={ __( 'UTM campaign', 'jetpack-premium-analytics-pkg' ) }
								value={ values.campaign }
								onChange={ setCampaign }
								placeholder={ __( 'e.g. promotion', 'jetpack-premium-analytics-pkg' ) }
							/>
							<TextControl
								label={ __( 'UTM source', 'jetpack-premium-analytics-pkg' ) }
								value={ values.source }
								onChange={ setSource }
								placeholder={ __( 'e.g. newsletter', 'jetpack-premium-analytics-pkg' ) }
							/>
							<TextControl
								label={ __( 'UTM medium', 'jetpack-premium-analytics-pkg' ) }
								value={ values.medium }
								onChange={ setMedium }
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
							<Button
								variant="outline"
								size="compact"
								disabled={ ! trackedUrl }
								onClick={ copyUrl }
							>
								{ __( 'Copy to clipboard', 'jetpack-premium-analytics-pkg' ) }
							</Button>
							{ copyState === 'failed' && (
								<p role="alert">
									{ __(
										'Could not copy the URL. Select it above and copy it manually.',
										'jetpack-premium-analytics-pkg'
									) }
								</p>
							) }
							{ copyState === 'copied' && (
								<p role="status">
									{ __( 'Copied to clipboard.', 'jetpack-premium-analytics-pkg' ) }
								</p>
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
			</Dialog.Popup>
		</Dialog.Root>
	);
}
