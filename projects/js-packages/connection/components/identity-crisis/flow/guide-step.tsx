import { isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Button, Icon, Stack, Text } from '@wordpress/ui';
import { useCallback, useId } from 'react';
import ExternalLink from '../external-link';
import styles from '../styles.module.scss';
import {
	getBackText,
	getGuideAnswerCopy,
	getGuideIntro,
	getGuideStepCopy,
	getGuideText,
} from './copy';
import FactList from './fact-list';
import { getGuideAnswers } from './steps';
import type { CopyContext, FactLine, GuideAnswerCopy } from './copy';
import type { GuideAnswerId, GuideStepId } from './steps';
import type { ReactNode, Ref } from 'react';

interface AnswerButtonProps {
	id: GuideAnswerId;
	answerCopy: GuideAnswerCopy;
	onAnswer: ( answer: GuideAnswerId ) => void;
}

/**
 * An answer that moves on when chosen; its label names it and its hint describes it.
 *
 * @param {AnswerButtonProps} props - Component props.
 * @return {ReactNode} The button.
 */
function AnswerButton( { id, answerCopy, onAnswer }: AnswerButtonProps ): ReactNode {
	const labelId = useId();
	const hintId = useId();
	const onClick = useCallback( () => onAnswer( id ), [ id, onAnswer ] );

	return (
		<Button
			variant="unstyled"
			className={ styles.answer }
			onClick={ onClick }
			aria-labelledby={ labelId }
			aria-describedby={ answerCopy.hint ? hintId : undefined }
		>
			<Stack direction="column" gap="xs">
				<Text variant="heading-md" id={ labelId }>
					{ answerCopy.label }
				</Text>
				{ answerCopy.hint && (
					<Text variant="body-sm" id={ hintId } className={ styles.hint }>
						{ answerCopy.hint }
					</Text>
				) }
			</Stack>
			<Icon icon={ isRTL() ? chevronLeft : chevronRight } size={ 20 } />
		</Button>
	);
}

interface GuideStepProps {
	step: GuideStepId;
	copy: CopyContext;
	/** "What we already know", shown on the first question only. */
	facts: FactLine[];
	/** Where "Open {Z}" goes; no link without it. */
	openUrl: string | null;
	/** The answers so far, shown below Back. */
	trail: ReactNode;
	onAnswer: ( answer: GuideAnswerId ) => void;
	/** Back leads to the first screen, and says so. */
	isBackToStart: boolean;
	onBack: () => void;
	/** Receives the question, which takes focus when the step changes. */
	headingRef: Ref< HTMLHeadingElement >;
}

/**
 * A guide question: one thing to check, and answers that move on straight away.
 *
 * @param {GuideStepProps} props - Component props.
 * @return {ReactNode} The step.
 */
export default function GuideStep( {
	step,
	copy,
	facts,
	openUrl,
	trail,
	onAnswer,
	isBackToStart,
	onBack,
	headingRef,
}: GuideStepProps ): ReactNode {
	const text = getGuideText( copy );
	const question = getGuideStepCopy( step, copy );
	const isFirst = step === 'open_address';

	return (
		<Stack direction="column" gap="sm">
			<div>
				<Button variant="minimal" size="compact" onClick={ onBack }>
					<Button.Icon icon={ isRTL() ? chevronRight : chevronLeft } />
					{ isBackToStart ? text.backToStart : getBackText() }
				</Button>
			</div>
			{ trail }
			{ isFirst && (
				<>
					<Text variant="body-md" render={ <p /> } className={ styles.prose }>
						{ getGuideIntro( copy ) }
					</Text>
					<FactList facts={ facts } />
				</>
			) }
			<Text
				variant="heading-lg"
				render={ <h3 ref={ headingRef } tabIndex={ -1 } /> }
				className={ styles.question }
			>
				{ question.title }
			</Text>
			{ question.help && (
				<Text variant="body-md" render={ <p /> } className={ styles.prose }>
					{ question.help }
				</Text>
			) }
			{ isFirst && openUrl && (
				<div>
					<ExternalLink href={ openUrl }>{ text.openAddress }</ExternalLink>
				</div>
			) }
			<Stack render={ <ul /> } direction="column" gap="sm" className={ styles[ 'plain-list' ] }>
				{ getGuideAnswers( step ).map( answer => (
					<li key={ answer.id }>
						<AnswerButton
							id={ answer.id }
							answerCopy={ getGuideAnswerCopy( answer.id, copy ) }
							onAnswer={ onAnswer }
						/>
					</li>
				) ) }
			</Stack>
		</Stack>
	);
}
