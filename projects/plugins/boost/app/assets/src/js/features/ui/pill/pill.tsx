import { Badge } from '@wordpress/ui';

type PillVariant = 'default' | 'red' | 'gray';

const intentMap: Record< PillVariant, 'informational' | 'high' | 'none' > = {
	default: 'informational',
	red: 'high',
	gray: 'none',
};

const Pill = ( { text, variant = 'default' }: { text: string; variant?: PillVariant } ) => {
	return <Badge intent={ intentMap[ variant ] }>{ text }</Badge>;
};

export default Pill;
