import { __ } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';
import '../../disconnect-survey/_jp-connect_disconnect-survey-card.scss';
import DisconnectSurvey from '../../disconnect-survey';
import type { MouseEvent } from 'react';

interface StepSurveyProps {
	/** Callback function used to close the modal and leave the disconnect flow. */
	onExit?: ( e?: MouseEvent< HTMLElement > ) => void;
	/** Callback function to handle submission of survey response. */
	onFeedBackProvided?: ( answerId: string, answerText: string ) => void;
	/** If the survey feedback is currently being saved/submitted. */
	isSubmittingFeedback?: boolean;
}

/**
 * Show the survey step and allow the user to select a response.
 *
 * @param {StepSurveyProps} props - The properties.
 * @return {import('react').ReactNode} The StepSurvey Component
 */
const StepSurvey = ( { onExit, onFeedBackProvided, isSubmittingFeedback }: StepSurveyProps ) => {
	return (
		<div className="jp-connection__disconnect-dialog__content">
			<h1>{ __( 'Before you go, help us improve Jetpack', 'jetpack-connection-js' ) }</h1>
			<Text className="jp-connection__disconnect-dialog__large-text">
				{ __( "Let us know what didn't work for you", 'jetpack-connection-js' ) }
			</Text>
			<DisconnectSurvey
				onSubmit={ onFeedBackProvided }
				isSubmittingFeedback={ isSubmittingFeedback }
			/>
			<Link
				className="jp-connection__disconnect-dialog__link jp-connection__disconnect-dialog__link--bold"
				href="#"
				onClick={ onExit }
			>
				{ __( 'Skip for now', 'jetpack-connection-js' ) }
			</Link>
		</div>
	);
};

export default StepSurvey;
