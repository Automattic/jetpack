import analytics from '@automattic/jetpack-analytics';
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import {
	getScriptData,
	getSiteData,
	getSiteType,
	isWpcomPlatformSite,
} from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Stack, Tabs } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
import FreshlyPressedPanel from './freshly-pressed-panel.jsx';
import PromptPanel from './prompt-panel.jsx';

const PROMPT_TAB = 'prompt';
const FRESHLY_PRESSED_TAB = 'freshly-pressed';

const WritingPrompt = () => {
	const [ prompts, setPrompts ] = useState( [] );
	const [ loaded, setLoaded ] = useState( false );
	const [ tab, setTab ] = useState( PROMPT_TAB );

	// Get site type for analytics.
	const siteType = useMemo( () => getSiteType(), [] );

	// The Freshly Pressed posts are fetched and cached server-side, so they
	// arrive with the page rather than through a request of their own.
	const freshlyPressed = useMemo( () => getScriptData()?.newsletter?.freshlyPressed ?? [], [] );

	// Initialize analytics with user data.
	useEffect( () => {
		const tracksUserData = getScriptData()?.newsletter?.tracksUserData;
		if ( tracksUserData && typeof tracksUserData === 'object' ) {
			analytics.initialize( tracksUserData.userid, tracksUserData.username );
		}
	}, [] );

	useEffect( () => {
		const now = new Date();
		const mm = String( now.getMonth() + 1 ).padStart( 2, '0' );
		const dd = String( now.getDate() ).padStart( 2, '0' );
		// See projects/packages/jetpack-mu-wpcom/src/features/wpcom-block-editor-nux/src/blogging-prompts-modal/index.js
		const path = addQueryArgs( `/wpcom/v3/blogging-prompts`, {
			per_page: 10,
			after: `--${ mm }-${ dd }`,
			order: 'desc',
			force_year: new Date().getFullYear(),
		} );
		apiFetch( { path } )
			.then( data => setPrompts( Array.isArray( data ) ? data : [] ) )
			.catch( () => {} )
			.finally( () => setLoaded( true ) );
	}, [] );

	const recordReaderClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_writing_prompt_reader_click', {
			site_type: siteType,
		} );
	}, [ siteType ] );

	const selectTab = useCallback(
		nextTab => {
			setTab( nextTab );

			if ( nextTab === FRESHLY_PRESSED_TAB ) {
				analytics.tracks.recordEvent(
					'jetpack_newsletter_writing_prompt_freshly_pressed_tab_click',
					{ site_type: siteType }
				);
			}
		},
		[ siteType ]
	);

	// Render nothing while the prompts are still loading so the widget stays
	// empty until we know whether we have a prompt to show. Once the fetch has
	// settled we always render the branding footer, even when no prompt came
	// back, so the widget never collapses to a blank box.
	if ( ! loaded ) {
		return null;
	}

	const blogId = getSiteData()?.wpcom?.blog_id;
	const readerUrl = addQueryArgs(
		'https://wordpress.com/reader',
		blogId ? { origin_site_id: blogId } : {}
	);
	const openReaderInNewTab = ! isWpcomPlatformSite();

	const promptPanel = (
		<PromptPanel
			prompts={ prompts }
			siteType={ siteType }
			readerUrl={ readerUrl }
			openReaderInNewTab={ openReaderInNewTab }
			onReaderClick={ recordReaderClick }
		/>
	);

	return (
		<Stack direction="column" gap="md">
			{ freshlyPressed.length > 0 ? (
				<Tabs.Root value={ tab } onValueChange={ selectTab }>
					{ /* `Tabs.List` is `width: fit-content`, so the strip's background needs a wrapper to span the widget. */ }
					<div className="wpcom-daily-writing-prompt--tabs">
						<Tabs.List variant="minimal">
							<Tabs.Tab value={ PROMPT_TAB }>
								{ __( 'Writing Prompt', 'jetpack-newsletter' ) }
							</Tabs.Tab>
							<Tabs.Tab value={ FRESHLY_PRESSED_TAB }>
								{ __( 'Freshly Pressed', 'jetpack-newsletter' ) }
							</Tabs.Tab>
						</Tabs.List>
					</div>
					{ /* Kept mounted so a trip to Freshly Pressed doesn't rewind the prompt you were on. */ }
					<Tabs.Panel
						className="wpcom-daily-writing-prompt--panel"
						value={ PROMPT_TAB }
						keepMounted
					>
						{ promptPanel }
					</Tabs.Panel>
					<Tabs.Panel className="wpcom-daily-writing-prompt--panel" value={ FRESHLY_PRESSED_TAB }>
						<FreshlyPressedPanel posts={ freshlyPressed } siteType={ siteType } />
					</Tabs.Panel>
				</Tabs.Root>
			) : (
				promptPanel
			) }
			<Stack
				className="wpcom-daily-writing-prompt--branding"
				direction="row"
				justify="space-between"
				align="center"
				gap="sm"
				wrap="wrap"
			>
				<JetpackLogo logoColor="#000000" height={ 20 } />
				<Link
					tone="neutral"
					href={ readerUrl }
					openInNewTab={ openReaderInNewTab }
					rel={ openReaderInNewTab ? 'noreferrer noopener' : undefined }
					onClick={ recordReaderClick }
				>
					{ __( 'Read the blogs and topics you follow', 'jetpack-newsletter' ) }
				</Link>
			</Stack>
		</Stack>
	);
};

export default WritingPrompt;
