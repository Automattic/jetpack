<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.0.6
 *
 * Copyright 2020 Automattic
 *
 * Date: 24/05/2017
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

# Globals...

   #} Cache of locale... if set (avoids multiple getting for each label)
   global $zeroBSCRM_locale;

/* this isn't used!
#} Temp mapping for 2.0.6:
global $zeroBSCRM_localisationTextOverrides; $zeroBSCRM_localisationTextOverrides = array(

    'en-US' => array(
                    array('County','State'),
                    array('Postcode','Zip Code'),
                    array('Mobile Telephone','Cell')
                )

); */


/* 
    This func was built to centralise "workarounds" where the default
    WP date config conflicted with that of the jquery datepicker used.
    ... WH did so 27/2/19
    ... ultimately this method is clearly flawed somewhere in the linkage though,
    ... as these keep cropping up.

*/
function zeroBSCRM_locale_wpConversionWorkarounds($format='d/m/Y'){
    
    //allow for this funky thing here. (only if getting default format)
    if ($format == 'F j, Y') $format = 'm/d/Y';
    if ($format == 'jS F Y') $format = 'd/m/Y';
    if ($format == 'j F, Y') $format = 'd/m/Y';
    
        // added 27/2/19 JIRA-BS-792
        if ($format == 'j. F Y') $format = 'd/m/Y'; 
        if ($format == 'j F Y') $format = 'd/m/Y'; 

        // added 11/03/19 JIRA-ZBS-817
        if ($format == 'F j, Y') $format = 'm/d/Y'; 

        // Temporary workaround for gh-273, to be addressed in full under gh-313
        if ($format === 'Y. F j.') $format = 'Y/d/m';

        return $format;
}


//https://codex.wordpress.org/Function_Reference/date_i18n
function zeroBSCRM_locale_utsToDate($unixTimestamp=-1){
    if ($unixTimestamp === -1) $unixTimestamp = time();
    //return date_i18n( get_option( 'date_format' ), $unixTimestamp );
    return zeroBSCRM_date_i18n(get_option( 'date_format' ), $unixTimestamp );
}
//https://codex.wordpress.org/Function_Reference/date_i18n + 'Y-m-d H:i:s'
function zeroBSCRM_locale_utsToDatetime($unixTimestamp=-1){
    if ($unixTimestamp === -1) $unixTimestamp = time();
    //return date_i18n( 'Y-m-d H:i:s', $unixTimestamp );
    return zeroBSCRM_date_i18n('Y-m-d H:i:s', $unixTimestamp );
}

//same as above but in WP chosen formats
function zeroBSCRM_locale_utsToDatetimeWP($unixTimestamp=-1){
    if ($unixTimestamp === -1) $unixTimestamp = time();
    //return date_i18n( 'Y-m-d H:i:s', $unixTimestamp );
    return zeroBSCRM_date_i18n(get_option( 'date_format' ) ." " . get_option( 'time_format' ), $unixTimestamp );
}

// adapted from https://stackoverflow.com/questions/2891937/strtotime-doesnt-work-with-dd-mm-yyyy-format
function zeroBSCRM_locale_dateToUTS($dateInFormat='',$withTime=false, $specificFormat=false){
    
    try {

        $format = zeroBSCRM_date_defaultFormat();
        if ($withTime) {
            $format .= ' H:i';
            // hacky catch of AM/PM + add to format end...?
            if (strpos($dateInFormat, 'AM') > -1 || strpos($dateInFormat,'PM') > -1){
                $format .= ' A';
            }
        }

        // if specificFormat, use that
        if ($specificFormat !== false) $format = $specificFormat;
        
        // debug echo 'from: '.$dateInFormat.' in format '.$format.':';
        
        // requires php 5.3+
        $dt = DateTime::createFromFormat('!'.$format, $dateInFormat);

        // debug  echo 'DT Errors:<pre>'.print_r(DateTime::getLastErrors(),1).'</pre>';

        /*

        can use this to check for errors:
            print_r(DateTime::getLastErrors());
        e.g. 

            Array
            (
                [warning_count] => 0
                [warnings] => Array
                    (
                    )

                [error_count] => 4
                [errors] => Array
                    (
                        [2] => Unexpected data found.
                        [5] => Unexpected data found.
                    )

            ) */

        // if was failed conversion, is set to false
        //if ($dt !== false)
        if ($dt instanceof DateTime){

            return $dt->getTimestamp();

        } else {            
            // this only happens when people have $date in one format, but their settings match a diff setting

                // try this
                $dt = strtotime($dateInFormat);
                
                // debug 
                //echo 'from: '.$dateInFormat.' in format '.$format.'... = '.$dt;
                
                if ($dt !== false && $dt > 0) return $dt;

            return false;

        }

    } catch (Exception $e){

        // debug echo 'error:'.$e->getMessage();
        try {

                // try this
                $dt = strtotime($dateInFormat);
                //echo 'dt:'.$dateInFormat.'=>'; print_r($dt); echo '!';
                if ($dt !== false && $dt > 0) return $dt;

        } catch (Exception $e){

            // really not a great date...
            //echo 'error2:'.$e->getMessage();

        }

    }

    return false;

}
/* WH switched this for the above zeroBSCRM_locale_dateToUTS, which is just the next answer down on your original stack overflow link
... this was good, but that was a little more cleaner/all-encompassing.

//function to convert date to time for ZBS use (since multile dates used) this was a bit of a pig
//since when updating DB it needs Y-m-d H:i:s format. and strtotime does not work with UK date formats
//hence the 1 Jan 1970 bug reported in the date picker from Paul (groove-85858971)

function zeroBSCRM_strtotime($date = ''){


        $the_format = get_option( 'date_format' );
        if($the_format == 'd/m/Y' || $the_format = 'jS F Y' || $the_format = 'F j, Y'){
           $date = str_replace('/', '-', $date);
        }
        $unixtime = strtotime($date);
        return $unixtime;
} */

