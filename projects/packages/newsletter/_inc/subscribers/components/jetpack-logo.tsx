import { __ } from '@wordpress/i18n';

type Props = {
	height?: number;
	className?: string;
};

/**
 * Inline Jetpack mark — same SVG that `@automattic/jetpack-components`'
 * `JetpackLogo` ships with `showText={ false }`. Inlined locally so the
 * unified header doesn't pull in the full jetpack-components bundle (whose
 * SCSS chain isn't compatible with wp-build's esbuild loader paths).
 *
 * @param props           - Component props.
 * @param props.height    - Logo height in px. Square viewbox keeps width = height.
 * @param props.className - Optional class merged onto the svg root.
 * @return Jetpack mark SVG.
 */
export default function JetpackLogo( { height = 20, className }: Props ): JSX.Element {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 32 32"
			role="img"
			height={ height }
			className={ className }
			aria-labelledby="jetpack-logo-title"
		>
			<title id="jetpack-logo-title">{ __( 'Jetpack Logo', 'jetpack-newsletter' ) }</title>
			<path
				fill="#069e08"
				d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M15,19H7l8-16V19z M17,29V13h8L17,29z"
			/>
		</svg>
	);
}
