import apiFetch from '@wordpress/api-fetch';
import { ToggleControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from 'react';
import Card from 'components/card';
import { STORE_ID } from 'store';

const READER_CHAT_DESCRIPTION = __(
	'Let readers ask your blog questions and get answers from your content.',
	'jetpack-search-pkg'
);

/**
 * Reader Chat opt-in control. Reads and writes the blog_talks_back option
 * via the /wp/v2/settings REST endpoint.
 *
 * Styled to match the "Enable Jetpack Search" toggle pattern in
 * module-control/index.jsx so both cards align on the dashboard.
 *
 * @return {import('react').Component} Reader Chat settings component.
 */
export default function ReaderChatControl() {
	const [ isEnabled, setIsEnabled ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );
	// `isAvailable` tracks whether the site has the `blog_talks_back`
	// setting registered via REST. The PHP registration is dev-mode
	// gated, so on non-proxied sites the key is absent from
	// /wp/v2/settings and the card hides itself.
	const [ isAvailable, setIsAvailable ] = useState( true );
	const storeDispatch = useDispatch( STORE_ID );

	useEffect( () => {
		apiFetch( { path: '/wp/v2/settings' } )
			.then( settings => {
				if ( settings && Object.prototype.hasOwnProperty.call( settings, 'blog_talks_back' ) ) {
					setIsEnabled( Boolean( settings.blog_talks_back ) );
					setIsAvailable( true );
				} else {
					setIsAvailable( false );
				}
			} )
			.catch( () => {
				// On REST failure, hide the card rather than showing a
				// broken toggle. A real outage will be visible elsewhere.
				setIsAvailable( false );
			} )
			.finally( () => {
				setIsLoading( false );
			} );
	}, [] );

	const toggle = useCallback(
		next => {
			setIsSaving( true );
			storeDispatch.updatingNotice();
			apiFetch( {
				path: '/wp/v2/settings',
				method: 'POST',
				data: { blog_talks_back: next },
			} )
				.then( settings => {
					setIsEnabled( Boolean( settings?.blog_talks_back ) );
					storeDispatch.removeUpdatingNotice();
					storeDispatch.successNotice( __( 'Updated settings.', 'jetpack-search-pkg' ) );
				} )
				.catch( () => {
					setIsEnabled( previous => previous );
					storeDispatch.removeUpdatingNotice();
					storeDispatch.errorNotice(
						__( 'Error updating Reader Chat settings.', 'jetpack-search-pkg' )
					);
				} )
				.finally( () => {
					setIsSaving( false );
				} );
		},
		[ storeDispatch ]
	);

	// Hide the entire card when the setting is not registered on this
	// site (non-proxied / non-dev contexts during rollout). Also hide
	// during the initial fetch to avoid a flash of a broken card.
	if ( isLoading || ! isAvailable ) {
		return null;
	}

	return (
		<div className="jp-form-settings-group jp-form-search-settings-group">
			<Card className="jp-form-has-child">
				<div className="jp-form-search-settings-group-inside">
					<div className="jp-form-search-settings-group__toggle jp-search-dashboard-wrap">
						<div className="jp-search-dashboard-row">
							<ToggleControl
								checked={ isEnabled }
								disabled={ isLoading || isSaving }
								onChange={ toggle }
								className="jp-search-dashboard-toggle lg-col-span-12 md-col-span-8 sm-col-span-4"
								label={ __( 'Enable Reader Chat', 'jetpack-search-pkg' ) }
								__nextHasNoMarginBottom
							/>
						</div>
						<div className="jp-search-dashboard-row">
							<div className="jp-form-search-settings-group__toggle-description lg-col-span-7 md-col-span-5 sm-col-span-4">
								<p className="jp-form-search-settings-group__toggle-explanation">
									{ READER_CHAT_DESCRIPTION }
								</p>
							</div>
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
}
