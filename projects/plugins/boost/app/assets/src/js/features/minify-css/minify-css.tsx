import MinifyLegacyNotice from '$features/minify-legacy-notice/minify-legacy-notice';
import MinifyMeta from '$features/minify-meta/minify-meta';
import { useSingleModuleState } from '$features/module/lib/stores';
import Module from '$features/module/module';
import { useShowMinifyLegacy } from '$lib/stores/minify';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';

const MinifyCss = () => {
	const showMinifyLegacy = useShowMinifyLegacy();
	const [ jsModule ] = useSingleModuleState( 'minify_js' );

	return (
		<Module
			slug="minify_css"
			title={ __( 'Concatenate CSS', 'jetpack-boost' ) }
			description={
				<p>
					{ createInterpolateElement(
						__(
							'Styles are grouped by their original placement, concatenated and minified to reduce site loading time and reduce the number of requests. <learnMore>Learn more</learnMore>.',
							'jetpack-boost'
						),
						{
							learnMore: (
								<Link
									openInNewTab
									href="https://jetpack.com/support/jetpack-boost/troubleshooting-concatenated-css-or-javascript-delivery-methods/"
								/>
							),
						}
					) }
				</p>
			}
			onEnable={ showMinifyLegacy.refetch }
		>
			<MinifyMeta
				datasyncKey="minify_css_excludes"
				buttonText={ __( 'Exclude CSS handles', 'jetpack-boost' ) }
				placeholder={ __( 'Comma-separated list of CSS handles to exclude', 'jetpack-boost' ) }
			/>
			{
				// If the JS module is not active, show the legacy notice under the CSS notice
				! jsModule?.active && showMinifyLegacy?.data && <MinifyLegacyNotice />
			}
		</Module>
	);
};

export default MinifyCss;
