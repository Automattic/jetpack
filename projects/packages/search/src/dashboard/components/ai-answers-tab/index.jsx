import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	ExternalLink,
	Notice,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from 'react';
import useProductCheckoutWorkflow from 'hooks/use-product-checkout-workflow';
import { STORE_ID } from 'store';
import './style.scss';

const REST_BASE = '/wp/v2/guidelines';
const DEFAULT_PERSONALITY = __(
	'You are a search results summarizer for Jetpack Search. Your job is to summarize the best available successful search results in a succinct manner.',
	'jetpack-search-pkg'
);

/**
 * AiAnswersTab component for configuring AI Answers settings.
 *
 * @return {import('react').ReactElement} AiAnswersTab component.
 */
export default function AiAnswersTab() {
	const supportsInstantSearch = useSelect(
		select => select( STORE_ID ).supportsInstantSearch(),
		[]
	);
	const isFreePlan = useSelect( select => select( STORE_ID ).isFreePlan(), [] );
	const isAiAnswersEnabled = useSelect( select => select( STORE_ID ).isAiAnswersEnabled(), [] );
	const domain = useSelect( select => select( STORE_ID ).getCalypsoSlug(), [] );
	const blogID = useSelect( select => select( STORE_ID ).getBlogId(), [] );
	const siteAdminUrl = useSelect( select => select( STORE_ID ).getSiteAdminUrl(), [] );
	const isWpcom = useSelect( select => select( STORE_ID ).isWpcom(), [] );

	const { updateJetpackSettings } = useDispatch( STORE_ID );

	const { run: sendToCart } = useProductCheckoutWorkflow( {
		productSlug: 'jetpack_search',
		adminUrl: siteAdminUrl,
		redirectUri: 'admin.php?page=jetpack-search&just_upgraded=1',
		from: 'jetpack-search',
		siteSuffix: domain,
		blogID,
		isWpcom,
	} );

	// Personality textarea state (migrated from BehaviorTab)
	const [ content, setContent ] = useState( '' );
	const [ postId, setPostId ] = useState( null );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState( null );
	const [ saved, setSaved ] = useState( false );
	const [ isUnavailable, setIsUnavailable ] = useState( false );

	useEffect( () => {
		apiFetch( { path: REST_BASE } )
			.then( posts => {
				const post = Array.isArray( posts ) ? posts[ 0 ] : posts;
				// id === 0 means no guidelines exist yet (singleton empty response).
				if ( post && post.id ) {
					setPostId( post.id );
					setContent(
						post.guideline_categories?.blocks?.[ 'jetpack/search-ai-summary' ]?.guidelines ?? ''
					);
				}
			} )
			.catch( err => {
				if ( err.code === 'rest_no_route' || err.data?.status === 404 ) {
					setIsUnavailable( true );
				} else {
					setError( err.message );
				}
			} )
			.finally( () => setIsLoading( false ) );
	}, [] );

	const savePersonality = () => {
		setIsSaving( true );
		setSaved( false );
		setError( null );
		const path = postId ? `${ REST_BASE }/${ postId }` : REST_BASE;
		const method = postId ? 'PATCH' : 'POST';
		apiFetch( {
			path,
			method,
			data: {
				status: 'publish',
				guideline_categories: {
					blocks: { 'jetpack/search-ai-summary': { guidelines: content || DEFAULT_PERSONALITY } },
				},
			},
		} )
			.then( post => {
				setPostId( post.id );
				setSaved( true );
			} )
			.catch( err => setError( err.message ) )
			.finally( () => setIsSaving( false ) );
	};

	const settingsClassName = [
		'jp-search-ai-answers-tab__settings',
		isFreePlan || ! supportsInstantSearch ? 'jp-search-ai-answers-tab__settings--gated' : '',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<div className="jp-search-ai-answers-tab">
			{ ( isFreePlan || ! supportsInstantSearch ) && (
				<div className="jp-search-ai-answers-tab__upsell">
					<div className="jp-search-dashboard-wrap">
						<div className="jp-search-dashboard-row">
							<div className="jp-search-ai-answers-tab__upsell-inner lg-col-span-8 md-col-span-6 sm-col-span-4">
								<h2 className="jp-search-ai-answers-tab__upsell-heading">
									{ __( 'Upgrade to use AI Answers', 'jetpack-search-pkg' ) }
								</h2>
								<ul className="jp-search-ai-answers-tab__upsell-bullets">
									<li>
										{ __(
											'Give visitors real answers, not just search results.',
											'jetpack-search-pkg'
										) }
									</li>
									<li>
										{ __( "Fills gaps when your content doesn't match.", 'jetpack-search-pkg' ) }
									</li>
									<li>
										{ __(
											'Serious, silly, or snarky — your personality, your search.',
											'jetpack-search-pkg'
										) }
									</li>
								</ul>
								<Button variant="primary" onClick={ sendToCart }>
									{ __( 'Upgrade now', 'jetpack-search-pkg' ) }
								</Button>
							</div>
						</div>
					</div>
				</div>
			) }

			<div className={ settingsClassName } data-testid="ai-answers-settings">
				<div className="jp-search-dashboard-wrap">
					<div className="jp-search-dashboard-row">
						<div className="jp-search-ai-answers-tab__settings-inner lg-col-span-8 md-col-span-6 sm-col-span-4">
							{ isLoading && <p>{ __( 'Loading…', 'jetpack-search-pkg' ) }</p> }
							<ToggleControl
								label={ __( 'Enable AI Answers', 'jetpack-search-pkg' ) }
								checked={ isAiAnswersEnabled }
								onChange={ value => updateJetpackSettings( { ai_answers_enabled: value } ) }
								className="jp-search-dashboard-toggle lg-col-span-12 md-col-span-8 sm-col-span-4"
							/>

							{ ! isLoading && ! isUnavailable && (
								<>
									{ error && <p className="jp-search-ai-answers-tab__error">{ error }</p> }
									<TextareaControl
										label={ __( 'Personality', 'jetpack-search-pkg' ) }
										value={ content }
										onChange={ setContent }
										placeholder={ DEFAULT_PERSONALITY }
										rows={ 10 }
										disabled={ isSaving || ! isAiAnswersEnabled }
									/>
									<div className="jp-search-ai-answers-tab__actions">
										<Button
											variant="primary"
											onClick={ savePersonality }
											isBusy={ isSaving }
											disabled={ isSaving || ! isAiAnswersEnabled }
										>
											{ __( 'Save', 'jetpack-search-pkg' ) }
										</Button>
										{ saved && (
											<span className="jp-search-ai-answers-tab__saved">
												{ __( 'Saved.', 'jetpack-search-pkg' ) }
											</span>
										) }
									</div>
								</>
							) }

							{ ! isLoading && isUnavailable && (
								<Notice status="warning" isDismissible={ false }>
									<p>
										{ __(
											'Personality instructions require the Gutenberg Guidelines feature. To enable it:',
											'jetpack-search-pkg'
										) }
									</p>
									<ol>
										<li>
											{ __(
												'Install or update to Gutenberg 22.7 or later.',
												'jetpack-search-pkg'
											) }
										</li>
										<li>
											{ __(
												'Go to Settings → Gutenberg → Experiments and enable "Guidelines".',
												'jetpack-search-pkg'
											) }{ ' ' }
											<ExternalLink
												href={ `${ siteAdminUrl }admin.php?page=gutenberg-experiments` }
											>
												{ __( 'Open Experiments page', 'jetpack-search-pkg' ) }
											</ExternalLink>
										</li>
									</ol>
								</Notice>
							) }
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
