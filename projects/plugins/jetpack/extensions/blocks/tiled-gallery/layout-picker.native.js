import { useNavigation } from '@react-navigation/native';
import { BlockStyles } from '@wordpress/block-editor';
import { BottomSheet } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight } from '@wordpress/icons';
import { Text } from 'react-native';
import styles from './styles.scss';
import { settings } from './index';

const LayoutPicker = props => {
	const [ showSubSheet, setShowSubSheet ] = useState( false );
	const navigation = useNavigation();

	const goBack = () => {
		setShowSubSheet( false );
		navigation.goBack();
	};

	const openSubSheet = () => {
		navigation.navigate( BottomSheet.SubSheet.screenName );
		setShowSubSheet( true );
	};

	const currentStyleName = props.className
		? settings.styles.find( style => `is-style-${ style.name }` === props.className ).label
		: null;

	return (
		<BottomSheet.SubSheet
			navigationButton={
				<BottomSheet.Cell
					cellRowContainerStyle={ styles.cellRowStyles }
					labelStyle={ styles.galleryLayoutTitle }
					label={ __( 'Gallery style', 'jetpack' ) }
					separatorType="none"
					onPress={ openSubSheet }
					accessibilityRole={ 'button' }
					accessibilityLabel={ __( 'Gallery style', 'jetpack' ) }
					accessibilityHint={ __( 'Navigates to layout selection screen', 'jetpack' ) }
				>
					<Text>{ currentStyleName }</Text>
					<Icon icon={ chevronRight }></Icon>
				</BottomSheet.Cell>
			}
			showSheet={ showSubSheet }
		>
			<>
				<BottomSheet.NavBar>
					<BottomSheet.NavBar.BackButton onPress={ goBack } />
					<BottomSheet.NavBar.Heading>
						{ __( 'Gallery style', 'jetpack' ) }
					</BottomSheet.NavBar.Heading>
				</BottomSheet.NavBar>
				<BlockStyles clientId={ props.clientId } />
			</>
		</BottomSheet.SubSheet>
	);
};

export default LayoutPicker;
