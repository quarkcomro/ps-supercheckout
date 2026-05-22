<?php
/**
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to http://www.prestashop.com for more information.
 * We offer the best and most useful modules PrestaShop and modifications for your online store.
 *
 * @author    knowband.com <support@knowband.com>
 * @copyright 2017 Knowband
 * @license   see file: LICENSE.txt
 * @category  PrestaShop Module
 *
 *
*/
if (!defined('_PS_VERSION_')) {
    exit;
}
/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of MailChimp
 *
 * @author Administrator
 */
class KbMailChimp
{
    private $api_key;
    private $api_endpoint = 'https://<dc>.api.mailchimp.com/3.0';
    private $verify_ssl   = false;

    /**
     * Create a new instance
     * @param string $api_key Your MailChimp API key
     */
    public function __construct($api_key)
    {
        $this->api_key = $api_key;
        list(, $datacentre) = explode('-', $this->api_key.'-');
        $this->api_endpoint = str_replace('<dc>', $datacentre, $this->api_endpoint);
    }

    /**
     * Call an API method. Every request needs the API key, so that is added automatically -- you don't need to pass it in.
     * @param  string $method The API method to call, e.g. 'lists/list'
     * @param  array  $args   An array of arguments to pass to the method. Will be json-encoded for you.
     * @return array          Associative array of json decoded API response.
     */
    public function call($method, $args=array())
    {
        return $this->makeRequest($method, $args);
    }

    /**
     * Performs the underlying HTTP request. Not very exciting
     * @param  string $method The API method to be called
     * @param  array  $args   Assoc array of parameters to be passed
     * @return array          Assoc array of decoded result
     */
    private function makeRequest($method, $args=array())
    {
        // $args['apikey'] = $this->api_key;

        $url = $this->api_endpoint.'/'.$method;

        if (function_exists('curl_init') && function_exists('curl_setopt')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Accept: application/vnd.api+json',
                'Content-Type: application/vnd.api+json',
                'Authorization: apikey ' . $this->api_key
            ));
            // curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
            curl_setopt($ch, CURLOPT_USERAGENT, 'PHP-MCAPI/3.0');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            // curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $this->verify_ssl);
            // curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($args));
            $query = http_build_query($args, '', '&');
            curl_setopt($ch, CURLOPT_URL, $url . '?' . $query);
            $result = curl_exec($ch);
            curl_close($ch);
        } else {
            $json_data = json_encode($args);
            $result    = file_get_contents($url, null, stream_context_create(array(
                'http' => array(
                    'protocol_version' => 1.1,
                    'user_agent'       => 'PHP-MCAPI/2.0',
                    'method'           => 'POST',
                    'header'           => "Content-type: application/json\r\n".
                                          "Connection: close\r\n" .
                                          "Content-length: " . strlen($json_data) . "\r\n",
                    'content'          => $json_data,
                ),
            )));
        }

        return $result ? json_decode($result, true) : false;
    }
}
