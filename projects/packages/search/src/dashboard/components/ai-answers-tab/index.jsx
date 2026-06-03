import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { TextareaControl, ToggleControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Button, Notice, Stack } from '@wordpress/ui';
import useAiAnswersSettings, { DEFAULT_PERSONALITY } from 'hooks/use-ai-answers-settings';
import useProductCheckoutWorkflow from 'hooks/use-product-checkout-workflow';
import useSearchSettings from 'hooks/use-search-settings';
import { STORE_ID } from 'store';
import './style.scss';

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
	const blogID = useSelect( select => select( STORE_ID ).getBlogId(), [] );
	const siteAdminUrl = useSelect( select => select( STORE_ID ).getSiteAdminUrl(), [] );

	const { isAiAnswersEnabled, isInstantSearchEnabled, setAiAnswersEnabled } = useSearchSettings();

	const { run: sendToCart } = useProductCheckoutWorkflow( {
		productSlug: 'jetpack_search',
		adminUrl: siteAdminUrl,
		redirectUri: 'admin.php?page=jetpack-search&just_upgraded=1',
		from: 'jetpack-search',
		siteSuffix: getSiteFragment(),
		blogID,
		isWpcom: isWpcomPlatformSite(),
	} );

	const { content, setContent, isSaving, isLoading, error, saved, isUnavailable, savePersonality } =
		useAiAnswersSettings();

	const settingsClassName = [
		'jp-search-ai-answers-tab__settings',
		isFreePlan || ! supportsInstantSearch ? 'jp-search-ai-answers-tab__settings--gated' : '',
	]
		.filter( Boolean )
		.join( ' ' );

	const savingLabel = __( 'Saving…', 'jetpack-search-pkg' );
	const saveLabel = __( 'Save', 'jetpack-search-pkg' );

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
								<Button variant="solid" onClick={ sendToCart }>
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
						<Stack
							direction="column"
							gap="lg"
							className="jp-search-ai-answers-tab__settings-inner lg-col-span-8 md-col-span-6 sm-col-span-4"
						>
							{ isLoading && <p>{ __( 'Loading…', 'jetpack-search-pkg' ) }</p> }
							{ supportsInstantSearch && ! isInstantSearchEnabled && (
								<Notice.Root intent="warning">
									<Notice.Title>
										{ __(
											'Instant Search must be enabled for AI Answers to work.',
											'jetpack-search-pkg'
										) }
									</Notice.Title>
									<Notice.Description>
										{ __( 'Enable Instant Search on the Settings tab.', 'jetpack-search-pkg' ) }
									</Notice.Description>
								</Notice.Root>
							) }
							<ToggleControl
								label={ __( 'Enable AI Answers', 'jetpack-search-pkg' ) }
								checked={ isAiAnswersEnabled }
								onChange={ setAiAnswersEnabled }
								className="jp-search-dashboard-toggle lg-col-span-12 md-col-span-8 sm-col-span-4"
								disabled={ ! isInstantSearchEnabled && ! isAiAnswersEnabled }
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
										disabled={ isSaving || ! isAiAnswersEnabled || ! isInstantSearchEnabled }
									/>
									<div className="jp-search-ai-answers-tab__actions">
										<Button
											variant="solid"
											onClick={ savePersonality }
											disabled={ isSaving || ! isAiAnswersEnabled || ! isInstantSearchEnabled }
										>
											{ isSaving ? savingLabel : saveLabel }
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
								<Notice.Root intent="warning">
									<Notice.Title>
										{ __(
											'Personality instructions are temporarily unavailable.',
											'jetpack-search-pkg'
										) }
									</Notice.Title>
									<Notice.Description>
										{ __( 'Please try again later or contact support.', 'jetpack-search-pkg' ) }
									</Notice.Description>
								</Notice.Root>
							) }
						</Stack>
					</div>
				</div>
			</div>
		</div>
	);
}
