type StepType = 'input' | 'options' | 'completion';

export interface Message {
	id?: string;
	content?: string | React.ReactNode;
	isUser?: boolean;
	showIcon?: boolean;
	type?: string;
	options?: Option[];
}

export interface Option {
	id: string;
	content: string;
	selected?: boolean;
}

interface BaseStep {
	id: string;
	title: string;
	label?: string;
	messages: StepMessage[];
	type: StepType;
	onStart?: () => void;
	onSubmit?: () => void;
	onSkip?: () => void;
	value: string;
	setValue:
		| React.Dispatch< React.SetStateAction< string > >
		| React.Dispatch< React.SetStateAction< Array< string > > >;
	setCompleted?: React.Dispatch< React.SetStateAction< boolean > >;
	completed?: boolean;
}

interface InputStep extends BaseStep {
	type: 'input';
	placeholder: string;
}

interface OptionsStep extends BaseStep {
	type: 'options';
	options: Option[];
	onSelect: ( option: Option ) => void;
	submitCtaLabel?: string;
	onRetry?: () => void;
	onRetryCtaLabel?: string;
}

interface CompletionStep extends BaseStep {
	type: 'completion';
}

interface StepMessage {
	content: string | React.ReactNode;
	showIcon?: boolean;
}

export type Step = InputStep | OptionsStep | CompletionStep;

export type CompletionStepHookProps = {
	steps: Step[];
	addMessage?: ( message: Message | string ) => void;
};

export interface SeoAssistantProps {
	isBusy?: boolean;
	disabled?: boolean;
	onStep?: ( data: { value: string | Option | null } ) => void;
	isOpen?: boolean;
	close?: () => void;
}
