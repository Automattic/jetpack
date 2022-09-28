<script>
	import { ProductPrice } from '@automattic/jetpack-components';
	import { __ } from '@wordpress/i18n';
	import ReactComponent from '../../elements/ReactComponent.svelte';
	import Header from '../../sections/Header.svelte';
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
					<p class="comparison-table__feature-row">Optimize CSS Loading</p>
					<hr />
					<p class="comparison-table__feature-row">Defer non-essential JavaScript</p>
					<hr />
					<p class="comparison-table__feature-row">Lazy image loading</p>
					<hr />
					<p class="comparison-table__feature-row">Dedicated email support</p>
					<hr />

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
					<p class="comparison-table__feature-row">Optimize CSS Loading</p>
					<hr />
					<p class="comparison-table__feature-row">Defer non-essential JavaScript</p>
					<hr />
					<p class="comparison-table__feature-row">Lazy image loading</p>
					<hr />
					<p class="comparison-table__feature-row">Dedicated email support</p>
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
					<p class="comparison-table__feature-row">Optimize CSS Loading</p>
					<hr />
					<p class="comparison-table__feature-row">Defer non-essential JavaScript</p>
					<hr />
					<p class="comparison-table__feature-row">Lazy image loading</p>
					<hr />
					<p class="comparison-table__feature-row">Dedicated email support</p>
					<hr />

					<footer class="comparison-table__spacing" />
				</div>
			</div>
		</div>
	</div>
</div>
