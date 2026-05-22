<?php
/**
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future.If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
* We offer the best and most useful modules PrestaShop and modifications for your online store. 
*
* @author    Drew McLellan <drew.mclellan@gmail.com>
* @copyright 2018 Knowband
* @license   see file: LICENSE.txt
* @category  PrestaShop Module
*/
namespace DrewM\MailChimp;
class Webhook
{
	private static $eventSubscriptions = array();
	private static $receivedWebhook    = null;

	/**
	 * Subscribe to an incoming webhook request. The callback will be invoked when a matching webhook is received.
	 * @param string $event Name of the webhook event, e.g. subscribe, unsubscribe, campaign
	 * @param callable $callback A callable function to invoke with the data from the received webhook
     * @return void
	 */
	public static function subscribe($event, callable $callback)
	{
		if (!isset(self::$eventSubscriptions[$event])) self::$eventSubscriptions[$event] = array();
		self::$eventSubscriptions[$event][] = $callback;

		self::receive();
	}

	/**
	 * Retrieve the incoming webhook request as sent.
	 * @param string $input An optional raw POST body to use instead of php://input - mainly for unit testing.
     * @return array|false 	An associative array containing the details of the received webhook
	 */
	public static function receive($input = null)
	{
		if (is_null($input)) {
			if (self::$receivedWebhook !== null) {
				$input = self::$receivedWebhook;
			} else {
				$input = file_get_contents("php://input");
			}
		}

		if (!is_null($input) && $input != '') {
			return self::processWebhook($input);
		}	
		
		return false;
	}

	/**
	 * Process the raw request into a PHP array and dispatch any matching subscription callbacks
	 * @param string $input The raw HTTP POST request
	 * @return array|false 	An associative array containing the details of the received webhook
	 */
	private static function processWebhook($input) 
	{	
		self::$receivedWebhook = $input;
		parse_str($input, $result);
		if ($result && isset($result['type'])) {
			self::dispatchWebhookEvent($result['type'], $result['data']);
			return $result;
		}
	
		return false;
	}

	/**
	 * Call any subscribed callbacks for this event
	 * @param string $event The name of the callback event
	 * @param array $data An associative array of the webhook data
	 * @return void
	 */
	private static function dispatchWebhookEvent($event, $data)
	{
		if (isset(self::$eventSubscriptions[$event])) {
			foreach(self::$eventSubscriptions[$event] as $callback) {
				$callback($data);
			}
			// reset subscriptions
			self::$eventSubscriptions[$event] = array();
		}
	}
}
