{* Start Changes to add the Payment Fee on Checkout
* This file shows the additional fee of the payment method in the order details at front
* @date 15-10-2024
* NAOct2024 payment_fee
* @modifier Nikhil Aggarwal 
*}
<div class="panel box hidden-sm-down">
    <div class="panel-heading">
        <i class="icon-random"></i>
        <span><b>  {l s='Knowband Supercheckout' mod='supercheckout'}</b></span>
    </div>
    <div>
        <table class="table table-bordered">
            <thead>
                <tr>
                     <th><span class="title_box ">{l s='Payment Method Fee' mod='supercheckout'}</span></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        {$fee|escape:'htmlall':'UTF-8'}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
{* Changes end by Nikhil *}             
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