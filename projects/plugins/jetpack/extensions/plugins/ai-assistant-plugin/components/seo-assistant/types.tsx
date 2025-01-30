type StepType = 'welcome' | 'input' | 'options' | 'completion';

export interface Message {
	id?: string;
	content: string | React.ReactNode;
	isUser?: boolean;
	showIcon?: boolean;
	type?: string;
	selected?: boolean;
}

export type OptionMessage = Pick< Message, 'id' | 'content' >;

interface BaseStep {
	id: string;
	title: string;
	label?: string;
	messages: Message[];
	type: StepType;
	onStart?: OnStartFunction;
	onSubmit?: () => Promise< string >;
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
	options: OptionMessage[];
	onSelect: ( option: OptionMessage ) => void;
	submitCtaLabel?: string;
	onRetry?: () => void;
	retryCtaLabel?: string;
}

interface CompletionStep extends BaseStep {
	type: 'completion';
}

export type Step = InputStep | OptionsStep | CompletionStep;

export type OnStartFunction = ( options?: { fromSkip: boolean; stepValue: string } ) => void;
