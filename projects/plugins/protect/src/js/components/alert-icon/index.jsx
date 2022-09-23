import { Path, SVG, Rect, G } from '@wordpress/components';
import React from 'react';
import styles from './styles.module.scss';

/**
 * Alert icon
 *
 * @param {object} props           - Props.
 * @param {string} props.className - Optional component class name.
 * @param {string} props.color     - Optional icon color. Defaults to '#D63638'.
 * @returns { React.ReactNode }      The Alert Icon component.
 */
export default function AlertSVGIcon( { className, color = '#D63638' } ) {
	return (
		<div className={ styles.container }>
			<SVG
				className={ className }
				width="127"
				height="136"
				viewBox="0 0 127 136"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<G filter="url(#filter0_d_2716_19567)">
					<Path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M63.4061 36L86.8123 46.4057V61.9177C86.8123 75.141 78.1289 87.6611 65.8844 91.6107C64.2754 92.1298 62.5369 92.1297 60.9279 91.6107C48.6834 87.6611 40 75.141 40 61.9177V46.4057L63.4061 36Z"
						fill={ color }
					/>
					<Rect x="59.8953" y="72.1666" width="7.02184" height="7" rx="3.5" fill="white" />
					<Path
						d="M59.9619 51.0626C59.9258 50.4868 60.383 50 60.9599 50H65.8524C66.4293 50 66.8866 50.4868 66.8505 51.0626L65.8056 67.7292C65.7725 68.2562 65.3355 68.6667 64.8075 68.6667H62.0048C61.4769 68.6667 61.0398 68.2562 61.0068 67.7292L59.9619 51.0626Z"
						fill="white"
					/>
				</G>
				<defs>
					<filter
						id="filter0_d_2716_19567"
						x="0"
						y="0"
						width="126.812"
						height="136"
						filterUnits="userSpaceOnUse"
						colorInterpolationFilters="sRGB"
					>
						<feFlood floodOpacity="0" result="BackgroundImageFix" />
						<feColorMatrix
							in="SourceAlpha"
							type="matrix"
							values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
							result="hardAlpha"
						/>
						<feOffset dy="4" />
						<feGaussianBlur stdDeviation="20" />
						<feComposite in2="hardAlpha" operator="out" />
						<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0" />
						<feBlend
							mode="normal"
							in2="BackgroundImageFix"
							result="effect1_dropShadow_2716_19567"
						/>
						<feBlend
							mode="normal"
							in="SourceGraphic"
							in2="effect1_dropShadow_2716_19567"
							result="shape"
						/>
					</filter>
				</defs>
			</SVG>
		</div>
	);
}
