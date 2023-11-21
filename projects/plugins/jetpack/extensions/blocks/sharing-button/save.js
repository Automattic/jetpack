import ViewSocialButton from './components/view-button';
import './style.scss';

const SharingButtonsView = ( { attributes } ) => {
	const { service, url } = attributes;
	return (
		<li className="jetpack-sharing-button__list-item">
			<ViewSocialButton service={ service } url={ url } />
		</li>
	);
};

export default SharingButtonsView;
