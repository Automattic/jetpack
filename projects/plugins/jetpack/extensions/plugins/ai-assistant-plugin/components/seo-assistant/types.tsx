type StepType = 'welcome' | 'input' | 'options' | 'completion';

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
	messages: Message[];
	type: StepType;
	onStart?: () => void;
	onSubmit?: () => void;
	onSkip?: () => void;
	value?: string;
	setValue?:
		| React.Dispatch< React.SetStateAction< string > >
		| React.Dispatch< React.SetStateAction< Array< string > > >;
	setCompleted?: React.Dispatch< React.SetStateAction< boolean > >;
	completed?: boolean;
}

export interface InputStep extends BaseStep {
	type: 'input';
	placeholder: string;
}

interface OptionsStep extends BaseStep {
	type: 'options';
	options: Option[];
	onSelect: ( option: Option ) => void;
	submitCtaLabel?: string;
	onRetry?: () => void;
	retryCtaLabel?: string;
}

interface CompletionStep extends BaseStep {
	type: 'completion';
}

export type Step = InputStep | OptionsStep | CompletionStep;
