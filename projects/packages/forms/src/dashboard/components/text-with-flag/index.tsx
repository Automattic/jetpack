import {
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { Icon, globe } from '@wordpress/icons';
import Flag from '../flag/index.tsx';
import type { ReactNode } from 'react';
import './style.scss';

type TextWithFlagProps = {
	countryCode?: string;
	children: ReactNode;
	fallbackIcon?: boolean;
};

/**
 * Renders text content with an optional country flag.
 *
 * @param {TextWithFlagProps} props              - The component props.
 * @param {string|undefined}  props.countryCode  - Two-letter ISO 3166-1 alpha-2 country code (e.g., "US") or undefined if unknown.
 * @param {boolean}           props.fallbackIcon - Whether to display a fallback icon if the country code is not provided.
 * @param {React.ReactNode}   props.children     - The text content to display after the flag. Can be a string or React elements (e.g., Tooltip, ExternalLink).
 * @return {JSX.Element} The TextWithFlag component
 */
export default function TextWithFlag( {
	children,
	countryCode,
	fallbackIcon = false,
}: TextWithFlagProps ): JSX.Element {
	return (
		<Text className="jp-forms__text-with-flag">
			{ countryCode && <Flag countryCode={ countryCode } /> }
			{ ! countryCode && fallbackIcon && <Icon icon={ globe } size={ 20 } /> }
			{ children }
		</Text>
	);
}
