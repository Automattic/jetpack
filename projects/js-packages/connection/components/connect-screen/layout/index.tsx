import { JetpackLogo } from '@automattic/jetpack-components';
import clsx from 'clsx';
import React from 'react';
import ImageSlider from './image-slider';
import type { Props as ConnectScreenProps } from '../basic';
import type { WithRequired } from '../types';
import './style.scss';

type SharedProps = Pick<
	ConnectScreenProps,
	'title' | 'children' | 'assetBaseUrl' | 'images' | 'logo'
>;
type OwnProps = {
	// Class to be added to component
	className?: string;
	// Whether to apply RNA styles
	rna?: boolean;
};

export type Props = WithRequired< SharedProps, 'title' > & OwnProps;

/*
 * The Connection Screen Layout component.
 */
const ConnectScreenLayout: React.FC< Props > = ( {
	title,
	children,
	className,
	assetBaseUrl,
	images,
	logo,
	rna = false,
} ) => {
	const showImageSlider = images?.length;

	return (
		<div
			className={ clsx(
				'jp-connection__connect-screen-layout',
				showImageSlider ? 'jp-connection__connect-screen-layout__two-columns' : '',
				className ? ' ' + className : ''
			) }
		>
			{ rna && (
				<div className="jp-connection__connect-screen-layout__color-blobs">
					<div className="jp-connection__connect-screen-layout__color-blobs__green"></div>
					<div className="jp-connection__connect-screen-layout__color-blobs__yellow"></div>
					<div className="jp-connection__connect-screen-layout__color-blobs__blue"></div>
				</div>
			) }

			<div className="jp-connection__connect-screen-layout__left">
				{ logo || <JetpackLogo /> }

				<h2>{ title }</h2>

				{ children }
			</div>

			{ showImageSlider ? (
				<div className="jp-connection__connect-screen-layout__right">
					<ImageSlider images={ images } assetBaseUrl={ assetBaseUrl } />
				</div>
			) : null }
		</div>
	);
};

export default ConnectScreenLayout;
