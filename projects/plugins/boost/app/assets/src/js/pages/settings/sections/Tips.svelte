<script>
	import { __ } from '@wordpress/i18n';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import externalLinkTemplateVar from '../../../utils/external-link-template-var';
</script>

<div class="jb-container--narrow">
	<div class="jb-tips">
		<h3 class="jb-tips__title">
			{__( 'Did you know?', 'jetpack-boost' )}
		</h3>
		<div class="jb-tips__items">
			<div class="item">
				<div class="item__rate">4x</div>
				<div class="item__description">
					<TemplatedString
						template={__(
							`Pages that take over 3 seconds to load have 4x the bounce
							rate of pages that load in 2 seconds or less. (source: <link>Pingdom</link>).`,
							'jetpack-boost'
						)}
						vars={externalLinkTemplateVar(
							'https://royal.pingdom.com/page-load-time-really-affect-bounce-rate/'
						)}
					/>
				</div>
			</div>
			<div class="item">
				<div class="item__rate">20%</div>
				<div class="item__description">
					<TemplatedString
						template={__(
							`A one-second delay in loading times can reduce conversion
							rates by 20%. (source: <link>Google</link>).`,
							'jetpack-boost'
						)}
						vars={externalLinkTemplateVar( 'https://web.dev/why-speed-matters/' )}
					/>
				</div>
			</div>
		</div>
	</div>
</div>
