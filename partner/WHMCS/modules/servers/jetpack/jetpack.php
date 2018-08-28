<?php

use WHMCS\Database\Capsule;


if (!defined("WHMCS")) {
    die("This file cannot be accessed directly");
}


/**
 * A WHMCS module for use by Jetpack hosting partners to provision Jetpack plans.
 * The module provides functionality for partner hosts to be able to save their
 * client id and secret to request an access token for provisioning plans.
 *
 * Plans available for provisioning include free, personal, premium and professional
 *
 * A host has options to either provision(Create == WHMCS equivalent functional term)
 * or Cancel(Terminate == WHMCS equivalent functional term) from the WHMCS client area.
 *
 * Host setup for custom fields is currently required in order to use the module.
 *
 */

/**
 * Jetpack Meta Data for WHMCS module.
 * @return array
 */
function jetpack_MetaData()
{
    return array(
        'DisplayName' => 'Jetpack by Automattic',
        'Description' => 'Use this module to provision Jetpack plans with your Jetpack hosting partner account',
        'APIVersion' => '1.1',
        'RequiresServer' => false,
    );
}


/**
 * Basic configuration options required for a partner to get
 * a Jetpack plan provisioned. Currently a partner client id
 * and secret are the only host partner options needed to get
 * an access token to provision a Jetpack plan
 * @return array
 */
function jetpack_ConfigOptions()
{
    return array(
        'Jetpack Partner Client ID' => array(
            'Type' => 'text',
            'Size' => '256',
        ),
        'Jetpack Partner Client Secret' => array(
            'Type' => 'text',
            'Size' => '256',
        )
    );
}


/**
 * Equivalent to /provision. Create a Jetpack plan using
 * a Jetpack Hosting partner account.
 *
 *
 * @param array $params
 * @return string 'success'
 * @throws Exception

 */
function jetpack_CreateAccount(array $params)
{

    $validation_status = validate_required_fields($params);
    if ($validation_status !== true) {
        return $validation_status;
    }

    try {
        $access_token = get_access_token($params);
        $provisioning_url = "https://public-api.wordpress.com/rest/v1.3/jpphp/provision";
        $stripped_url = preg_replace("(^https?://)", "", $params['customfields']['Site URL']);

        $request_data = array (
            'plan' => strtolower($params['customfields']['Plan']),
            'siteurl' => $stripped_url,
            'local_user' => $params['customfields']['Local User'],
            'force_register' => true,
        );

        $response = make_api_request($provisioning_url, $access_token, $request_data);
        if ($response->success && $response->success == true) {
            if ($response->next_url) {
                save_provisioning_details($response->next_url, $params);
            } elseif (!$response->next_url && $response->auth_required) {
                save_provisioning_details($response->next_url, $params, true);
            }

            return 'success';
        } else {
            return $response;
        }
    } catch (Exception $e) {
        logModuleCall('jetpack', __FUNCTION__, $params, $e->getMessage(), $e->getTraceAsString());
        return $e->getMessage();
    }
}

/**
 * Equivalent to partner/cancel. Cancel a Jetpack plan using
 * using a Jetpack Hosting partner account.
 *
 * @param array $params
 * @return string
 * @throws Exception
 */
function jetpack_TerminateAccount(array $params)
{
    $validation_status = validate_required_fields($params);
    if ($validation_status !== true) {
        return $validation_status;
    }

    try {
        $access_token = get_access_token($params);
        $stripped_url = preg_replace("(^https?://)", "", $params['customfields']['Site URL']);
        $clean_url = str_replace('/', '::', $stripped_url);

        $request_url = 'https://public-api.wordpress.com/rest/v1.3/jpphp/' . $clean_url . '/partner-cancel';
        $response = make_api_request($request_url, $access_token);
        if ($response->success === true) {
            return 'success';
        } elseif ($response->success === false) {
            return 'JETPACK MODULE: Unable to terminate this Jetpack plan as it has likely already been cancelled';
        }
    } catch (Exception $e) {
        logModuleCall('jetpack', __FUNCTION__, $params, $e->getMessage(), $e->getTraceAsString());
        return $e->getMessage();
    }
}

/**
 * Get a Jetpack partner access token using the client_id
 * and client secret stored when the product was created in
 * the WHMCS product settings.
 *
 *
 * @param $params
 * @return mixed
 * @throws Exception
 */
