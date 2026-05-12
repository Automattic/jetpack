/**
 * Placement illustrations for the Subscribe placements card grid (Image #5).
 * Each component renders an inline SVG wireframe of one of the four
 * placement options.
 *
 * Source: Figma exports v2 (Component 1 / Component 3 / Component 4 /
 * Frame 2147238319). The original exports embedded a 32 MB raster avatar
 * for the gravatar circle on three of the four — those rasters were
 * stripped and replaced with a flat WPDS-tone gray circle so the
 * illustrations stay pure vector and render crisply at any size.
 *
 * The SVGs use a viewBox of 294×192 and fill edge-to-edge — the placement
 * card's `.jetpack-newsletter-placement__illustration` surface sets the
 * matching aspect-ratio so they sit flush against the card border.
 *
 * Built on `@wordpress/primitives` so the outer `<SVG>` automatically gets
 * `aria-hidden="true"` + `focusable="false"` (decorative-illustration
 * semantics for assistive tech and legacy IE/Edge tab order).
 */

// Auto-converted from Figma exports v2 (Component 1, Component 3, Component 4, Frame 2147238319).
// Embedded raster avatars stripped — replaced with WPDS-tone gray circles.

import { SVG, G, Circle, Rect, Path, Defs } from '@wordpress/primitives';

/**
 * Wireframe for the homepage subscription overlay placement.
 *
 * @return Inline SVG wireframe.
 */
export function OverlayIllustration(): JSX.Element {
	return (
		<SVG width="294" height="192" viewBox="0 0 294 192" fill="none">
			<G clipPath="url(#clip0_6177_95420)">
				<Rect width="294" height="191.52" fill="#F9F9F9" />
				<Rect x="0.839844" width="293.16" height="191.52" fill="#F9F9F9" />
				<Circle cx="147" cy="56.8545" r="14.4375" fill="#C3C4C7" />
				<Rect x="113.4" y="79.167" width="67.2" height="6.72" rx="3.36" fill="#C3C4C7" />
				<Rect x="87.1504" y="91.1367" width="119.7" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="91.3496" y="95.7568" width="111.3" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="89.25" y="100.377" width="115.5" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="93.4512" y="104.997" width="107.1" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="81.5391" y="115.556" width="86.9479" height="17.0625" fill="white" />
				<Rect
					x="81.5391"
					y="115.556"
					width="86.9479"
					height="17.0625"
					stroke="#767676"
					strokeWidth="0.328125"
				/>
				<Rect x="86.625" y="122.827" width="69.3" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect width="41.349" height="17.3906" transform="translate(171.275 115.392)" fill="black" />
				<Rect x="178.822" y="122.827" width="26.2553" height="2.52" rx="1.26" fill="#3C434A" />
				<Path
					d="M276.109 12.1797L281.819 18.0597M275.939 18.0597L281.65 12.1797"
					stroke="#8C8F94"
					strokeWidth="0.63"
				/>
			</G>
			<Defs>
				<clipPath id="clip0_6177_95420">
					<Rect width="294" height="191.52" fill="white" />
				</clipPath>
			</Defs>
		</SVG>
	);
}

/**
 * Wireframe for the in-post subscription pop-up placement.
 *
 * @return Inline SVG wireframe.
 */
