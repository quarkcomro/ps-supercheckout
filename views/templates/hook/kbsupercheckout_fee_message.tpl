{*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer tohttp://www.prestashop.com for more information.
* We offer the best and most useful modules PrestaShop and modifications for your online store.
*
* @category  PrestaShop Module
* @author    knowband.com <support@knowband.com>
* @copyright 2017 Knowband
* @license   see file: LICENSE.txt
*
*}
{* Start Changes to add the Payment Fee on Checkout
* This file shows the additional fee of the payment method in the order confirmation email
* @date 15-10-2024
* NAOct2024 payment_fee
* @modifier Nikhil Aggarwal 
*}
<style>
    .kb_confirmation_block_mainblock{
        margin-left: 30px;
        margin-top: 15px;
        margin-bottom: 10px;
    }
</style>
    <div class="kb_confirmation_block_mainblock">
        <p>
        <span id="amount" class="price"><b></span>
        <br/><br />
        {l s='Additional fee added for using the payment method is' mod='supercheckout'}
        <span id="amount" class="price"><b>{$fee|escape:'htmlall':'UTF-8'}</b></span>
	</p>
</div>
{* Changes end by Nikhil *}