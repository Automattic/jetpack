<?php

use WHMCS\Database\Capsule;


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

if (!defined("WHMCS")) {
    die("This file cannot be accessed directly");
}

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

    validate_required_fields($params);
    $access_token = get_access_token($params);
    $response = provision_jetpack_plan($access_token, $params);

    if (isset($response->next_url)) {
        save_next_url($response->next_url, $params);
    }

    if ($response->success == true) {
        return 'success';
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
    $access_token = get_access_token($params);
    $clean_url = str_replace('/', '::', $params['customfields']['siteurl']);
    $url = 'https://public-api.wordpress.com/rest/v1.3/jpphp/' . $clean_url .'/partner-cancel';
    $response = make_api_request($url, $access_token);
    if ($response->success == true) {
        return 'success';
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
        'scope' => 'jetpack-partner',
    );

    $response = make_api_request($oauthURL, null, $credentials);
    if (isset($response->access_token)) {
        return $response->access_token;
    }
}


/**
 * Provision a Jetpack Plan
 *
 * @param $access_token
 * @param $params
 * @return mixed
 * @throws Exception
 */
function provision_jetpack_plan($access_token, $params)
{
    $provisioning_url = "https://public-api.wordpress.com/rest/v1.3/jpphp/provision";
    $request_data = array (
        'plan' => $params['customfields']['plan'],
        'siteurl' => $params['customfields']['siteurl'],
        'local_user' => $params['customfields']['local_user'],
        'force_register' => true,
    );

    return make_api_request($provisioning_url, $access_token, $request_data);
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
function make_api_request($url, $auth='', $data=[])
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
    if (curl_error($curl)) {
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
function save_next_url($url, $params)
{
    $jetpack_next_url_field = Capsule::table('tblcustomfields')
        ->where(array('fieldname' => 'jetpack_next_url', 'type' => 'product'))->first();

    Capsule::table('tblcustomfieldsvalues')->insert(array(
        'fieldid' => $jetpack_next_url_field->id, 'relid' => $params['model']['orderId'], 'value' => $url));
}

/**
 * Validate that the fields required to provision a Jetpack plan are present
 * and valid for those that can be verified
 *
 * @param array $params
 * @return bool
 */
function validate_required_fields(array $params)
{
    $allowed_plans = array('free', 'personal', 'premium', 'professional');

    if (!isset($params['customfields']['plan']) || !isset($params['customfields']['siteurl'])
        || isset($params['customfields']['local_user'])) {

        return false;
    }

    if (!in_array($params['customfields']['plan'], $allowed_plans)) {
        return false;
    }
}

