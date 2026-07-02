import AdminPage from '@automattic/jetpack-components/admin-page';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { Link, useParams } from '@wordpress/route';
import { Stack, Text } from '@wordpress/ui';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import { isStudioEnabled } from '../../src/dashboard/utils/studio';
import './style.scss';

// Deep-link fallback for when the feature flag is off. The flag also strips
// this route from the server-side registry, so this only renders in edge
// cases (e.g. a stale client); mirrors routes/video/stage.tsx's NotFound.
const NotFound = () => (
	<AdminPage
		breadcrumbs={
			<Breadcrumbs
				items={ [
					{ label: 'VideoPress', to: '/library' },
					{ label: __( 'Not found', 'jetpack-videopress-pkg' ) },
				] }
			/>
		}
	>
		<div className="vp-playlist vp-playlist__not-found">
			<Stack direction="column" gap="md" align="center">
				<Text>{ __( "We couldn't find that page.", 'jetpack-videopress-pkg' ) }</Text>
				<Link to="/library">{ __( 'Back to Library', 'jetpack-videopress-pkg' ) }</Link>
			</Stack>
		</div>
	</AdminPage>
);

const StageInner = () => {
	const { id } = useParams( { from: '/playlists/$id' } );

	if ( ! isStudioEnabled() ) {
		return <NotFound />;
	}

	return (
		<AdminPage
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Playlists', 'jetpack-videopress-pkg' ), to: '/playlists' },
						{ label: id },
					] }
				/>
			}
		>
			<div className="vp-playlist">
				<Stack direction="column" gap="md" align="center">
					<Text>{ __( 'Playlists are coming soon.', 'jetpack-videopress-pkg' ) }</Text>
					<Link to="/playlists">{ __( 'Back to Playlists', 'jetpack-videopress-pkg' ) }</Link>
				</Stack>
			</div>
		</AdminPage>
	);
};

const Stage = () => (
	<QueryClientWrapper>
		<StageInner />
	</QueryClientWrapper>
);

export { Stage as stage };
