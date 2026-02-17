import { __, _x } from '@wordpress/i18n';
import { AvatarWithFallback } from '../../../avatar-with-fallback';
import FacebookPostIcon from '../icons';
import type { FacebookUser } from '../../types';
import './styles.scss';

type Props = {
	user?: FacebookUser;
	timeElapsed?: boolean;
	hideOptions?: boolean;
};

const FacebookPostHeader: React.FC< Props > = ( { user, timeElapsed, hideOptions } ) => {
	return (
		<div className="facebook-preview__post-header">
			<div className="facebook-preview__post-header-content">
				<AvatarWithFallback
					className="facebook-preview__post-header-avatar"
					src={ user?.avatarUrl }
				/>
				<div>
					<div className="facebook-preview__post-header-name">
						{ user?.displayName ||
							// translators: name of a fictional Facebook User
							__( 'Anonymous User', 'social-previews' ) }
					</div>
					<div className="facebook-preview__post-header-share">
						<span className="facebook-preview__post-header-time">
							{ timeElapsed
								? __(
										// translators: short version of `1 hour`
										'1h',
										'social-previews'
								  )
								: _x(
										// translators: temporal indication of when a post was published
										'Just now',
										'',
										'social-previews'
								  ) }
						</span>
						<span className="facebook-preview__post-header-dot" aria-hidden="true">
							·
						</span>
						<FacebookPostIcon name="public" />
					</div>
				</div>
			</div>
			{ ! hideOptions && <div className="facebook-preview__post-header-more"></div> }
		</div>
	);
};

export default FacebookPostHeader;
