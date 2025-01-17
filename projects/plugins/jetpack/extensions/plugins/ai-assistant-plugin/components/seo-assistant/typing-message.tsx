import { SVG, Circle } from '@wordpress/components';

export default function TypingMessage() {
	return (
		<SVG viewBox="0 0 40 40" height="20" width="20" className="typing-loader">
			<Circle className="typing-dot" cx="10" cy="30" r="3" style={ { fill: 'grey' } } />
			<Circle className="typing-dot" cx="20" cy="30" r="3" style={ { fill: 'grey' } } />
			<Circle className="typing-dot" cx="30" cy="30" r="3" style={ { fill: 'grey' } } />
		</SVG>
	);
}
