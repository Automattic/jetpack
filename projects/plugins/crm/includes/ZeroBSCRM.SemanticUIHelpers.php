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

function zeroBSCRM_UI2_loadingSegmentHTML($height='300px',$extraClasses=''){

	return '<div class="ui loading segment '.$extraClasses.'" style="min-height:'.$height.'"><p>&nbsp;</p></div>';

}
function zeroBSCRM_UI2_loadingSegmentIncTextHTML($height='300px',$extraClasses='',$hidden=true,$id=''){

	// hidden?
	$hiddenExtraHTML = false; if ($hidden) $hiddenExtraHTML = ' style="display:none"';
	$idStr = ''; if (!empty($id)) $idStr = ' id="'.$id.'"';

	return '<div class="ui active inverted dimmer '.$extraClasses.'" style="min-height:'.$height.'"'.$hiddenExtraHTML.$idStr.'><div class="ui text loader">'.__('Loading',"zero-bs-crm").'</div></div>';

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

// https://stackoverflow.com/a/30299572 converts a number to a class name 
function jetpackcrm_convertNumberToWord($num = false){
    $num = str_replace(array(',', ' '), '' , trim($num));
    if(! $num) {
        return false;
    }
    $num = (int) $num;
    $words = array();
    $list1 = array('', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
        'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
    );
    $list2 = array('', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred');
    $list3 = array('', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion',
        'octillion', 'nonillion', 'decillion', 'undecillion', 'duodecillion', 'tredecillion', 'quattuordecillion',
        'quindecillion', 'sexdecillion', 'septendecillion', 'octodecillion', 'novemdecillion', 'vigintillion'
    );
    $num_length = strlen($num);
    $levels = (int) (($num_length + 2) / 3);
    $max_length = $levels * 3;
    $num = substr('00' . $num, -$max_length);
    $num_levels = str_split($num, 3);
    for ($i = 0; $i < count($num_levels); $i++) {
        $levels--;
        $hundreds = (int) ($num_levels[$i] / 100);
        $hundreds = ($hundreds ? ' ' . $list1[$hundreds] . ' hundred' . ' ' : '');
        $tens = (int) ($num_levels[$i] % 100);
        $singles = '';
        if ( $tens < 20 ) {
            $tens = ($tens ? ' ' . $list1[$tens] . ' ' : '' );
        } else {
            $tens = (int)($tens / 10);
            $tens = ' ' . $list2[$tens] . ' ';
            $singles = (int) ($num_levels[$i] % 10);
            $singles = ' ' . $list1[$singles] . ' ';
        }
        $words[] = $hundreds . $tens . $singles . ( ( $levels && ( int ) ( $num_levels[$i] ) ) ? ' ' . $list3[$levels] . ' ' : '' );
    } //end for loop
    $commas = count($words);
    if ($commas > 1) {
        $commas = $commas - 1;
    }
    return implode(' ', $words);
}