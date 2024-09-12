<?php
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 */

/* 

   (BASIC) PERFORMANCE TRACKING - include for use.

*/

  #} Store times
   global $zbsTimes; if (!isset($zbsTimes)) $zbsTimes = array();

   function zeroBSCRM_performanceTest_startTimer($key=''){

   		if (!empty($key)){

   			global $zbsTimes;
   			if (!isset($zbsTimes[$key]) || !is_array($zbsTimes[$key])) $zbsTimes[$key] = array('start'=>-1,'end'=>-1);

   			#} start it
   			$zbsTimes[$key]['start'] = microtime(true);

   		}

   		return false;

   }
   function zeroBSCRM_performanceTest_finishTimer($key=''){

   		if (!empty($key)){

   			global $zbsTimes;
   			
   			#} end it - lazy, no cheeck
   			$zbsTimes[$key]['end'] = microtime(true);

   		}

   		return false;

   }

   // returns singular results for 1 timer
   // (used by debugger plugin)
   function zeroBSCRM_performanceTest_results($key=''){


   		if (!empty($key)){

   			global $zbsTimes;

   			if (is_array($zbsTimes) && isset($zbsTimes[$key])){

   				$v = $zbsTimes[$key];
   			
				$time_start = -1; if (isset($v['start'])) $time_start = $v['start'];
				$time_end = -1; if (isset($v['end'])) $time_end = $v['end'];

				$sTime = -1; $sTimeExtra = '';
				if ($time_start > -1 && $time_end > -1) {
					$sTime = round(($time_end - $time_start),3);
				} else {

					// one hasn't been set
					if ($time_end == -1 && $time_start > -1){

						$sTime = round((microtime(true)-$time_start),3);
						$sTimeExtra ='+ (still running)';
					
					} else {

						$sTimeExtra = '???';

					}
				}

				return $sTime.$sTimeExtra;

			}

   		}

   		return false;

   }

   function zeroBSCRM_performanceTest_debugOut(){

   		global $zbsTimes;

		// debug 
		echo '<div><h1>CRM Performance Debug</h1>';
		$scriptVer = 'console.log("=============== CRM Performance Debug ==============");';
		foreach ($zbsTimes as $k => $v) {

			$time_start = -1; if (isset($v['start'])) $time_start = $v['start'];
			$time_end = -1; if (isset($v['end'])) $time_end = $v['end'];

			$sTime = -1; $sTimeExtra = '';
			if ($time_start > -1 && $time_end > -1) {
				$sTime = round(($time_end - $time_start),3);
			} else {

				// one hasn't been set
				if ($time_end == -1 && $time_start > -1){

					$sTime = round((microtime(true)-$time_start),3);
					$sTimeExtra ='+ (still running)';
				
				} else {

					$sTimeExtra = '???';

				}
			}

		    echo '<h2>Time: '.$k.'</h2>';
		    echo '<p>'.$sTime.$sTimeExtra.' seconds</p>';
		    $retArr = $v;
		    $retArr['took'] = $sTime;
			$scriptVer .= 'console.log("'.$k.': '.$sTime.$sTimeExtra.'",'.json_encode($retArr).');';

		}
		echo '</div>';
		echo '<script type="text/javascript">'.$scriptVer.'</script>';

   }

   #} Start a global timer :)
   zeroBSCRM_performanceTest_startTimer('postinc');





	// ====================================================================
	// ==================== General Perf Testing ==========================
    function zeroBSCRM_performanceTest_closeGlobalTest($key=''){

    	if (defined('ZBSPERFTEST')) {
	    	if (!empty($key)){

				// retrieve our global (may have had any number of test res added)
				global $zbsPerfTest;

				// finish timer
				zeroBSCRM_performanceTest_finishTimer($key);

				// store in perf-reports
				$zbsPerfTest['results'][$key] = zeroBSCRM_performanceTest_results($key);

			}	
    	}

    }
	
	/*

	This got abbreviated with above:


		// ====================================================================
		// ==================== General Perf Testing ==========================
		if (defined('ZBSPERFTEST')) {

			// retrieve our global (may have had any number of test res added)
			global $zbsPerfTest;

			// start timer (will need a 'catch + add' for this at end of whatever this is timing)
		   	zeroBSCRM_performanceTest_startTimer('includes');

		}
		// =================== / General Perf Testing =========================
		// ====================================================================


		// ====================================================================
		// ==================== General Perf Testing ==========================
		if (defined('ZBSPERFTEST')) {

			// finish timer
			zeroBSCRM_performanceTest_finishTimer('includes');

			// store in perf-reports
			$zbsPerfTest['results']['includes'] = zeroBSCRM_performanceTest_results('includes');

		}
		// =================== / General Perf Testing =========================
		// ====================================================================




		// ====================================================================
		// ==================== General Perf Testing ==========================
		if (defined('ZBSPERFTEST')) zeroBSCRM_performanceTest_startTimer('includes');
		// =================== / General Perf Testing =========================
		// ====================================================================


		// ====================================================================
		// ==================== General Perf Testing ==========================
		if (defined('ZBSPERFTEST')) zeroBSCRM_performanceTest_closeGlobalTest('key');
		// =================== / General Perf Testing =========================
		// ====================================================================


	*/
