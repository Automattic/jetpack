import analytics from '@automattic/jetpack-analytics';
import apiFetch from '@wordpress/api-fetch';
import { ExternalLink, ToggleControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from 'react';
import Card from 'components/card';
import { STORE_ID } from 'store';

const AI_AGENT_ACCESS_DESCRIPTION = __(
	'Let AI assistants like Claude and ChatGPT answer questions from your blog’s content on behalf of WordPress.com users who have opted in.',
	'jetpack-search-pkg'
);
const WP_SETTINGS_PATH = '/wp/v2/settings';
const WPCOM_AI_AGENTS_SETTINGS_PATH = '/wpcom/v2/ai-agents-settings';

/**
 * AI Agent Access opt-in control.
 *
 * @param {object}  props               - Component properties.
 * @param {string}  props.guidelinesUrl - Guidelines admin URL, when available.
 * @param {boolean} props.isAvailable   - Whether the control is available in this rollout context.
 * @return {import('react').Component} AI Agent Access settings component.
 */
export default function AIAgentAccessControl( { guidelinesUrl, isAvailable = true } ) {
	const [ isEnabled, setIsEnabled ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );
	const isWpcom = useSelect( select => select( STORE_ID ).isWpcom(), [] );
	const [ isSettingAvailable, setIsSettingAvailable ] = useState( true );
	const storeDispatch = useDispatch( STORE_ID );
	const settingsPath = isWpcom ? WPCOM_AI_AGENTS_SETTINGS_PATH : WP_SETTINGS_PATH;
	const settingsKey = isWpcom ? 'enabled' : 'jetpack_ai_agents_enabled';

	useEffect( () => {
		if ( ! isAvailable ) {
			setIsLoading( false );
			return;
		}

		apiFetch( { path: settingsPath } )
			.then( settings => {
				if ( settings && Object.prototype.hasOwnProperty.call( settings, settingsKey ) ) {
					setIsEnabled( Boolean( settings[ settingsKey ] ) );
					setIsSettingAvailable( true );
				} else {
					setIsSettingAvailable( false );
				}
			} )
			.catch( () => {
				// Hide the card on unsupported older builds or REST failures.
				setIsSettingAvailable( false );
			} )
			.finally( () => {
				setIsLoading( false );
			} );
	}, [ isAvailable, settingsKey, settingsPath ] );

	const toggle = useCallback(
		next => {
			setIsSaving( true );
			storeDispatch.updatingNotice();
			apiFetch( {
				path: settingsPath,
				method: 'POST',
				data: isWpcom ? { enabled: next } : { jetpack_ai_agents_enabled: next },
			} )
				.then( settings => {
					const updatedEnabled = Boolean( settings?.[ settingsKey ] );

					setIsEnabled( updatedEnabled );
					if ( updatedEnabled !== isEnabled ) {
						analytics.tracks.recordEvent( 'jetpack_search_ai_agent_access_toggle', {
							enabled: updatedEnabled,
							previous_enabled: isEnabled,
							is_wpcom: isWpcom,
							surface: 'jetpack_search_dashboard',
						} );
					}
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
		[ isEnabled, isWpcom, settingsKey, settingsPath, storeDispatch ]
	);

	if ( ! isAvailable || isLoading || ! isSettingAvailable ) {
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
								{ isEnabled && guidelinesUrl && (
									<p className="jp-form-search-settings-group__toggle-explanation">
										<ExternalLink href={ guidelinesUrl }>
											{ __( 'Set guidelines', 'jetpack-search-pkg' ) }
										</ExternalLink>
									</p>
								) }
							</div>
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
}
