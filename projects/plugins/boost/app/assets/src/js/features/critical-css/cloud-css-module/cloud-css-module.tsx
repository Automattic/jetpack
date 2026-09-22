import { useModuleSurface } from '$features/module/surface';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import CloudCssMeta from '$features/critical-css/cloud-css-meta/cloud-css-meta';
import { useRegenerateCriticalCssAction } from '$features/critical-css/lib/stores/critical-css-state';
import Module from '$features/module/module';
import { recordBoostEvent } from '$lib/utils/analytics';

const CloudCssModule = () => {
	const legacyDescription = __(
		'Move important styling information to the start of the page, which helps pages display your content sooner, so your users don’t have to wait for the entire page to load. Commonly referred to as <link>Critical CSS</link>.',
		'jetpack-boost'
	);
	const modernDescription = __(
		'Prioritizes the styles needed to display the visible part of your page first. Also known as <link>Critical CSS</link>.',
		'jetpack-boost'
	);
	const legacyTitle = __( 'Automatically Optimize CSS Loading', 'jetpack-boost' );
	const modernTitle = __( 'Optimize Critical CSS Loading (Automatic)', 'jetpack-boost' );
	const legacyRegenerationHelp = __(
		'<b>Boost will automatically generate your Critical CSS</b> whenever you make changes to the HTML or CSS structure of your site.',
		'jetpack-boost'
	);
	const modernRegenerationHelp = __(
		'Boost will automatically generate your Critical CSS whenever you make changes.',
		'jetpack-boost'
	);
	const isModern = useModuleSurface() === 'row';
	const criticalCssLink = getRedirectUrl( 'jetpack-boost-critical-css' );
	const regenerateCssAction = useRegenerateCriticalCssAction();

	const handleCriticalCssLink = () => {
		recordBoostEvent( 'critical_css_link_clicked', {} );
	};

	return (
		<Module
			slug="cloud_css"
			title={ isModern ? modernTitle : legacyTitle }
			worksOffline={ false }
			onEnable={ () => regenerateCssAction.mutate() }
			description={
				<>
					<p>
						{ createInterpolateElement( isModern ? modernDescription : legacyDescription, {
							link: (
								<Link openInNewTab href={ criticalCssLink } onClick={ handleCriticalCssLink } />
							),
						} ) }
					</p>
					<p>
						{ createInterpolateElement(
							isModern ? modernRegenerationHelp : legacyRegenerationHelp,
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
