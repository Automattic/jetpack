import { __ } from '@wordpress/i18n';
import { AvatarWithFallback } from '../avatar-with-fallback';
import { SidebarProps } from './types';

export const Sidebar: React.FC< SidebarProps > = ( { profileImage, showThreadConnector } ) => {
	return (
		<div className="threads-preview__sidebar">
			<div className="threads-preview__profile-image">
				<AvatarWithFallback
					alt={ __( 'Threads profile image', 'social-previews' ) }
					src={ profileImage }
				/>
			</div>
			{ showThreadConnector && <div className="threads-preview__connector" /> }
		</div>
	);
};