// wh added 9/8/18 - adds time to zeroBSCRM_date_i18n, basically
// ... just appends H:i to format
// ... had to use for .zbs-date-time datepicker
function zeroBSCRM_date_i18n_plusTime($format,$timestamp, $isUTC=false){

    // pass -1 to default to WP date
    if ($format == -1) $format = zeroBSCRM_date_defaultFormat();

    // add time
    $format .= ' H:i';

    return zeroBSCRM_date_i18n($format,$timestamp,false,$isUTC);

}

// this is a modified version of 2x answer here, takinginto account +- gmt_offset
// https://wordpress.stackexchange.com/questions/94755/converting-timestamps-to-local-time-with-date-l18n
// fully testing + works as at 11/05/18
//      WH: As of 16/8/18 - has extra var $isUTC - 
//         this is a workaround for those peeps in non UTC
//          who, when converting dates, were getting back 'offset' dates (this is because we're using timestamps of midnight here)
function zeroBSCRM_date_i18n( $format, $timestamp, $notused = true, $isUTC = false ) {

    // catch empty timestamps
    if ( ! is_numeric( $timestamp ) ) {
    	$timestamp = time();
	}

    // pass -1 to default to WP date
    if ($format == -1) $format = zeroBSCRM_date_defaultFormat();

    // Timezone Support 

        // Default:
        $timezone_str = 'UTC';

    	// got a non-utc timestamp str?
        if (!$isUTC){
            $timezone_str = get_option('timezone_string');
            if (empty($timezone_str)){

            	// if offset, use that
            	$offsetStr = get_option( 'gmt_offset' );
            	if (!empty($offsetStr)){
        			$offset = $offsetStr * HOUR_IN_SECONDS;
        			return date_i18n($format, $timestamp + $offset, true);
        		}

            }
        }
        // if still no return, default:
        if (empty($timezone_str)) $timezone_str = 'UTC';

    // proceed with timezone str:
    $timezone = new \DateTimeZone($timezone_str);

    // The date in the local timezone.
    $date = new \DateTime(null, $timezone);
    $date->setTimestamp($timestamp);
    $date_str = $date->format('Y-m-d H:i:s');

    // Pretend the local date is UTC to get the timestamp
    // to pass to date_i18n().
    $utc_timezone = new \DateTimeZone('UTC');
    $utc_date = new \DateTime($date_str, $utc_timezone);
    $timestamp = $utc_date->getTimestamp();

    return date_i18n($format, $timestamp, true);
}

// gets format + returns format (with some mods)
function zeroBSCRM_date_defaultFormat() {
     
    $format = get_option( 'date_format' );

    // catch specific issues
    $format = zeroBSCRM_locale_wpConversionWorkarounds($format);
    
    return $format;
}

