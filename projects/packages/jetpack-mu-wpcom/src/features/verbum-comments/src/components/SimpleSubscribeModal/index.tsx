import clsx from 'clsx';
import { useEffect, useState, useRef, useContext } from 'preact/hooks';
import { translate } from '../../i18n';
import { VerbumSignals } from '../../state';
import { SimpleSubscribeModalProps } from '../../types';
import {
	getSubscriptionModalViewCount,
	setSubscriptionModalViewCount,
	shouldShowSubscriptionModal,
} from '../../utils';
import { SimpleSubscribeModalLoggedIn, SimpleSubscribeSetModalShowLoggedIn } from './logged-in';
import { SimpleSubscribeModalLoggedOut } from './logged-out';
import './style.scss';

export const SimpleSubscribeModal = ( { closeModalHandler, email }: SimpleSubscribeModalProps ) => {
	const { userInfo, userLoggedIn, commentUrl, subscribeModalStatus } = useContext( VerbumSignals );
	const [ subscribeState, setSubscribeState ] = useState<
		'SUBSCRIBING' | 'LOADING' | 'SUBSCRIBED'
	>();

	const [ hasIframe, setHasIframe ] = useState( false );

	const SimpleSubscribeModalComponent = ! userLoggedIn.value
		? SimpleSubscribeModalLoggedOut
		: SimpleSubscribeModalLoggedIn;

	const modalContainerRef = useRef( null );

	const closeModalStateHandler = () => {
		setSubscribeState( 'LOADING' );
		closeModalHandler();
	};

	const handleClose = ( event: MouseEvent ) => {
		event.preventDefault();
		closeModalStateHandler();
	};

	const handleOutsideClick = ( event: MouseEvent ) => {
		// Check if the clicked element is the modal container itself
		if ( modalContainerRef.current && modalContainerRef.current === event.target ) {
			handleClose( event );
		}
	};

	useEffect( () => {
		document.addEventListener( 'click', handleOutsideClick );

		return () => {
			document.removeEventListener( 'click', handleOutsideClick );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// This is used to track how many times the modal was shown to the user.
	useEffect( () => {
		const userId = userInfo.value?.uid || 0;
		const currentViewCount = getSubscriptionModalViewCount( userId );
		setSubscriptionModalViewCount( currentViewCount + 1, userId );
	}, [ userInfo ] );

	if ( ! commentUrl.value ) {
		// When not showing the modal, we check for modal conditions to show it.
		// This is done to avoid subscriptionApi calls for logged out users.
		if ( userLoggedIn.value ) {
			return <SimpleSubscribeSetModalShowLoggedIn />;
		}

		// If the user is logged out, we don't need to check is already subscribed.
		subscribeModalStatus.value = shouldShowSubscriptionModal( false, 0 );
		return null;
	}

	// We use the same logic as in the comment footer to know if the user is already subscribed.
	if ( subscribeModalStatus.value !== 'showed' && commentUrl.value ) {
		closeModalHandler();
		return null;
	}

	if ( subscribeState === 'LOADING' ) {
		return (
			<div className="verbum-simple-subscribe-modal loading-your-comments">
				<div className="verbum-simple-subscribe-modal__content">
					<h2>{ translate( 'Loading your comment...' ) }</h2>
				</div>
			</div>
		);
	}

	return (
		<div ref={ modalContainerRef } className="verbum-simple-subscribe-modal">
			<div
				className={ clsx( 'verbum-simple-subscribe-modal__content', {
					'has-iframe': hasIframe,
				} ) }
			>
				<SimpleSubscribeModalComponent
					subscribeState={ subscribeState }
					setSubscribeState={ setSubscribeState }
					closeModalHandler={ closeModalStateHandler }
					email={ email }
					setHasIframe={ setHasIframe }
				/>
			</div>
		</div>
	);
};
