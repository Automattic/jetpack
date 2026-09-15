import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import Module from '$features/module/module';
import RenderBlockingJsMeta from '$features/render-blocking-js/render-blocking-js-meta';
import { recordBoostEvent } from '$lib/utils/analytics';

const RenderBlockingJs = () => {
	const deferJsLink = getRedirectUrl( 'jetpack-boost-defer-js' );

	return (
		<Module
			slug="render_blocking_js"
			title={ __( 'Defer Non-Essential JavaScript', 'jetpack-boost' ) }
			description={
				<p>
					{ createInterpolateElement(
						__(
							'Run non-essential JavaScript after the page has loaded so that styles and images can load more quickly. Read more on <link>web.dev</link>.',
							'jetpack-boost'
						),
						{
							link: (
								<Link
									openInNewTab
									onClick={ () => recordBoostEvent( 'defer_js_link_clicked', {} ) }
									href={ deferJsLink }
								/>
							),
						}
					) }
				</p>
			}
		>
			<RenderBlockingJsMeta />
		</Module>
	);
};

export default RenderBlockingJs;