// 
function zeroBSCRM_date_forceEN($time=-1){

    if ($time > 0){
        
        // Note: Because this continued to be use for task scheduler workaround (before we got to rewrite the locale timestamp saving)
        // ... we functionised in Core.Localisation.php to keep it DRY

        // temp pre v3.0 fix, forcing english en for this datepicker only. 
        // requires js mod: search #forcedlocaletasks
        // (Month names are localised, causing a mismatch here (Italian etc.)) 
        // ... so we translate:
        //      d F Y H:i:s (date - not locale based)
        // https://www.php.net/manual/en/function.date.php
        // ... into
        //      %d %B %Y %H:%M:%S (strfttime - locale based date)
        // (https://www.php.net/manual/en/function.strftime.php)

        zeroBSCRM_locale_setServerLocale('en_US');
        $r = strftime("%d %B %Y %H:%M:%S",$time);
        zeroBSCRM_locale_resetServerLocale();

        return $r;

    } 

    return false;
}




// https://stackoverflow.com/questions/16702398/convert-a-php-date-format-to-a-jqueryui-datepicker-date-format
// We need this to take WP locale -> datetimepicker
/*
 * Matches each symbol of PHP date format standard
 * with jQuery equivalent codeword
 * @author Tristan Jahier
 */
/* this one didn't work, see next
function zeroBSCRM_date_tojQueryUI($php_format='')
{
    $SYMBOLS_MATCHING = array(
        // Day
        'd' => 'dd',
        'D' => 'D',
        'j' => 'd',
        'l' => 'DD',
        'N' => '',
        'S' => '',
        'w' => '',
        'z' => 'o',
        // Week
        'W' => '',
        // Month
        'F' => 'MM',
        'm' => 'mm',
        'M' => 'M',
        'n' => 'm',
        't' => '',
        // Year
        'L' => '',
        'o' => '',
        'Y' => 'yy',
        'y' => 'y',
        // Time
        'a' => '',
        'A' => '',
        'B' => '',
        'g' => '',
        'G' => '',
        'h' => '',
        'H' => '',
        'i' => '',
        's' => '',
        'u' => ''
    );
    $jqueryui_format = "";
    $escaping = false;
    for($i = 0; $i < strlen($php_format); $i++)
    {
        $char = $php_format[$i];
        if($char === '\\') // PHP date format escaping character
        {
            $i++;
            if($escaping) $jqueryui_format .= $php_format[$i];
            else $jqueryui_format .= '\'' . $php_format[$i];
            $escaping = true;
        }
        else
        {
            if($escaping) { $jqueryui_format .= "'"; $escaping = false; }
            if(isset($SYMBOLS_MATCHING[$char]))
                $jqueryui_format .= $SYMBOLS_MATCHING[$char];
            else
                $jqueryui_format .= $char;
        }
    }
    return $jqueryui_format;
} */
// https://stackoverflow.com/questions/16702398/convert-a-php-date-format-to-a-jqueryui-datepicker-date-format
// further down
// We need this to take WP locale -> datetimepicker
// Note: WH added strtoupper, seems to be req. for datetimerangepicker
/*
 * Matches each symbol of PHP date format standard
 * with jQuery equivalent codeword
 * @author Tristan Jahier
 */ 
function zeroBSCRM_date_PHPtoDatePicker($format) {

    // dd M yy

        static $assoc = array(
            'Y' => 'yyyy',
            'y' => 'yy',
            'F' => 'MM',
            'm' => 'mm',
            'l' => 'DD',
            'd' => 'dd',
            'D' => 'D',
            'j' => 'd',
            'M' => 'M',
            'n' => 'm',
            'z' => 'o',
            'N' => '',
            'S' => 'd',
            'w' => '',
            'W' => '',
            't' => '',
            'L' => '',
            'o' => '',
            'a' => '',
            'A' => '',
            'B' => '',
            'g' => '',
            'G' => '',
            'h' => '',
            'H' => '',
            'i' => '',
            's' => '',
            'u' => ''
        );

        $keys = array_keys($assoc);

        $indeces = array_map(function($index) {
            return '{{' . $index . '}}';
        }, array_keys($keys));

        $format = str_replace($keys, $indeces, $format);

        // Note: WH added strtoupper, seems to be req. for datetimerangepicker
        return strtoupper(str_replace($indeces, $assoc, $format));
    }


