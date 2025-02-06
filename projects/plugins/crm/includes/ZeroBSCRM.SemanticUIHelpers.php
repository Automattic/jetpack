<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 */

#} Outputs html label
/*
	$labelClass = yellow image etc.

	https://semantic-ui.com/elements/label.html
*/
function zeroBSCRM_UI2_label($labelClass='',$imgHTML='',$html='',$detailHTML='',$id=''){

	$ret = '<div class="ui '.$labelClass.' label"';
	if (!empty($id)) $ret .= ' id="'.$id.'"';
	$ret .= '>';
	if (!empty($imgHTML)) $ret .= $imgHTML;
  	$ret .= $html;
  	if (!empty($detailHTML)) $ret .= '<div class="detail">'.$detailHTML.'</div>';
  	$ret .= '</div>';

  	return $ret;

}
function zeroBSCRM_faSocialToSemantic($faClass=''){

	switch ($faClass){

		case 'fa-twitter':

			return 'twitter icon';
			break;

		case 'fa-facebook':

			return 'facebook icon';
			break;

		case 'fa-linkedin':

			return 'linkedin icon';
			break;

		default:

			return $faClass;
			break;

	}
	
}

	#} To match the key to the flag (for button class) the above one pops "icon" on the end
function zeroBSCRM_getSocialIcon($key = ''){
		 if($key != ''){
				$socials = array(
						'fb' => 'facebook',
						'tw' => 'twitter',
						'li' => 'linkedin',
						'vk' => 'vk',
						'gp' => 'google plus',
						'in' => 'instagram',
						'yt' => 'youtube'
				);

				if(array_key_exists($key, $socials)){
					return $socials[$key];
				}
		 }
		 return false;
	}

/**
 * Generates HTML markup for a message box.
 *
 * @param string $msg_class CSS class for the message box.
 * @param string $msg_header Optional. Header text for the message box.
 * @param string $msg Main content of the message box.
 * @param string $icon_class Optional. CSS class for an icon to be displayed in the message box.
 * @param string $id Optional. ID attribute for the message box element.
 *
 * @return string HTML markup for the message box.
 * @link https://semantic-ui.com/collections/message.html Semantic UI Message Documentation.
 */
function zeroBSCRM_UI2_messageHTML( $msg_class = '', $msg_header = '', $msg = '', $icon_class = '', $id = '' ) {
	if ( ! empty( $icon_class ) ) {
		$msg_class .= ' icon';
	}

	$ret = '<div style="box-shadow:unset; color:black;" class="ui ' . $msg_class . ' icon message jpcrm-div-message-box"';
	if ( ! empty( $id ) ) {
		$ret .= ' id="' . $id . '"';
	}
	$ret .= '>';
	if ( ! empty( $icon_class ) ) {
		$ret .= '<i class="' . $icon_class . ' icon"></i>';
	}
	$ret .= '<div class="content">';
	if ( ! empty( $msg_header ) ) {
		$ret .= '<div style="color:black;" class="header">' . $msg_header . '</div>';
	}
	$ret .= '<p>' . $msg . '</p></div></div>';

	return $ret;
}

/**
 * Return HTML for a spinner centered in a container
 */
function jpcrm_loading_container() {
	return '<div class="empty-container-with-spinner"><div class="ui active centered inline loader"></div></div>';
}

function zeroBSCRM_UI2_squareFeedbackUpsell($title='',$desc='',$linkStr='',$linkTarget='',$extraClasses=''){

	$html = '';

        $html .= '<div class="zbs-upgrade-banner '.$extraClasses.'">';
        	if (!empty($title)) $html .= '<h4>'.$title.'</h4>';
        	if (!empty($desc)) $html .= '<p>'.$desc.'</p>';
            if (!empty($linkTarget) && !empty($linkStr)) $html .= '<a class="btn" href="'.$linkTarget.'" target="_blank">'.$linkStr.'</a>';
        $html .= '</div>';


	return $html;
}