function get_access_token($params)
{

    $oauthURL = "https://public-api.wordpress.com/oauth2/token";

    $credentials = array (
        'client_id' => $params['configoption1'],
        'client_secret' => $params['configoption2'],
        'grant_type' => 'client_credentials',
        'scope' => 'jetpack-partner'
    );

    $response = make_api_request($oauthURL, null, $credentials);
    if (isset($response->access_token)) {
        return $response->access_token;
    } else {
        return $response;
    }
}


/**
 * Make an API request for authenticating and provisioning or
 * cancelling a Jetpack plan
 *
 * @param $url
 * @param $data
 * @param string $auth
 * @return mixed
 * @throws Exception
 */
function make_api_request($url, $auth = null, $data = null)
{
    if (isset($auth)) {
        $auth = "Authorization: Bearer " . $auth;
    }

    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_HTTPHEADER => array($auth),
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => "",
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_POSTFIELDS => $data,
        CURLOPT_CUSTOMREQUEST => "POST"
    ));

    $response = curl_exec($curl);
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);

    if ($response && $http_code >= 400) {
        if ($data['client_id']) {
            //If client_id is set in the data array when this function was called then we are trying to get an access
            // token and are unsuccessful which likely means the client id or client secret are not valid.
            return 'JETPACK MODULE: There was a problem getting an access token for your Jetpack hosting partner 
            account. This usually means the Client Id or Client Secret provided when creating the product are invalid';
        } elseif ($data['siteurl']) {
            //If the siteurl is set in the data array we are attempting to provision a plan. There are few errors that
            //could show up here but its likely the user did not enter siteurl or local_user field correctly.
            return 'JETPACK MODULE: There was a problem provisioning a Jetpack Plan for ' . $data['siteurl'] . '. The 
            response from the request was ' . $response . '. This usually means the url provided does not have a valid 
            WordPress installation or the local_user field provided for provisioning is not valid.';
        }
        return 'JETPACK MODULE: There was a problem with provisioning or terminating a Jetpack Plan. 
        The response was ' . $response;
    } elseif (curl_error($curl)) {
        throw new Exception('Unable to connect: ' . curl_errno($curl) . ' - ' . curl_error($curl));
    } elseif (empty($response)) {
        throw new Exception('Empty response');
    }

    curl_close($curl);
    return json_decode($response);
}

/**
 * Save the next_url for Jetpack activation/setup to the
 * order for the client
 *
 * @param $url
 * @param $orderId
 */
function save_provisioning_details($url, $params, $pending = false)
{
    $jetpack_next_url_field = Capsule::table('tblcustomfields')
        ->where(array('fieldname' => 'jetpack_provisioning_details', 'type' => 'product'))->first();

    $details = '';
    if ($url) {
        $details = 'URL to Activate Jetpack: ' . $url;
    } elseif ($pending) {
        $details = 'The domain did not appear to resolve when provisioning was attempted however a Jetpack plan is 
        waiting for ' . $params['customfields']['Site URL'] . '. Once DNS resolves please connect the site via 
        the Jetpack Banner in the sites dashboard';
    }
    Capsule::table('tblcustomfieldsvalues')->where(array('fieldid' => $jetpack_next_url_field->id))->update(array(
        'relid' => $params['model']['orderId'], 'value' => $details));
}

/**
 * Validate that the module was correctly set up when the product was
 * created by the WHMCS user and that the required Fields/Options for
 * being able to provision a Jetpack plan are present. Fields validated are
 *  - Allowed Plans from Plan Custom Field
 *  - Required Custom Fields
 *  - Required Config Options
 *
 * @param array $params
 * @return bool
 */
function validate_required_fields(array $params)
{
    $allowed_plans = array('free', 'personal', 'premium', 'professional');
    $required_custom_fields = array('Plan', 'Site URL', 'Local User', 'jetpack_provisioning_details');

    foreach ($required_custom_fields as $field) {
        if (!isset($params['customfields'][$field])) {
            return 'JETPACK MODULE: The module does not appear to be setup correctly. The required custom field '
                . $field . ' was not setup when the product was created.
				Please see the module documentation for more information';
        }
    }

    if (!in_array(strtolower($params['customfields']['Plan']), $allowed_plans)) {
        return 'JETPACK MODULE: The module does not appear to be setup correctly. ' .
            $params['customfields']['Plan'] . ' is not an allowed plan';
    }

    if (!isset($params['configoption1']) || !isset($params['configoption2'])) {
        return'JETPACK MODULE: Your credentials for provisioning are not complete. Please see the module documentation
        for more information';
    }

    return true;
}
