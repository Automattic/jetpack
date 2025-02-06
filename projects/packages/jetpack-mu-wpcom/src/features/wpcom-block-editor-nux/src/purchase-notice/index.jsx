import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useEffect, useRef } from 'react';
import './style.scss';

/**
 * Display the purchase notice snackbar
 * @return {null} This component is non-rendering.
 */
function PurchaseNotice() {
	const hasPaymentNotice = useRef( false );
	const { createNotice } = useDispatch( noticesStore );

	useEffect( () => {
		const noticePattern = /[&?]notice=([\w_-]+)/;
		const match = noticePattern.exec( document.location.search );
		const notice = match && match[ 1 ];
		if ( 'purchase-success' === notice && hasPaymentNotice.current === false ) {
			hasPaymentNotice.current = true;
			createNotice(
				'info',
				__( 'Congrats! Premium blocks are now available to use.', 'jetpack-mu-wpcom' ),
				{
					isDismissible: true,
					type: 'snackbar',
				}
			);
		}
	}, [ createNotice ] );

	return null;
}

export default PurchaseNotice;
