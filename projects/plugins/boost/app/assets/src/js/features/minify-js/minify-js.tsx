import MinifyLegacyNotice from '$features/minify-legacy-notice/minify-legacy-notice';
import MinifyMeta from '$features/minify-meta/minify-meta';
import Module from '$features/module/module';
import { useShowMinifyLegacy } from '$lib/stores/minify';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';

const MinifyJs = () => {
	const showMinifyLegacy = useShowMinifyLegacy();

	return (
		<Module
			slug="minify_js"
			title={ __( 'Concatenate JS', 'jetpack-boost' ) }
			description={
				<p>
					{ createInterpolateElement(
						__(
							'Scripts are grouped by their original placement, concatenated and minified to reduce site loading time and reduce the number of requests. <learnMore>Learn more</learnMore>.',
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
				datasyncKey="minify_js_excludes"
				buttonText={ __( 'Exclude JS handles', 'jetpack-boost' ) }
				placeholder={ __( 'Comma-separated list of JS handles to exclude', 'jetpack-boost' ) }
			/>
			{ showMinifyLegacy?.data && <MinifyLegacyNotice /> }
		</Module>
	);
};

export default MinifyJs;
