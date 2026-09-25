import CornerstonePages from '$features/cornerstone-pages/cornerstone-pages';
import CloudCssModule from '$features/critical-css/cloud-css-module/cloud-css-module';
import CriticalCssModule from '$features/critical-css/critical-css-module/critical-css-module';
import ImageCdn from '$features/image-cdn/image-cdn';
import ImageGuide from '$features/image-guide/image-guide';
import LcpModule from '$features/lcp/lcp';
import MinifyCss from '$features/minify-css/minify-css';
import MinifyJs from '$features/minify-js/minify-js';
import PageCacheModule from '$features/page-cache/page-cache';
import RenderBlockingJs from '$features/render-blocking-js/render-blocking-js';
import styles from './index.module.scss';

const Index = () => (
	<div className="jb-container--narrow">
		<CornerstonePages />
		<CriticalCssModule />
		<CloudCssModule />
		<LcpModule />
		<PageCacheModule />
		<RenderBlockingJs />
		<MinifyJs />
		<MinifyCss />
		<ImageCdn />
		<div className={ styles.settings }>
			<ImageGuide />
		</div>
	</div>
);

export default Index;
