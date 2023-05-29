<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.2
 *
 * Copyright 2017 ZeroBSCRM.com
 *
 * Date: 30/07/2017
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

#} Outputs html message, remake of zeroBSCRM_html_msg
/*
	$iconClass = message
	$msgClass = warning etc.

	https://semantic-ui.com/collections/message.html
*/
function zeroBSCRM_UI2_messageHTML($msgClass='',$msgHeader='',$msg='',$iconClass='',$id=''){

	if (!empty($iconClass)) $msgClass .= ' icon';

	$ret = '<div class="ui '.$msgClass.' message"';
	if (!empty($id)) $ret .= ' id="'.$id.'"';
	$ret .= '>';
	if (!empty($iconClass)) $ret .= '<i class="'.$iconClass.' icon"></i>';
	$ret .= '<div class="content">';
  	if (!empty($msgHeader)) $ret .= '<div class="header">'.$msgHeader.'</div>';
  	$ret .= '<p>'.$msg.'</p></div></div>';

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
