import { AvatarWithFallback } from '../avatar-with-fallback';
import { SidebarProps } from './types';

export const Sidebar: React.FC< SidebarProps > = ( { profileImage, showThreadConnector } ) => {
	return (
		<div className="twitter-preview__sidebar">
			<div className="twitter-preview__profile-image">
				<AvatarWithFallback src={ profileImage } />
			</div>
			{ showThreadConnector && <div className="twitter-preview__connector" /> }
		</div>
	);
};
