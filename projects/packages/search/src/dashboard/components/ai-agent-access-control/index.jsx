import apiFetch from '@wordpress/api-fetch';
import { ExternalLink, ToggleControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from 'react';
import Card from 'components/card';
import { STORE_ID } from 'store';

const AI_AGENT_ACCESS_DESCRIPTION = __(
	'Let AI assistants like Claude and ChatGPT answer questions from your blog\u2019s content on behalf of WordPress.com users who have opted in.',
	'jetpack-search-pkg'
);
const AI_AGENT_ACCESS_LEARN_MORE_URL = 'https://jetpack.com/support/ai-agent-access/';

/**
 * AI Agent Access opt-in control. Reads and writes the
 * `jetpack_ai_agents_enabled` option via the /wp/v2/settings REST endpoint.
 *
 * Mirrors the Reader Chat control (see reader-chat-control/index.jsx in
 * https://github.com/Automattic/jetpack/pull/48144) so both cards align on
 * the dashboard.
 *
 * @return {import('react').Component} AI Agent Access settings component.
 */
export default function AIAgentAccessControl() {
	const [ isEnabled, setIsEnabled ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );
	// `isAvailable` tracks whether the site has the
	// `jetpack_ai_agents_enabled` setting registered via REST. If the
	// Jetpack version on the site predates this feature, the key is absent
	// from /wp/v2/settings and the card hides itself.
	const [ isAvailable, setIsAvailable ] = useState( true );
	const storeDispatch = useDispatch( STORE_ID );

	useEffect( () => {
		apiFetch( { path: '/wp/v2/settings' } )
			.then( settings => {
				if (
					settings &&
					Object.prototype.hasOwnProperty.call( settings, 'jetpack_ai_agents_enabled' )
				) {
					setIsEnabled( Boolean( settings.jetpack_ai_agents_enabled ) );
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
				data: { jetpack_ai_agents_enabled: next },
			} )
				.then( settings => {
					setIsEnabled( Boolean( settings?.jetpack_ai_agents_enabled ) );
					storeDispatch.removeUpdatingNotice();
					storeDispatch.successNotice( __( 'Updated settings.', 'jetpack-search-pkg' ) );
				} )
				.catch( () => {
					setIsEnabled( previous => previous );
					storeDispatch.removeUpdatingNotice();
					storeDispatch.errorNotice(
						__( 'Error updating AI Agent Access settings.', 'jetpack-search-pkg' )
					);
				} )
				.finally( () => {
					setIsSaving( false );
				} );
		},
		[ storeDispatch ]
	);

	// Hide the entire card when the setting is not registered on this
	// site (older Jetpack versions). Also hide during the initial fetch to
	// avoid a flash of a broken card.
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
								label={ __( 'Enable AI Agent Access', 'jetpack-search-pkg' ) }
								__nextHasNoMarginBottom
							/>
						</div>
						<div className="jp-search-dashboard-row">
							<div className="jp-form-search-settings-group__toggle-description lg-col-span-7 md-col-span-5 sm-col-span-4">
								<p className="jp-form-search-settings-group__toggle-explanation">
									{ AI_AGENT_ACCESS_DESCRIPTION }
								</p>
								<p className="jp-form-search-settings-group__toggle-explanation">
									<ExternalLink href={ AI_AGENT_ACCESS_LEARN_MORE_URL }>
										{ __( 'Learn more', 'jetpack-search-pkg' ) }
									</ExternalLink>
								</p>
							</div>
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
}