function zeroBSCRM_date_localeForDaterangePicker(){

    $dateTimePickerFormat = 'DD.MM.YYYY'; $wpDateFormat = get_option( 'date_format' ); 

    if (!empty($wpDateFormat)) {

        // catch specific issues
        $wpDateFormat = zeroBSCRM_locale_wpConversionWorkarounds($wpDateFormat);
        
        $dateTimePickerFormat = zeroBSCRM_date_PHPtoDatePicker($wpDateFormat);
        
    }


    return array(
                'format' => $dateTimePickerFormat,

                'applyLabel' =>  __('Apply','zero-bs-crm'),
                'cancelLabel' =>  __('Clear','zero-bs-crm'),
                'fromLabel' =>  __('From','zero-bs-crm'),
                'toLabel' =>  __('To','zero-bs-crm'),
                'customRangeLabel' =>  __('Custom','zero-bs-crm'),

                "separator" => " - ",

                "daysOfWeek" => array(
                    __("Su",'zero-bs-crm'),
                    __("Mo",'zero-bs-crm'),
                    __("Tu",'zero-bs-crm'),
                    __("We",'zero-bs-crm'),
                    __("Th",'zero-bs-crm'),
                    __("Fr",'zero-bs-crm'),
                    __("Sa",'zero-bs-crm')
                ),
                "monthNames" => array(
                    __("January",'zero-bs-crm'),
                    __("February",'zero-bs-crm'),
                    __("March",'zero-bs-crm'),
                    __("April",'zero-bs-crm'),
                    __("May",'zero-bs-crm'),
                    __("June",'zero-bs-crm'),
                    __("July",'zero-bs-crm'),
                    __("August",'zero-bs-crm'),
                    __("September",'zero-bs-crm'),
                    __("October",'zero-bs-crm'),
                    __("November",'zero-bs-crm'),
                    __("December",'zero-bs-crm')
                ),
                "firstDay" => (int)get_option('start_of_week',0)
            );

/* full possible settings
"format": "MM/DD/YYYY",
        "separator": " - ",
        "applyLabel": "Apply",
        "cancelLabel": "Cancel",
        "fromLabel": "From",
        "toLabel": "To",
        "customRangeLabel": "Custom",
        "daysOfWeek": [
            "Su",
            "Mo",
            "Tu",
            "We",
            "Th",
            "Fr",
            "Sa"
        ],
        "monthNames": [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ],
        "firstDay": 1
     */

}
/* Removed 2.14 - opting for _e :) 

#} This simply dumps any 'overrides' into the __w function before returning (E.g. County -> State)
function zeroBSCRM_localiseFieldLabel($labelStr=''){

    global $zeroBSCRM_localisationTextOverrides;

    $locale = zeroBSCRM_getLocale();

    #} Init just checks if set to en_US
    if (isset($locale) && !empty($locale) && isset($zeroBSCRM_localisationTextOverrides[$locale])){

        #} locale present - replace any?
        $replacement = $labelStr;
        foreach ($zeroBSCRM_localisationTextOverrides[$locale] as $repArr){

            if (isset($repArr[0]) && $repArr[0] == $labelStr) $replacement = $repArr[1];

        }

        #} Return replacement or orig..
        return $replacement;

    }


    return $labelStr;

} */


// for JS there's a ver of this in admin.global called zeroBSCRMJS_formatCurrency
function zeroBSCRM_formatCurrency($amount){

    //see here: https://akrabat.com/using-phps-numberformatter-to-format-currencies/
    //needs the international PHP extension (hence wrapped in if exists)

    /*

        You can check if you have the intl extension installed using php -m | grep intl and if you don't then you can install it with apt-get install php5-intl or yum install php-intl assuming you use your distro's stock PHP. (If you compile your own, then --enable-intl is the switch you need.)

    */
    
    global $zbs;

    /*
        'currency' => symbol
        'currency_position' => 0,
        'currency_format_thousand_separator' => ',',
        'currency_format_decimal_separator' => '.',
        'currency_format_number_of_decimals' => 2,
    */
    
    //WH would be nice if we could get a GROUP of settings (i.e. just the ones above.. )
    $settings = $zbs->settings->getAll();

    //defaults declared elsewhere so do I need the below :declare: :bear:
    $zbscrm_currency_symbol = '$';
    $zbscrm_currency_format_thousand_separator = ',';
    $zbscrm_currency_format_decimal_separator = '.';
    $zbscrm_currency_format_number_of_decimals = 2;

    $zbscrm_currency_symbol = zeroBSCRM_getCurrencyChr();
    $zbscrm_currency_position = $settings['currency_position'];
    
    $zbscrm_currency_format_thousand_separator = $settings['currency_format_thousand_separator'];
    $zbscrm_currency_format_decimal_separator  = $settings['currency_format_decimal_separator'];
    $zbscrm_currency_format_number_of_decimals = $settings['currency_format_number_of_decimals'];

    //process the number
    $formatted_number = number_format(
        (double) $amount,
        $zbscrm_currency_format_number_of_decimals,
        $zbscrm_currency_format_decimal_separator,
        $zbscrm_currency_format_thousand_separator
    );

    //add the currecy symbol

    switch($zbscrm_currency_position){
        case 0: //left
            $formatted_amount = $zbscrm_currency_symbol . $formatted_number;  
        break;
        case 1: //right
            $formatted_amount = $formatted_number . $zbscrm_currency_symbol;
        break;
        case 2: //left with space
            $formatted_amount = $zbscrm_currency_symbol . " " . $formatted_number;
        break;
        case 3: //right with space
            $formatted_amount = $formatted_number . " " . $zbscrm_currency_symbol;
        break;
        default:   //default to the left
            $formatted_amount = $zbscrm_currency_symbol . $formatted_number;
        break;

    }

    return $formatted_amount;

    /* AS OF v2.84+ we shunt everything through the settings rather than the below which seems unreliable 



    $locale = zeroBSCRM_getLocale(true);
    if(class_exists('NumberFormatter')){
        $formatter = new NumberFormatter($locale,  NumberFormatter::CURRENCY);
        return $formatter->formatCurrency($amount, zeroBSCRM_getCurrencyStr());
    }
    else{

        // use wp default /// which needs this currency :)
        return zeroBSCRM_getCurrencyChr().number_format_i18n($amount);   
    }
    
    */



}


