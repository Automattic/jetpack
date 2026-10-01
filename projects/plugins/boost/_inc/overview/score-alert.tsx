import { VisuallyHidden } from '@wordpress/ui';
import { useEffect, useRef, useState } from 'react';
import {
	fasterMessage,
	slowerMessage,
	VanillaPopOut,
} from '../../app/assets/src/js/features/speed-score/pop-out/pop-out';
import { recordBoostEvent } from '../../app/assets/src/js/lib/utils/analytics';
import { useDismissibleAlertState } from './lib/use-performance-history';

type Props = {
	scoreChange: number | false;
	isVisible: boolean;
	onBeforeHide?: () => void;
};

export default function ScoreAlert( { scoreChange, isVisible, onBeforeHide }: Props ) {
	const hasScoreChanged = scoreChange !== false;
	const message = hasScoreChanged && scoreChange < 0 ? slowerMessage : fasterMessage;
	const [ isDismissed, dismissAlert ] = useDismissibleAlertState( message.id );
	const [ isClosed, setClosed ] = useState( false );
	const [ announcement, setAnnouncement ] = useState( '' );
	const impressionRecorded = useRef( false );
	const showAlert =
		isVisible && hasScoreChanged && Math.abs( scoreChange ) > 5 && ! isDismissed && ! isClosed;
	const scoreDirection = hasScoreChanged && scoreChange > 0 ? 'up' : 'down';

	useEffect( () => {
		setAnnouncement( showAlert ? message.title : '' );
	}, [ showAlert, message.title ] );

	useEffect( () => {
		impressionRecorded.current = false;
	}, [ scoreChange ] );

	useEffect( () => {
		if ( showAlert && ! impressionRecorded.current ) {
			impressionRecorded.current = true;
			recordBoostEvent( 'speed_score_alert_shown', { score_direction: scoreDirection } );
		}
	}, [ showAlert, scoreDirection, scoreChange ] );

	const handleDismiss = () => {
		onBeforeHide?.();
		recordBoostEvent( 'speed_score_alert_cta_clicked', { score_direction: scoreDirection } );
		dismissAlert();
	};

	return (
		<>
			<VisuallyHidden render={ <div role="status" aria-live="polite" aria-atomic="true" /> }>
				{ showAlert ? announcement : '' }
			</VisuallyHidden>
			<VanillaPopOut
				presentation="modern"
				message={ message }
				onClose={ () => {
					onBeforeHide?.();
					setClosed( true );
				} }
				onDismiss={ handleDismiss }
				isVisible={ showAlert }
			/>
		</>
	);
}
