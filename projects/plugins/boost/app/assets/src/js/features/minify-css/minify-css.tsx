import MinifyLegacyNotice from '$features/minify-legacy-notice/minify-legacy-notice';
import MinifyMeta from '$features/minify-meta/minify-meta';
import { useSingleModuleState } from '$features/module/lib/stores';
import Module from '$features/module/module';
import { useShowMinifyLegacy } from '$lib/stores/minify';
import { __ } from '@wordpress/i18n';

const MinifyCss = () => {
	const showMinifyLegacy = useShowMinifyLegacy();
	const [ jsModule ] = useSingleModuleState( 'minify_js' );

	return (
		<Module
			slug="minify_css"
			title={ __( 'Concatenate CSS', 'jetpack-boost' ) }
			description={
				<p>
					{ __(
						'Combines and minifies stylesheet files to reduce the number of styles your site needs to load.',
						'jetpack-boost'
					) }
				</p>
			}
			onEnable={ showMinifyLegacy.refetch }
		>
			<MinifyMeta
				datasyncKey="minify_css_excludes"
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
