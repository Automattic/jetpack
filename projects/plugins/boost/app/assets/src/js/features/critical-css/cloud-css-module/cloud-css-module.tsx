import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import CloudCssMeta from '$features/critical-css/cloud-css-meta/cloud-css-meta';
import { useRegenerateCriticalCssAction } from '$features/critical-css/lib/stores/critical-css-state';
import Module from '$features/module/module';
import { recordBoostEvent } from '$lib/utils/analytics';

const CloudCssModule = () => {
	const criticalCssLink = getRedirectUrl( 'jetpack-boost-critical-css' );
	const regenerateCssAction = useRegenerateCriticalCssAction();

	const handleCriticalCssLink = () => {
		recordBoostEvent( 'critical_css_link_clicked', {} );
	};

	return (
		<Module
			slug="cloud_css"
			title={ __( 'Automatically Optimize CSS Loading', 'jetpack-boost' ) }
			worksOffline={ false }
			onEnable={ () => regenerateCssAction.mutate() }
			description={
				<>
					<p>
						{ createInterpolateElement(
							__(
								`Move important styling information to the start of the page, which helps pages display your content sooner, so your users don’t have to wait for the entire page to load. Commonly referred to as <link>Critical CSS</link>.`,
								'jetpack-boost'
							),
							{
								link: (
									<Link openInNewTab href={ criticalCssLink } onClick={ handleCriticalCssLink } />
								),
							}
						) }
					</p>
					<p>
						{ createInterpolateElement(
							__(
								`<b>Boost will automatically generate your Critical CSS</b> whenever you make changes to the HTML or CSS structure of your site.`,
								'jetpack-boost'
							),
							{
								b: <strong />,
							}
						) }
					</p>
				</>
			}
		>
			<CloudCssMeta />
		</Module>
	);
};

export default CloudCssModule;