export function PopupIllustration(): JSX.Element {
	return (
		<SVG width="294" height="192" viewBox="0 0 294 192" fill="none">
			<G clipPath="url(#clip0_6177_95540)">
				<Rect width="294" height="191.52" fill="#F9F9F9" />
				<G clipPath="url(#clip1_6177_95540)">
					<mask id="path-1-inside-1_6177_95540" fill="white">
						<Path d="M73.9199 53.7598H219.24V107.52H73.9199V53.7598Z" />
					</mask>
					<Path
						d="M219.24 107.52V107.1H73.9199V107.52V107.94H219.24V107.52Z"
						fill="#C3C4C7"
						mask="url(#path-1-inside-1_6177_95540)"
					/>
					<Rect x="73.9199" y="53.7598" width="110.88" height="6.72" rx="3.36" fill="#C3C4C7" />
					<Rect x="73.9199" y="63.8398" width="139.44" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="68.46" width="145.32" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="73.0801" width="141.96" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="77.7002" width="143.64" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="82.3203" width="142.8" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="86.9395" width="144.48" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="91.5596" width="143.64" height="2.52" rx="1.26" fill="#C3C4C7" />
					<mask id="path-11-inside-2_6177_95540" fill="white">
						<Path d="M73.9199 120.96H219.24V174.72H73.9199V120.96Z" />
					</mask>
					<Path
						d="M219.24 174.72V174.3H73.9199V174.72V175.14H219.24V174.72Z"
						fill="#C3C4C7"
						mask="url(#path-11-inside-2_6177_95540)"
					/>
					<Rect x="73.9199" y="120.96" width="110.88" height="6.72" rx="3.36" fill="#C3C4C7" />
					<Rect x="73.9199" y="131.04" width="139.44" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="135.66" width="145.32" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="140.28" width="141.96" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="144.9" width="143.64" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="149.521" width="142.8" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="154.14" width="144.48" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="158.76" width="143.64" height="2.52" rx="1.26" fill="#C3C4C7" />
					<mask id="path-21-inside-3_6177_95540" fill="white">
						<Path d="M73.9199 188.16H219.24V241.92H73.9199V188.16Z" />
					</mask>
					<Path
						d="M219.24 241.92V241.5H73.9199V241.92V242.34H219.24V241.92Z"
						fill="#C3C4C7"
						mask="url(#path-21-inside-3_6177_95540)"
					/>
					<Rect x="73.9199" y="188.16" width="110.88" height="6.72" rx="3.36" fill="#C3C4C7" />
				</G>
				<Circle cx="18.4801" cy="18.4801" r="8.4" fill="#C3C4C7" />
				<Rect x="33.5996" y="15.1201" width="50.4" height="6.72" rx="3.36" fill="#C3C4C7" />
				<Rect x="173.041" y="16.7998" width="16.8" height="3.36" rx="1.68" fill="#C3C4C7" />
				<Rect x="196.561" y="16.7998" width="16.8" height="3.36" rx="1.68" fill="#C3C4C7" />
				<Rect x="220.08" y="16.7998" width="16.8" height="3.36" rx="1.68" fill="#C3C4C7" />
				<Rect x="243.602" y="16.7998" width="16.8" height="3.36" rx="1.68" fill="#C3C4C7" />
				<Rect x="267.121" y="16.7998" width="16.8" height="3.36" rx="1.68" fill="#C3C4C7" />
				<Rect width="294" height="191.52" fill="black" fillOpacity="0.5" />
				<Rect x="77.2793" y="59.46" width="139.86" height="72.6206" rx="3.36" fill="white" />
				<Rect x="113.609" y="69.54" width="67.2" height="6.72" rx="3.36" fill="#C3C4C7" />
				<Rect x="87.3594" y="81.5098" width="119.7" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="91.5586" y="86.1299" width="111.3" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="89.459" y="90.75" width="115.5" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="93.6602" y="95.3701" width="107.1" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="87.5234" y="104.774" width="75.3979" height="17.0625" fill="white" />
				<Rect
					x="87.5234"
					y="104.774"
					width="75.3979"
					height="17.0625"
					stroke="#767676"
					strokeWidth="0.328125"
				/>
				<Rect x="92.6094" y="112.046" width="55.44" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect width="41.349" height="17.3906" transform="translate(165.711 104.61)" fill="black" />
				<Rect x="173.258" y="112.046" width="26.2553" height="2.52" rx="1.26" fill="#3C434A" />
				<Path
					d="M204.709 69.54L210.419 75.42M204.539 75.42L210.249 69.54"
					stroke="#8C8F94"
					strokeWidth="0.63"
				/>
			</G>
			<Defs>
				<clipPath id="clip0_6177_95540">
					<Rect width="294" height="191.52" fill="white" />
				</clipPath>
				<clipPath id="clip1_6177_95540">
					<Rect
						width="145.32"
						height="137.76"
						fill="white"
						transform="translate(73.9199 53.7598)"
					/>
				</clipPath>
			</Defs>
		</SVG>
	);
}

/**
 * Wireframe for the Subscribe block at the end of each post placement.
 *
 * @return Inline SVG wireframe.
 */
