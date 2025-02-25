interface TimeSinceProps {
	date: string;
	className?: string;
}

/**
 *
 * @param root0
 * @param root0.className
 * @param root0.date
 */
function TimeSince( { className, date }: TimeSinceProps ) {
	return (
		<time className={ className } dateTime={ date } title={ date }>
			{ date }
		</time>
	);
}

export default TimeSince;
