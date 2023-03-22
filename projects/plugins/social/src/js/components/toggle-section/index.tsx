import { Container, Text } from '@automattic/jetpack-components';
import { ToggleControl } from '@wordpress/components';
import React from 'react';
import styles from './styles.module.scss';
import { ToggleSectionProps } from './types';

/**
 * This component renders a custom toggle section.
 *
 * @param {ToggleSectionProps} props - Component props.
 * @returns {React.ReactNode} - ToggleSection react component.
 */
export default function ToggleSection( {
	title,
	onChange,
	checked,
	disabled,
	children,
}: ToggleSectionProps ): JSX.Element {
	return (
		<Container horizontalSpacing={ 7 } horizontalGap={ 3 }>
			<div className={ styles.column }>
				<ToggleControl
					className={ styles.toggle }
					disabled={ disabled }
					checked={ checked }
					onChange={ onChange }
				/>
				<Text className={ styles.title } variant="title-medium">
					{ title }
				</Text>
				{ children }
			</div>
		</Container>
	);
}
