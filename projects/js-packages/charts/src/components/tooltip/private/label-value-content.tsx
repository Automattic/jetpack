import { formatNumber } from '@automattic/number-formatters';
import type { TooltipData } from '../types';

export const LabelValueContent = ( { data }: { data: TooltipData } ) => (
	<>
		{ data.label }: { data.valueDisplay || formatNumber( data.value ) }
	</>
);
