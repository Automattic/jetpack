/*
 * Internal dependencies
 */
import { formatTime } from './lib/media.js';
/*
 * Types
 */
import type React from 'react';

type AudioDurationDisplayProps = {
	duration: number;
	className?: string | null;
};

/**
 * AudioDurationDisplay component.
 *
 * @param {AudioDurationDisplayProps} props - Component props.
 * @returns {React.ReactElement}              Rendered component.
 */
export default function AudioDurationDisplay( {
	duration,
	className,
}: AudioDurationDisplayProps ): React.ReactElement {
	return <span className={ className }>{ formatTime( duration, { addDecimalPart: false } ) }</span>;
}
