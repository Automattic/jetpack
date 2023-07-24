/**
 * External dependencies
 */
import { Button } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import LearnHowModal from '../../block-editor/blocks/video/components/details-panel/learn-how-notice';
/**
 * Types
 */
import type React from 'react';

const chaptersLearnMoreHelper = (): React.ReactElement => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	return (
		<>
			{ createInterpolateElement(
				__(
					'Did you know you can now add Chapters to your videos? <link>Learn how</link>',
					'jetpack-videopress-pkg'
				),
				{
					link: <Button variant="link" size="small" onClick={ () => setIsModalOpen( true ) } />,
				}
			) }
			<LearnHowModal onClose={ () => setIsModalOpen( false ) } isOpen={ isModalOpen } />
		</>
	);
};

export default chaptersLearnMoreHelper;
