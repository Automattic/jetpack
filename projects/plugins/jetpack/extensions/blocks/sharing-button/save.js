import ViewSocialButton from './components/view-button';
import './style.scss';

const SharingButtonsView = ( { attributes, post } ) => {
	const { service } = attributes;
	return (
		<li className="jetpack-sharing-button__list">
			<ViewSocialButton service={ service } post={ post } />
		</li>
	);
};

export default SharingButtonsView;
