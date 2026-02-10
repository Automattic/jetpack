import { TabPanel } from '@wordpress/components';

type Tab = React.ComponentProps< typeof TabPanel >[ 'tabs' ][ number ];

export type ConnectionTab = Tab & {
	connectionId: string;
};
