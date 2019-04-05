/**
 * Internal dependencies
 */
import JetpackLikesAndSharingPanel from '../../shared/jetpack-likes-and-sharing-panel';
import LikesCheckbox from './likes-checkbox';

export const name = 'likes';

export const settings = {
	render: ( { props } ) => (
		<JetpackLikesAndSharingPanel>
			<LikesCheckbox props={ props } />
		</JetpackLikesAndSharingPanel>
	),
};
