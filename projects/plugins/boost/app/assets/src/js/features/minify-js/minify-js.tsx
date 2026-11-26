import MinifyLegacyNotice from '$features/minify-legacy-notice/minify-legacy-notice';
import MinifyMeta from '$features/minify-meta/minify-meta';
import Module from '$features/module/module';
import { useShowMinifyLegacy } from '$lib/stores/minify';
import { __ } from '@wordpress/i18n';

const MinifyJs = () => {
	const showMinifyLegacy = useShowMinifyLegacy();

	return (
		<Module
			slug="minify_js"
			title={ __( 'Concatenate JavaScript', 'jetpack-boost' ) }
			description={
				<p>
					{ __(
						'Combines and minifies JavaScript files to reduce the number of scripts your site needs to load.',
						'jetpack-boost'
					) }
				</p>
			}
			onEnable={ showMinifyLegacy.refetch }
		>
			<MinifyMeta
				datasyncKey="minify_js_excludes"
				placeholder={ __( 'Comma-separated list of JS handles to exclude', 'jetpack-boost' ) }
			/>
			{ showMinifyLegacy?.data && <MinifyLegacyNotice /> }
		</Module>
	);
};

export default MinifyJs;
