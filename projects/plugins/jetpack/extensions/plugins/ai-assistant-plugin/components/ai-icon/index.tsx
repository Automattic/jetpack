/**
 * External dependencies
 */
import { G, Path, SVG, Rect } from '@wordpress/components';
import { Icon } from '@wordpress/icons';
import { Defs } from '@wordpress/primitives';

export const AiSVG = (
	<SVG width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
		<G clipPath="url(#clip0_4479_1006)">
			<Path
				d="M7.87488 0L10.1022 5.64753L15.7498 7.87488L10.1022 10.1022L7.87488 15.7498L5.64753 10.1022L0 7.87488L5.64753 5.64753L7.87488 0Z"
				fill="#A7AAAD"
			/>
			<Path
				d="M31.4998 0L34.4696 7.53004L41.9997 10.4998L34.4696 13.4696L31.4998 20.9997L28.53 13.4696L21 10.4998L28.53 7.53004L31.4998 0Z"
				fill="#A7AAAD"
			/>
			<Path
				d="M18.3748 15.7496L22.0871 25.1621L31.4996 28.8744L22.0871 32.5866L18.3748 41.9992L14.6625 32.5866L5.25 28.8744L14.6625 25.1621L18.3748 15.7496Z"
				fill="#A7AAAD"
			/>
		</G>
		<Defs>
			<clipPath id="clip0_4479_1006">
				<Rect width="41.9997" height="41.9992" fill="white" />
			</clipPath>
		</Defs>
	</SVG>
);

export default function AiIcon( { className, size = 42 }: { className?: string; size?: number } ) {
	return <Icon icon={ AiSVG } width={ size } height={ size } className={ className } />;
}
