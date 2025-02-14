import LegacyMinifyNotice from '$features/minify-legacy-notice/legacy-minify-notice';
import MinifyMeta from '$features/minify-meta/minify-meta';
import { useSingleModuleState } from '$features/module/lib/stores';
import Module from '$features/module/module';
import { useStaticMinificationNotice } from '$lib/stores/static-minification';
import { __ } from '@wordpress/i18n';

const MinifyCss = () => {
	const isStaticMinificationEnabled = useStaticMinificationNotice();
	const [ jsModule ] = useSingleModuleState( 'minify_js' );

	return (
		<Module
			slug="minify_css"
			title={ __( 'Concatenate CSS', 'jetpack-boost' ) }
			description={
				<p>
					{ __(
						'Styles are grouped by their original placement, concatenated and minified to reduce site loading time and reduce the number of requests.',
						'jetpack-boost'
					) }
				</p>
			}
			onEnable={ isStaticMinificationEnabled.refetch }
		>
			<MinifyMeta
				datasyncKey="minify_css_excludes"
				buttonText={ __( 'Exclude CSS handles', 'jetpack-boost' ) }
				placeholder={ __( 'Comma separated list of CSS handles to exclude', 'jetpack-boost' ) }
			/>
			{
				// If the JS module is not active, show the legacy notice under the CSS notice
				! jsModule?.active && ! isStaticMinificationEnabled?.data && <LegacyMinifyNotice />
			}
		</Module>
	);
};

export default MinifyCss;
