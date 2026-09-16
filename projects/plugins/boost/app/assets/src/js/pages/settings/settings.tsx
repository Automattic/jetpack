import { __ } from '@wordpress/i18n';
import { Card, Stack } from '@wordpress/ui';
import CornerstonePagesCard from '$features/cornerstone-pages/cornerstone-pages-card';
import CloudCssModule from '$features/critical-css/cloud-css-module/cloud-css-module';
import CriticalCssModule from '$features/critical-css/critical-css-module/critical-css-module';
import ImageCdn from '$features/image-cdn/image-cdn';
import ImageGuide from '$features/image-guide/image-guide';
import LcpModule from '$features/lcp/lcp';
import MinifyCss from '$features/minify-css/minify-css';
import MinifyJs from '$features/minify-js/minify-js';
import { ModuleSurfaceProvider } from '$features/module/surface';
import PageCacheModule from '$features/page-cache/page-cache';
import RenderBlockingJs from '$features/render-blocking-js/render-blocking-js';
import styles from './settings.module.scss';
import type { ReactNode } from 'react';

const Group = ( { title, children }: { title: string; children: ReactNode } ) => (
	<Card.Root>
		<Card.Header>
			<Card.Title render={ <h2 /> }>{ title }</Card.Title>
		</Card.Header>
		<Card.Content>
			<Stack direction="column" gap="xl">
				{ children }
			</Stack>
		</Card.Content>
	</Card.Root>
);

const Settings = () => (
	<ModuleSurfaceProvider value="row">
		<Stack direction="column" gap="xl" className={ styles.settings }>
			<Group title={ __( 'Code loading optimization', 'jetpack-boost' ) }>
				<CriticalCssModule />
				<CloudCssModule />
				<PageCacheModule />
				<RenderBlockingJs />
				<MinifyJs />
				<MinifyCss />
			</Group>
			<Group title={ __( 'Image loading optimization', 'jetpack-boost' ) }>
				<LcpModule />
			</Group>
			<Group title={ __( 'Image CDN configuration', 'jetpack-boost' ) }>
				<ImageCdn />
			</Group>
			<Group title={ __( 'Image guide', 'jetpack-boost' ) }>
				<ImageGuide />
			</Group>
			<CornerstonePagesCard />
		</Stack>
	</ModuleSurfaceProvider>
);

export default Settings;
