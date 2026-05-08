import AdminPage from '@automattic/jetpack-components/admin-page';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useNavigate, useParams } from '@wordpress/route';
import { Text } from '@wordpress/ui';
import './style.scss';

const Stage = () => {
	const { id } = useParams( { from: '/video/$id' } );
	const navigate = useNavigate();

	return (
		<AdminPage
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: 'VideoPress', to: '/library' },
						{ label: __( 'Video details', 'jetpack-videopress-pkg' ) },
					] }
				/>
			}
		>
			<div className="vp-video-details">
				<Text>{ `Phase 4 placeholder for video id: ${ id }` }</Text>
				<button type="button" onClick={ () => navigate( { href: '/library' } ) }>
					{ __( 'Back to Library', 'jetpack-videopress-pkg' ) }
				</button>
			</div>
		</AdminPage>
	);
};

export { Stage as stage };
