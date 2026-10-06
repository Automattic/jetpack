type TooltipProps = {
	data: {
		label: string;
		value: number;
	};
};

type TooltipData = {
	label: string;
	value: number;
	valueDisplay?: string;
};

export type { TooltipProps, TooltipData };
