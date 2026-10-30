import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';
import { IconButton } from '@wordpress/ui';

const PREFERENCE_SCOPE = 'jetpack/send';
const PREFERENCE_NAME = 'introBannerDismissed';

type PreferencesSelectors = { get: ( scope: string, name: string ) => unknown };
type PreferencesActions = { set: ( scope: string, name: string, value: unknown ) => void };

// An envelope arriving along a dotted flight path, ticked as delivered.
const BannerArt = () => (
	<svg
		className="jetpack-send-banner__art"
		viewBox="0 0 280 180"
		aria-hidden="true"
		focusable="false"
	>
		<defs>
			<radialGradient id="jetpack-send-banner-glow-blue">
				<stop offset="0" stopColor="#3858e9" stopOpacity="0.9" />
				<stop offset="1" stopColor="#3858e9" stopOpacity="0" />
			</radialGradient>
			<radialGradient id="jetpack-send-banner-glow-green">
				<stop offset="0" stopColor="#48ff50" stopOpacity="0.5" />
				<stop offset="1" stopColor="#48ff50" stopOpacity="0" />
			</radialGradient>
			<linearGradient id="jetpack-send-banner-envelope" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#ffffff" />
				<stop offset="1" stopColor="#d6e2ff" />
			</linearGradient>
		</defs>
		<circle cx="190" cy="84" r="112" fill="url(#jetpack-send-banner-glow-blue)" />
		<circle cx="236" cy="40" r="64" fill="url(#jetpack-send-banner-glow-green)" />
		<path
			d="M10 172 C 60 170, 90 120, 118 106 S 140 96, 148 94"
			fill="none"
			stroke="#9fb8ff"
			strokeOpacity="0.7"
			strokeWidth="2"
			strokeLinecap="round"
			strokeDasharray="2 8"
		/>
		<g transform="rotate(-8 196 84)">
			<rect
				x="156"
				y="56"
				width="84"
				height="58"
				rx="8"
				fill="url(#jetpack-send-banner-envelope)"
			/>
			<path
				d="M161 62 L198 89 L235 62"
				fill="none"
				stroke="#0b1d3a"
				strokeOpacity="0.2"
				strokeWidth="2"
				strokeLinejoin="round"
			/>
		</g>
		<circle cx="236" cy="50" r="14" fill="#48ff50" />
		<path
			d="M229 50 l5 5 l9 -10"
			fill="none"
			stroke="#06331a"
			strokeWidth="2.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

/**
 * Dismissible introduction to Send, hidden per user once closed.
 *
 * @return The banner, or null once dismissed.
 */
const IntroBanner = () => {
	const dismissed = useSelect(
		select =>
			( select( preferencesStore ) as unknown as PreferencesSelectors ).get(
				PREFERENCE_SCOPE,
				PREFERENCE_NAME
			),
		[]
	);
	const { set } = useDispatch( preferencesStore ) as unknown as PreferencesActions;
	const dismiss = useCallback( () => set( PREFERENCE_SCOPE, PREFERENCE_NAME, true ), [ set ] );

	if ( dismissed ) {
		return null;
	}

	return (
		<div className="jetpack-send-banner">
			<div className="jetpack-send-banner__content">
				<h2 className="jetpack-send-banner__title">
					{ __( 'Every email, delivered.', 'jetpack-send-pkg' ) }
				</h2>
				<p className="jetpack-send-banner__description">
					{ __(
						'Password resets, order receipts, and form replies go out through MailChannels, signed for your own domain, so they reach the inbox instead of spam.',
						'jetpack-send-pkg'
					) }
				</p>
			</div>
			<BannerArt />
			<IconButton
				className="jetpack-send-banner__close"
				icon={ closeSmall }
				label={ __( 'Dismiss', 'jetpack-send-pkg' ) }
				variant="minimal"
				size="small"
				onClick={ dismiss }
			/>
		</div>
	);
};

export default IntroBanner;
