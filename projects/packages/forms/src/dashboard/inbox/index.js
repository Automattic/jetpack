import { useNavigate } from '@tanstack/react-router';
import { useEffect } from '@wordpress/element';
import useConfigValue from '../../hooks/use-config-value';
import InboxView from './dataviews';
import './style.scss';

const Inbox = () => {
	const navigate = useNavigate();

	const hasFeedback = useConfigValue( 'hasFeedback' );

	// If a user has no responses yet, redirect them to the landing page.
	useEffect( () => {
		if ( hasFeedback !== false ) {
			return;
		}
		navigate( '/about' );
	}, [ navigate, hasFeedback ] );

	if ( hasFeedback === undefined ) {
		return null; // or a loading spinner, if you prefer
	}

	return <InboxView />;
};

export default Inbox;
