/**
 * Internal dependencies
 */
import JetpackLikesAndSharingPanel from '../../utils/likes-and-sharing-panel';
import LikesCheckbox from './likes-checkbox';

export const name = 'likes';

export const settings = {
	render: () => {
		return (
			<JetpackLikesAndSharingPanel>
				<LikesCheckbox />
			</JetpackLikesAndSharingPanel>
		);
	},
};
