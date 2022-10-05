<script>
	import { ProductPrice } from '@automattic/jetpack-components';
	import { __ } from '@wordpress/i18n';
	import ContextInfo from '../../elements/ContextInfo.svelte';
	import ReactComponent from '../../elements/ReactComponent.svelte';
	import TemplatedString from '../../elements/TemplatedString.svelte';
	import Header from '../../sections/Header.svelte';
	import externalLinkTemplateVar from '../../utils/external-link-template-var';

	const cssOptimizationContext = __(
		'Move important styling information to the start of the page, which helps pages display your content sooner, so your users don’t have to wait for the entire page to load. Commonly referred to as Critical CSS.',
		'jetpack-boost'
	);

	const deferJSContext = __(
		'Run non-essential JavaScript after the page has loaded so that styles and images can load more quickly. Read more on <link>web.dev</link>.',
		'jetpack-boost'
	);

	const lazyLoadingContext = __(
		'Improve page loading speed by only loading images when they are required. Read more on <link>web.dev</link>.',
		'jetpack-boost'
	);

	const supportContext = __(
		`<p>Paid customers get dedicated email support from our world-class Happiness Engineers to help with any issue.</p><p>All other questions are handled by our team as quickly as we are able to go through the WordPress support forum.</p>`,
		'jetpack-boost'
	);

	const webDevLink = 'https://web.dev/';
</script>

<div id="jb-settings" class="jb-settings jb-settings--main">
	<div class="jb-container">
		<Header />
	</div>

	<div class="jb-section jb-section--alt jb-section--scores">
		<div class="jb-container">
			<div class="comparison-table" style="--rows: 11; --columns: 3">
				<div class="comparison-table__main">
					<h1>{__( 'The easiest speed optimization plugin for WordPress', 'jetpack-boost' )}</h1>

					<p class="visible-md comparison-table__feature-row">
						Optimize CSS Loading
						<ContextInfo placement="left">{cssOptimizationContext}</ContextInfo>
					</p>
					<hr class="visible-md" />
					<p class="visible-md comparison-table__feature-row">
						Defer non-essential JavaScript
						<ContextInfo placement="left">
							<TemplatedString
								template={deferJSContext}
								vars={{
									...externalLinkTemplateVar( webDevLink ),
								}}
							/>
						</ContextInfo>
					</p>
					<hr class="visible-md" />
					<p class="visible-md comparison-table__feature-row">
						Lazy image loading
						<ContextInfo placement="left">
							<TemplatedString
								template={lazyLoadingContext}
								vars={{
									...externalLinkTemplateVar( webDevLink ),
								}}
							/>
						</ContextInfo>
					</p>
					<hr class="visible-md" />
					<p class="visible-md comparison-table__feature-row">
						Dedicated email support
						<ContextInfo placement="left">
							{@html supportContext}
						</ContextInfo>
					</p>
					<hr class="visible-md" />

					<footer class="comparison-table__spacing" />
				</div>
				<div class="comparison-table__tier comparison-table__tier--card">
					<header>
						<ReactComponent
							this={ProductPrice}
							price={18}
							offPrice={9}
							priceDetails={__( '/month, paid yearly', 'jetpack-boost' )}
							showNotOffPrice={true}
							currency="USD"
						/>
					</header>
					<div class="comparison-table__cta">
						<button type="button" class="components-button jb-button jb-button--primary">
							Get Boost
						</button>
					</div>
					<p class="comparison-table__feature-row">
						<span class="jb-icon jb-icon--check" />
						<strong class="visible-md">Automatically kept up to date</strong>
						<strong class="comparison-table__feature-elaborate hidden-md"
							>CSS optimization automatically kept up to date</strong
						>
						<span class="hidden-md"
							><ContextInfo placement="left">{cssOptimizationContext}</ContextInfo></span
						>
					</p>
					<hr />
					<p class="comparison-table__feature-row">
						<span class="jb-icon jb-icon--check" />
						<span class="visible-md">Included</span>
						<span class="comparison-table__feature-elaborate hidden-md"
							>Defer non-essential JavaScript</span
						>
						<span class="hidden-md">
							<ContextInfo placement="left">
								<TemplatedString
									template={deferJSContext}
									vars={{
										...externalLinkTemplateVar( webDevLink ),
									}}
								/>
							</ContextInfo>
						</span>
					</p>
					<hr />
					<p class="comparison-table__feature-row">
						<span class="jb-icon jb-icon--check" />
						<span class="visible-md">Included</span>
						<span class="comparison-table__feature-elaborate hidden-md">Lazy image loading</span>
						<span class="hidden-md">
							<ContextInfo placement="left">
								<TemplatedString
									template={lazyLoadingContext}
									vars={{
										...externalLinkTemplateVar( webDevLink ),
									}}
								/>
							</ContextInfo>
						</span>
					</p>
					<hr />
					<p class="comparison-table__feature-row">
						<span class="jb-icon jb-icon--check" />
						<span class="visible-md">Included</span>
						<span class="comparison-table__feature-elaborate hidden-md"
							>Dedicated email support</span
						>
						<span class="hidden-md">
							<ContextInfo placement="left">
								{@html supportContext}
							</ContextInfo>
						</span>
					</p>
					<hr />

					<footer class="comparison-table__spacing" />
				</div>
				<div class="comparison-table__tier">
					<header>
						<ReactComponent
							this={ProductPrice}
							price={0}
							currency="USD"
							hidePriceFraction={true}
							leyend=""
						/>
					</header>
					<div class="comparison-table__cta">
						<button type="button" class="components-button jb-button jb-button--outline">
							Start for free
						</button>
					</div>
					<p class="comparison-table__feature-row">
						<span class="jb-icon jb-icon--check" />
						<span class="visible-md">Manual generation</span>
						<strong class="hidden-md">Optimize CSS loading manually</strong>
					</p>
					<hr />
					<p class="comparison-table__feature-row">
						<span class="jb-icon jb-icon--check" />
						<span class="visible-md">Included</span>
						<span class="hidden-md">Defer non-essential JavaScript</span>
					</p>
					<hr />
					<p class="comparison-table__feature-row">
						<span class="jb-icon jb-icon--check" />
						<span class="visible-md">Included</span>
						<span class="hidden-md">Lazy image loading</span>
					</p>
					<hr />
					<p class="comparison-table__feature-row">
						<span class="jb-icon jb-icon--cross" />
						<span class="visible-md">Not Included</span>
						<span class="hidden-md">Dedicated email support</span>
					</p>
					<hr />

					<footer class="comparison-table__spacing" />
				</div>
			</div>
		</div>
	</div>
</div>
