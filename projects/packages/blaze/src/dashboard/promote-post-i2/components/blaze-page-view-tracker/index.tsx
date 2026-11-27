import PageViewTracker from '../../../compat/components/page-view-tracker';
import { getDSPOrigin, useDspOriginProps } from '../../../lib/promote-post';

interface Props {
	path: string;
	title: string;
	delay?: number;
	properties?: Record< string, unknown >;
	options?: Record< string, unknown >;
}

/**
 * Page view tracker that adds the DSP origin, as the Calypso dashboard did.
 *
 * @param props - Tracker props.
 * @return Tracker.
 */
export default function BlazePageViewTracker( props: Props ) {
	const dspOriginProps = useDspOriginProps();
	return (
		<PageViewTracker
			{ ...props }
			properties={ { ...props.properties, origin: getDSPOrigin( dspOriginProps ) } }
		/>
	);
}
