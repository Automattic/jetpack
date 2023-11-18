import ViewSocialButton from './components/view-button';
import './style.scss';

const SharingButtonsView = ( { attributes, post, context } ) => {
	const { service } = attributes;
	const { styleType } = context;
	return (
		<li className="jetpack-sharing-button__list">
			<ViewSocialButton service={ service } post={ post } styleType={ styleType } />
		</li>
	);
};

export default SharingButtonsView;
