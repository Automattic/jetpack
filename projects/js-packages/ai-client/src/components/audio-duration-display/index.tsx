/*
 * Internal dependencies
 */
import { formatTime } from './lib/media.ts';
/*
 * Types
 */
import type { ReactElement } from 'react';

type AudioDurationDisplayProps = {
	duration: number;
	className?: string | null;
};

/**
 * AudioDurationDisplay component.
 *
 * @param {AudioDurationDisplayProps} props - Component props.
 * @return {ReactElement}              Rendered component.
 */
export default function AudioDurationDisplay( {
	duration,
	className,
}: AudioDurationDisplayProps ): ReactElement {
	return <span className={ className }>{ formatTime( duration, { addDecimalPart: false } ) }</span>;
}
