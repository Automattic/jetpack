/**
 * Internal dependencies
 */
import JetpackLikesAndSharingPanel from '../../shared/jetpack-likes-and-sharing-panel';
import SharingCheckbox from './sharing-checkbox';

export const name = 'sharing';

export const settings = {
	render: ( { props } ) => (
		<JetpackLikesAndSharingPanel>
			<SharingCheckbox props={ props } />
		</JetpackLikesAndSharingPanel>
	),
};
