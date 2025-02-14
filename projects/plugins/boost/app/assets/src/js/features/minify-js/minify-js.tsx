import LegacyMinifyNotice from '$features/minify-legacy-notice/legacy-minify-notice';
import MinifyMeta from '$features/minify-meta/minify-meta';
import Module from '$features/module/module';
import { useStaticMinificationNotice } from '$lib/stores/static-minification';
import { __ } from '@wordpress/i18n';

const MinifyJs = () => {
	const isStaticMinificationEnabled = useStaticMinificationNotice();

	return (
		<Module
			slug="minify_js"
			title={ __( 'Concatenate JS', 'jetpack-boost' ) }
			description={
				<p>
					{ __(
						'Scripts are grouped by their original placement, concatenated and minified to reduce site loading time and reduce the number of requests.',
						'jetpack-boost'
					) }
				</p>
			}
			onEnable={ isStaticMinificationEnabled.refetch }
		>
			<MinifyMeta
				datasyncKey="minify_js_excludes"
				buttonText={ __( 'Exclude JS handles', 'jetpack-boost' ) }
				placeholder={ __( 'Comma separated list of JS handles to exclude', 'jetpack-boost' ) }
			/>
			{ ! isStaticMinificationEnabled?.data && <LegacyMinifyNotice /> }
		</Module>
	);
};

export default MinifyJs;