export function EndOfPostIllustration(): JSX.Element {
	return (
		<SVG width="294" height="192" viewBox="0 0 294 192" fill="none">
			<G clipPath="url(#clip0_6177_95605)">
				<Rect width="294" height="191.52" fill="#F9F9F9" />
				<mask id="path-1-inside-1_6177_95605" fill="white">
					<Path d="M73.9199 -139.44H219.24V92.3996H73.9199V-139.44Z" />
				</mask>
				<Path
					d="M219.24 92.3996V91.9796H73.9199V92.3996V92.8196H219.24V92.3996Z"
					fill="#C3C4C7"
					mask="url(#path-1-inside-1_6177_95605)"
				/>
				<Rect x="73.9199" y="-2.10059" width="144.48" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="2.51953" width="143.64" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="7.13965" width="143.64" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="11.7598" width="139.44" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="16.3799" width="145.32" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="21" width="141.96" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="25.6201" width="143.64" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="30.2393" width="142.8" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="34.8594" width="144.48" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="39.4795" width="143.64" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="44.0996" width="143.64" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="48.7197" width="139.44" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="53.3398" width="145.32" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="57.96" width="141.96" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="62.5801" width="143.64" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="67.1992" width="142.8" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="71.8193" width="144.48" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="73.9199" y="76.4395" width="143.64" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="112.98" y="105.84" width="67.2" height="6.72" rx="3.36" fill="#C3C4C7" />
				<Rect x="86.7305" y="117.81" width="119.7" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="90.9297" y="122.43" width="111.3" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="88.8301" y="127.05" width="115.5" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="93.0312" y="131.67" width="107.1" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect x="84.1641" y="141.074" width="80.8579" height="17.0625" fill="white" />
				<Rect
					x="84.1641"
					y="141.074"
					width="80.8579"
					height="17.0625"
					stroke="#767676"
					strokeWidth="0.328125"
				/>
				<Rect x="89.25" y="148.346" width="55.44" height="2.52" rx="1.26" fill="#C3C4C7" />
				<Rect width="41.349" height="17.3906" transform="translate(167.811 140.91)" fill="black" />
				<Rect x="175.357" y="148.346" width="26.2553" height="2.52" rx="1.26" fill="#3C434A" />
			</G>
			<Defs>
				<clipPath id="clip0_6177_95605">
					<Rect width="294" height="191.52" fill="white" />
				</clipPath>
			</Defs>
		</SVG>
	);
}

/**
 * Wireframe for the floating subscribe button placement.
 *
 * @return Inline SVG wireframe.
 */
export function FloatingIllustration(): JSX.Element {
	return (
		<SVG width="294" height="192" viewBox="0 0 294 192" fill="none">
			<G clipPath="url(#clip0_6177_95773)">
				<Rect width="294" height="191.52" fill="#F9F9F9" />
				<G clipPath="url(#clip1_6177_95773)">
					<mask id="path-1-inside-1_6177_95773" fill="white">
						<Path d="M73.9199 53.7598H219.24V285.6H73.9199V53.7598Z" />
					</mask>
					<Path
						d="M219.24 285.6V285.18H73.9199V285.6V286.02H219.24V285.6Z"
						fill="#C3C4C7"
						mask="url(#path-1-inside-1_6177_95773)"
					/>
					<Rect x="73.9199" y="53.7598" width="110.88" height="6.72" rx="3.36" fill="#C3C4C7" />
					<Rect x="73.9199" y="63.8398" width="143.64" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="68.46" width="139.44" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="73.0801" width="145.32" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="77.7002" width="141.96" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="82.3203" width="143.64" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="86.9395" width="142.8" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="91.5596" width="144.48" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="96.1797" width="143.64" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="104.16" width="145.32" height="53.76" fill="#C3C4C7" />
					<Rect x="73.9199" y="163.38" width="143.64" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="168" width="139.44" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="172.62" width="145.32" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="177.24" width="141.96" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="181.86" width="143.64" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="186.479" width="142.8" height="2.52" rx="1.26" fill="#C3C4C7" />
					<Rect x="73.9199" y="191.1" width="144.48" height="2.52" rx="1.26" fill="#C3C4C7" />
				</G>
				<Circle cx="18.4801" cy="18.4801" r="8.4" fill="#C3C4C7" />
				<Rect x="33.5996" y="15.1201" width="50.4" height="6.72" rx="3.36" fill="#C3C4C7" />
				<Rect x="173.041" y="16.7998" width="16.8" height="3.36" rx="1.68" fill="#C3C4C7" />
				<Rect x="196.561" y="16.7998" width="16.8" height="3.36" rx="1.68" fill="#C3C4C7" />
				<Rect x="220.08" y="16.7998" width="16.8" height="3.36" rx="1.68" fill="#C3C4C7" />
				<Rect x="243.602" y="16.7998" width="16.8" height="3.36" rx="1.68" fill="#C3C4C7" />
				<Rect x="267.121" y="16.7998" width="16.8" height="3.36" rx="1.68" fill="#C3C4C7" />
			</G>
			<Rect width="42" height="16" transform="translate(237 161)" fill="black" />
			<Rect x="243.777" y="167.868" width="28.4464" height="2.26286" rx="1.13143" fill="#3C434A" />
			<Defs>
				<clipPath id="clip0_6177_95773">
					<Rect width="294" height="191.52" fill="white" />
				</clipPath>
				<clipPath id="clip1_6177_95773">
					<Rect
						width="145.32"
						height="137.76"
						fill="white"
						transform="translate(73.9199 53.7598)"
					/>
				</clipPath>
			</Defs>
		</SVG>
	);
}