function zeroBSCRM_format_quantity( $quantity ) {
	return sprintf( '%g', $quantity );
}


function zeroBSCRM_getLocale($full=true){

    global $zeroBSCRM_locale;

    if (isset($zeroBSCRM_locale)) return $zeroBSCRM_locale;

    $zeroBSCRM_locale = get_bloginfo("language"); 

    if (!$full){
        
        $zeroBSCRM_locale = str_replace('_','-',$zeroBSCRM_locale); // just in case en_GB?
        $langParts = explode('-', $zeroBSCRM_locale);
        $zeroBSCRM_locale = $langParts[0];

    }

    return $zeroBSCRM_locale;
}


// getLocale wrapper
function zeroBSCRM_locale_getServerLocale(){

    // https://stackoverflow.com/questions/29932843/php-get-current-locale
    // limited use, e.g. flywheel returns 'C'
    return setlocale(LC_ALL, 0);
    
}
// setLocale wrapper
// https://www.php.net/manual/en/function.setlocale.php
function zeroBSCRM_locale_setServerLocale($localeString='en_US'){

    setlocale(LC_ALL, $localeString);
    
}
// reset locale to server default
// https://www.php.net/manual/en/locale.getdefault.php
function zeroBSCRM_locale_resetServerLocale(){

        // This only works if intl installed (not default install for a lot of servs e.g. flywheel)
        if (class_exists('Locale')) setlocale(LC_ALL, Locale::getDefault());

}


/* ===========================================
    Helper functions (moved from dal 2.2)
=========================================== */
    #} Minified get currency func
    function zeroBSCRM_getCurrencyChr(){

        #} Curr
        $theCurrency = zeroBSCRM_getSetting('currency');
        $theCurrencyChar = '&pound;';
        if (isset($theCurrency) && isset($theCurrency['chr'])) {
            
            $theCurrencyChar = $theCurrency['chr']; 

        }

        return $theCurrencyChar;
    }
    function zeroBSCRM_getCurrencyStr(){

        #} Curr
        $theCurrency = zeroBSCRM_getSetting('currency');
        $theCurrencyStr = 'GBP';
        if (isset($theCurrency) && isset($theCurrency['chr'])) {
            
            $theCurrencyStr = $theCurrency['strval'];

        }

        return $theCurrencyStr;
    }
    function zeroBSCRM_getTimezoneOffset(){

        return get_option('gmt_offset');

    }
    function zeroBSCRM_getCurrentTime(){
        return current_time();
    }



   #} Date time formats
   # http://wordpress.stackexchange.com/questions/591/how-to-get-the-date-format-and-time-format-settings-for-use-in-my-template
   function zeroBSCRM_getDateFormat(){

        #} cache
        global $zeroBSCRM_dateFormat; if (isset($zeroBSCRM_dateFormat)) return $zeroBSCRM_dateFormat;
        $zeroBSCRM_dateFormat = get_option('date_format');

        return $zeroBSCRM_dateFormat;

   }
   function zeroBSCRM_getTimeFormat(){

        #} cache
        global $zeroBSCRM_timeFormat; if (isset($zeroBSCRM_timeFormat)) return $zeroBSCRM_timeFormat;
        $zeroBSCRM_timeFormat = get_option('time_format');

        return $zeroBSCRM_timeFormat;

   }

    // output locale stuff into header :)
    // actually left in main .php for now 
