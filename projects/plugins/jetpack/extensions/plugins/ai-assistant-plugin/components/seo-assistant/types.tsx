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

export interface Step {
	id: string;
	title: string;
	label?: string;
	messages: Message[];
	type: StepType;
	onStart?: ( options?: { fromSkip: boolean; stepValue: string } ) => void;
	onSubmit?: () => Promise< string >;
	onSkip?: () => void;
	value?: string;
	setValue?:
		| React.Dispatch< React.SetStateAction< string > >
		| React.Dispatch< React.SetStateAction< Array< string > > >;
	setCompleted?: React.Dispatch< React.SetStateAction< boolean > >;
	completed?: boolean;
	autoAdvance?: number;

	// Input step properties
	placeholder?: string;

	// Options step properties
	options?: OptionMessage[];
	onSelect?: ( option: OptionMessage ) => void;
	submitCtaLabel?: string;
	onRetry?: () => void;
	retryCtaLabel?: string;
}
