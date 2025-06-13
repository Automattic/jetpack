export interface IDatePickerOptions {
	lang: ILanguage;
	mode: 'dp-below';
	highlightedDate: Date | undefined | null;
	format: ( dt: Date, dateFormat: string ) => string;
	dateFormat: string;
	parse: ( candidate: Date | string, dateFormat: string ) => Date;
	dateClass: ( dt: Date ) => string;
	inRange: ( dt: Date, dp?: IDatePicker ) => boolean;
	appendTo: HTMLElement;
	alignment: 'left' | 'right';
	min?: Date;
	max?: Date;
	shouldFocusOnBlur?: boolean;
	shouldFocusOnRender?: boolean;
	dayOffset?: number;
	hasFooter?: boolean;
}

export interface IDateRangePickerOptions extends IDatePickerOptions {
	startOpts: IDatePickerOptions;
	endOpts: IDatePickerOptions;
}

export interface IDatePicker {
	el: HTMLElement | undefined;
	opts: IDatePickerOptions;
	shouldFocusOnBlur: boolean;
	shouldFocusOnRender: boolean;
	state: IState;
	adjustPosition: () => void;
	containerHTML: string;
	attachToDom: () => void;
	updateInput: ( selectedDate: Date ) => void;
	computeSelectedDate: () => Date;
	currentView: () => IPicker;
	open: () => void;
	isVisible: () => boolean;
	hasFocus: () => boolean;
	shouldHide: () => boolean;
	close: ( becauseOfBlur?: boolean ) => void;
	destroy: () => void;
	render: () => void;
	setState: ( state: unknown ) => void;
}

export interface IState {
	selectedDate: Date;
	view: 'day' | 'month' | 'year';
	highlightedDate?: Date;
}

export interface IDateRangePickerState {
	start: Date | undefined;
	end: Date | undefined;
}

export type IAlignment = 'left' | 'right';

export interface ILanguage {
	days: string[];
	months: string[];
	today: string;
	clear: string;
	close: string;
	ariaLabel: {
		enterPicker: string;
		dayPicker: string;
		monthPicker: string;
		yearPicker: string;
		monthPickerButton: string;
		yearPickerButton: string;
		dayButton: string;
		todayButton: string;
		clearButton: string;
		closeButton: string;
	};
}

export interface IPicker {
	onKeyDown: ( evt: KeyboardEvent, dp: IDatePicker ) => void;
	onClick: {
		[ key: string ]: ( e: Event | KeyboardEvent, dp: IDatePicker ) => void;
	};
	render: ( dp: IDatePicker ) => string;
}
