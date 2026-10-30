import { emailTime, fullTime, parseUtc } from '../data/dates';

/**
 * When an email went, relative for the last day, with the full date and time on hover.
 *
 * @param props           - Component props.
 * @param props.createdAt - UTC `Y-m-d H:i:s` from the log table (an ISO string works too).
 * @return The time.
 */
export const EmailTime = ( { createdAt }: { createdAt: string } ) => {
	const when = parseUtc( createdAt );
	const valid = ! isNaN( when.getTime() );
	return (
		<time dateTime={ valid ? when.toISOString() : undefined } title={ fullTime( when ) }>
			{ emailTime( when, Date.now() ) }
		</time>
	);
};

export default EmailTime;
