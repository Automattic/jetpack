import { useEffect } from '@wordpress/element';
import { useNavigate } from 'react-router-dom';
import { config } from '../';
import InboxView from './dataviews';
import './style.scss';

const Inbox = () => {
	const navigate = useNavigate();

	// If a user has no responses yet, redirect them to the landing page.
	useEffect( () => {
		if ( config( 'hasFeedback' ) ) {
			return;
		}
		navigate( '/landing' );
	}, [ navigate ] );

	return <InboxView />;
};

export default Inbox;
