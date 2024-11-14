<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 */

	class WHWPConfigLib {
		
		#} Main settings storage
		private $settings;
		private $settingsKey = false;
		private $settingsVer = false;
		private $settingsDefault = false;	
		private $settingsPlugin = false;
		private $settingsPluginVer = false;
		private $settingsPluginDBVer = false;
		
		#} DMZ Settings
		private $settingsDMZRegister;
		private $settingsDMZKey = false;
		private $settingsDMZ;

		#} :)
		private $whlibVer = '2.0';	

		#} added "protected" list of setting keys that don't get reset when resetting to default
		private $settingsProtected = false;
		
		#} Constructor
		function __construct($config=array()) {

			#} localise any passed config
			if (is_array($config)){

				if (isset($config['conf_key'])) 			$this->settingsKey = $config['conf_key'];
				if (isset($config['conf_ver'])) 			$this->settingsVer = $config['conf_ver'];
				if (isset($config['conf_defaults'])) 		$this->settingsDefault = $config['conf_defaults'];
				if (isset($config['conf_plugin'])) 			$this->settingsPlugin = $config['conf_plugin'];
				if (isset($config['conf_pluginver'])) 		$this->settingsPluginVer = $config['conf_pluginver'];
				if (isset($config['conf_plugindbver'])) 	$this->settingsPluginDBVer = $config['conf_plugindbver'];
				if (isset($config['conf_dmzkey'])) 			$this->settingsDMZKey = $config['conf_dmzkey'];
				if (isset($config['conf_protected'])) 		$this->settingsProtected = $config['conf_protected'];

			} else exit('WHConfigLib initiated incorrectly.');

			#} define dmz settings key
			#} Set by passed config now $this->settingsDMZKey = $this->settingsKey . '_dmzregister';
			
			#} Load direct
			$this->loadFromDB(); $this->loadDMZFromDB();
			
			#} Fill any missing vars
			$this->validateAndUpdate();

			#} If empty it's first run so init from defaults
			if (empty($this->settings)) $this->initCreate();
			
		}
		
		#} Checks through defaults + existing and adds defaults where unset
		function validateAndUpdate(){

				foreach ($this->settingsDefault as $key => $val){ 
					if (!isset($this->settings[$key])) {
						$this->update($key,$val);
					}
				}

		}
		
		#} Initial Create
		function initCreate(){

			#} If properly initialised!
			if ($settingsKey !== false && $settingsVer !== false && $settingsDefault !== false && $settingsPlugin !== false && $settingsPluginVer !== false){
			
				#} Create + save initial from default
				#} Following have to be set out of props
				$defaultOptions = $this->settingsDefault;
				$defaultOptions['settingsID'] = $this->settingsVer; 
				$defaultOptions['plugin'] = $this->settingsPlugin;
				$defaultOptions['version'] = $this->settingsPluginVer; 
				$defaultOptions['db_version'] = $this->settingsPluginDBVer; 

				#} Pass back to settings, and save
				$this->settings = $defaultOptions;
				$this->saveToDB();

			#} else brutal exit!
			} else exit('WHConfigLib initiated incorrectly.');
			
		}

		#} Reset to defaults
		function resetToDefaults(){
			
			#} reset to default opts
			#} NOW with added protection :) any protected field keys wont get re-written

			#} Copy any protected keys over the new reset settings (if is set)
			$existingSettings = $this->settings;
			$newSettings = $this->settingsDefault;
			if (isset($this->settingsProtected) && is_array($this->settingsProtected)) foreach ($this->settingsProtected as $protectedKey){
				
				#} If isset
				if (isset($existingSettings[$protectedKey])){

					#} Pass it along
					$newSettings[$protectedKey] = $existingSettings[$protectedKey];

				}
			}

			#} Save em down
			$this->settings = $newSettings;
			$this->saveToDB();

		}
		
		#} Get all options as object
		function getAll($hardRefresh=false){
			
			if ($hardRefresh) $this->loadFromDB();

			return $this->settings;
			
		}
		
		#} Get single option
		function get($key,$freshFromDB=false){
			
			if (empty($key) === true) return false;

			global $zbs;
				// db-loading way (ONLY WORKS DB2!)
				return $zbs->DAL->getSetting(array('key' => $key,'fullDetails' => false));	
		}
		
		#} Add/Update *brutally
		function update($key,$val=''){
			
			if (empty($key) === true) return false;

			global $zbs;

				#} Don't even check existence as I guess it doesn't matter?
				$this->settings[$key] = $val;	
				$zbs->DAL->updateSetting($key, $val);	
			
		}		
		
		#} Delete option
		function delete($key){
			
			if (empty($key) === true) return false;

			// remove from settings
			unset( $this->settings[$key] );

			// delete from db
			global $zbs;
			return $zbs->DAL->deleteSetting( array('key' => $key) );
						
		}


		#} ==================================
		#} DMZ Config additions
		#} 2 layers:
		#} DMZConfig = whole object
		#} DMZConfigValue = object.value
		#} ==================================


		#} Get all DMZ (temp func for migration routine DB2, not to be generally used)
		function dmzGetMigrationSet(){
			
			return array($this->settingsDMZKey,$this->settingsDMZRegister,$this->settingsDMZ);
			
		}		

		#} Get single option
		function dmzGet($dmzKey,$confKey){
			
			if (empty($dmzKey) === true || empty($confKey) === true) return false;
			
			#} Assumes it's loaded!?
			if (isset($this->settingsDMZ[$dmzKey])){

				if (isset($this->settingsDMZ[$dmzKey][$confKey])) {

					return $this->settingsDMZ[$dmzKey][$confKey];

				}

			} 
			
			return false;
			
		}		
		
		#} Delete option
		function dmzDelete($dmzKey,$confKey){
			
			if (empty($dmzKey) === true || empty($confKey) === true) return false;
			
			$existingSettings = $this->dmzGetConfig($dmzKey);
			$newSettings = array();
			if (isset($existingSettings) && is_array($existingSettings)) { foreach($existingSettings as $k => $v) {
					if ($k != $confKey) $newSettings[$k] = $v;
				}
			}
				
			#} Brutal
			$this->settingsDMZ[$dmzKey] = $newSettings;	
			
			#} Save down
			$this->saveToDB();
						
		}
		
		#} Add/Update *brutally
		function dmzUpdate($dmzKey,$confKey,$val=''){
			
			if (empty($dmzKey) === true || empty($confKey) === true) return false;
			
			#} if not set, create
			if (!isset($this->settingsDMZ[$dmzKey])){

				#} add to register
				$this->settingsDMZRegister[$dmzKey] = $dmzKey;

				#} Create as arr
				$this->settingsDMZ[$dmzKey] = array();

			}

			#} Don't even check existence as I guess it doesn't matter?
			$this->settingsDMZ[$dmzKey][$confKey] = $val;		
			
			#} Save down
			$this->saveToDB();
		}
		
		#} Get alls option
		function dmzGetConfig($dmzKey){
			
			if (empty($dmzKey) === true) return false;
			
			#} Assumes it's loaded!?
			if (isset($this->settingsDMZ[$dmzKey])){

				return $this->settingsDMZ[$dmzKey];

			} 
			
			return false;
			
		}	
		
		#} Delete Config
		function dmzDeleteConfig($dmzKey){
			
			if (empty($dmzKey) === true) return false;
				
			#} Brutal
			unset($this->settingsDMZ[$dmzKey]);
			unset($this->settingsDMZRegister[$dmzKey]);
			
			#} Save down
			$this->saveToDB();
						
		}	
		
		#} Add/Update Config *brutally
		function dmzUpdateConfig($dmzKey,$config){
			
			if (empty($dmzKey) === true || empty($config) === true) return false;
			
			#} if not set, create
			if (!isset($this->settingsDMZ[$dmzKey])){

				#} add to register
				$this->settingsDMZRegister[$dmzKey] = $dmzKey;

			}

			// DEBUG echo 'type "'.$this->settingsDMZRegister.'" = "'.$dmzKey.'" ("'.gettype($this->settingsDMZRegister).'")<br>';

			#} Just brutally override
			$this->settingsDMZ[$dmzKey] = $config;		
			
			#} Save down
			$this->saveToDB();
		}	
		
		#} Load/Reload DMZ options from db 
		function loadDMZFromDB(){

			global $zbs;

				#} Load the register
				$this->settingsDMZRegister = $zbs->DAL->setting($this->settingsDMZKey,array());

				// DEBUG echo 'loaded reg = "'; print_r($this->settingsDMZRegister); echo '"!';

				#} This catches weirdo mis-saves?!
				if (!is_array($this->settingsDMZRegister)) $this->settingsDMZRegister = array();

				#} Load anything logged in register
				if (is_array($this->settingsDMZRegister) && count($this->settingsDMZRegister) > 0) { foreach ($this->settingsDMZRegister as $regEntry){

						#} Load it
						$this->settingsDMZ[$regEntry] = $zbs->DAL->setting($this->settingsDMZKey.'_'.$regEntry);

					}
				}
				return $this->settingsDMZ;
		}

		#} / DMZ Fields


		
		#} Save back to db
		function saveToDB(){

			global $zbs;
		
				// DAL2 saves individually :)
				$u = array();
				if (count($this->settings) > 0) foreach ($this->settings as $settingKey => $settingVal){

					$u[] = $zbs->DAL->updateSetting($settingKey, $settingVal);				

				}

				#} Also any DMZ's! (Brutal big saves - whole objs)

					#} save register
					$zbs->DAL->updateSetting($this->settingsDMZKey,$this->settingsDMZRegister);
					// DEBUG echo 'saved dmzregister:'; print_r($this->settingsDMZRegister); echo '!';
					if (isset($this->settingsDMZRegister) && is_array($this->settingsDMZRegister)) foreach ($this->settingsDMZRegister as $dmzKey){ # => $dmzVal

						$u[] = $zbs->DAL->updateSetting($this->settingsDMZKey.'_'.$dmzKey, $this->settingsDMZ[$dmzKey]);	

					}

				return $u;
			
		}
		
		#} Load/Reload from db 
		function loadFromDB(){

			global $zbs;

				$this->settings = $zbs->DAL->getSettings(array('autoloadOnly' => true,'fullDetails' => false));				
				return $this->settings;

		}		
		
		#} Uninstall func - effectively creates a bk then removes its main setting
		function uninstall(){
			
			#} Set uninstall flag
			$this->settings['uninstall'] = time();
			
			#} Backup
			$this->createBackup('Pre-UnInstall Backup');
			
			#} Blank it out
			$this->settings = NULL;

				// DAL2 
				// leave for now
				return true;

		}
		
		#} Backup existing settings obj (ripped from sgv2.0)
		function createBackup($backupLabel=''){

			// Left this the same for DAL2 - is still storing backups in wp db
			
			$existingBK = get_option($this->settingsKey.'_bk'); if (!is_array($existingBK)) $existingBK = array();
			$existingBK[time()] = array(
				'main' => $this->settings,
				'dmzreg' => $this->settingsDMZRegister,
				'dmz' => $this->settingsDMZ
			);
			if (!empty($backupLabel)) $existingBK[time()]['backupLabel'] = sanitize_text_field($backupLabel); #} For named settings bk
			update_option($this->settingsKey.'_bk',$existingBK, false);
			return $existingBK[time()];
			
		}
		
		#} Kills all bks
		function killBackups(){
		
			return delete_option($this->settingsKey.'_bk');
			
		}
		
		#} Retrieve BKs
		function getBKs(){
			
			$x = get_option($this->settingsKey.'_bk');
			
			if (is_array($x)) return $x; else return array();
			
		}
		
		#} Reload from BK (bkkey will be a timestamp, use getBKs to list these keys)
		function reloadFromBK($bkkey){
		
			$backups = get_option($this->settingsKey.'_bk');
			
			if (isset($backups[$bkkey])) if (is_array($backups[$bkkey])) {
				
				#} kill existing settings and use backed up ones
				$this->settings = $backups[$bkkey];
				
				#} Save 
				$this->saveToDB();
			
				return true;	
				
			} 
			
			return false;
				
			
		}
	}


	#} This is a wrapper/factory class which simplifies using DMZ fields for extension plugins
	class WHWPConfigExtensionsLib {

		#} key holder
		private $extperma = false;
		private $settingsObj = false;
		private $existingSettings = false;

		#} Constructor
		function __construct($extperma='',$defaultConfig=array()) {

			if (!empty($extperma)){

				#} store 
				$this->extperma = 'ext_'.$extperma;

				#} initiate settings obj as a dmz set 
				// WH move to $zbs->settings 
				// ALSO now covered by // LEGACY SUPPORT (see ZeroBSCRM.php)
				global $zbs;

				if (isset($zbs->settings) && !empty($zbs->settings)){
				
					$existingSettings = $zbs->settings->dmzGetConfig($this->extperma);
				
				} else {
				
					// legacy - older plugins not using new init hooks
					// pass back empty for now (will break them)
					// and notify 
					$existingSettings = array();

					// notify
					// can't do directly, as this is PRE INIT (no logged in user)
					// so delay... zeroBSCRM_notifyme_insert_notification(get_current_user_id(),-999,-1,'extension.update');
					// weird this doesn't work either... day of it.add_action('before_zerobscrm_init', 'zeroBS_temp_ext_legacy_notice');
					// gonna do this grossly:
					if (!defined('ZBSTEMPLEGACYNOTICE')) define('ZBSTEMPLEGACYNOTICE',1);

					// this is a hotfix 2.50.1 to work with // LEGACY SUPPORT
					// ... it'll add the setting to a pile to be reconstructed post init :)
					global $zbsLegacySupport;
					$zbsLegacySupport['extsettingspostinit'][$this->extperma] = $defaultConfig;
				
				}	

				#} Create if not existing
				if (!is_array($existingSettings)){

					#} init
					$zbs->settings->dmzUpdateConfig($this->extperma,$defaultConfig);

				}

			} else exit('WHConfigLib initiated incorrectly.');

		}

		#} passthrough funcs

		function get($key){

			//global $zbs;
			//return $zeroBSCRM_Settings->dmzGet($this->extperma,$key);

			// WH move to $zbs->settings
			global $zbs;
			return $zbs->settings->dmzGet($this->extperma,$key);

		}

		function delete($key){

			//global $zbs;
			//return $zeroBSCRM_Settings->dmzDelete($this->extperma,$key);

			// WH move to $zbs->settings
			global $zbs;
			return $zbs->settings->dmzDelete($this->extperma,$key);


		}

		function update($key,$val=''){

			//global $zbs;
			//return $zeroBSCRM_Settings->dmzUpdate($this->extperma,$key,$val);

			// WH move to $zbs->settings
			global $zbs;
			return $zbs->settings->dmzUpdate($this->extperma,$key,$val);


		}

		function getAll(){

			//global $zbs;
			//return $zeroBSCRM_Settings->dmzGetConfig($this->extperma);

			// WH move to $zbs->settings
			global $zbs;
			return $zbs->settings->dmzGetConfig($this->extperma);

		}
	}


function zeroBS_temp_ext_legacy_notice(){

	// add one menu item, even if multiple ext.
	if (!defined('ZBSLEGACYSET')){
		$o = get_option('zbs_temp_legacy_update_msg');
		if ($o == false){
			zeroBSCRM_notifyme_insert_notification(get_current_user_id(),-999,-1,'extension.update');
			update_option('zbs_temp_legacy_update_msg',1, false);
		}
		define('ZBSLEGACYSET',1);
	}
}	
