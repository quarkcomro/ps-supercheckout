{if isset($settings['hide_ship_pay']) && $settings['hide_ship_pay'] eq 1 && $address_selector == 'new'}
    <span class="permanent-warning" style="display: inline-block;">{l s='Please choose your shipping address first in order to check the payment methods.' mod='supercheckout'}</span>
{else}
    <div class="velsof_sc_overlay"></div>
    {if isset($payment_method_not_required)}
        <div class='supercheckout-checkout-content' style='display:block'>
            <div class='permanent-warning not-required-msg'>{l s='No payment method required.' mod='supercheckout'}</div>
        </div>
        {**
        * Start Changes to fix the issue of payment_methods index not being set
        * Adding isset condition
        * NAOct2023 payment_methods
        * @date 06-10-2023
        * @modifier Nikhil Aggarwal
        */
        *}
    {elseif !isset($payment_methods) || count($payment_methods) == 0}
        {* Changes end by Nikhil*}
        <div class='supercheckout-checkout-content' style='display:block'>
            <div class='permanent-warning not-required-msg'>{l s='No payment method is available.' mod='supercheckout'}</div>
        </div>
    {else}
        {*
         * Modified the payment methods to be shown as the default checkout(li format). input class is also modified from payment_methods to payment_option
         * @modifier Pragya Maurya
         * @date 09-05-2024
         * AKMay2024 stripe-checkout-compatible
        *}
        <div class="payment-options">
            {foreach from=$payment_methods item="option"}
                <div class="payment-option-item">
                    <div id="{$option.id}-container" class="payment-option clearfix">{*Variable contains dynamic value, escaping not requied*}
                        <div class="radio">
                      
                            <input type="radio" class="ps-shown-by-js " name="payment-option" id="{$option.id}" style="height: auto" data-module-name="{$option.module_name nofilter}{*escape not required as contains html*}" value="{$option.id}" id="{$option.id}" {if $option.module_name neq "stripe_official"} {if $option.id_module == $selected_payment_method}checked="checked" {elseif $option.id == $selected_payment_method} checked="checked" {/if} {/if} class="{if $option.binary}binary{/if}"/>{*Variable contains dynamic value, escaping not requied*}
                        
                            <label id="payment_lbl_{$option.id_module|intval}" for="{$option.id}">
                                {if $display_payment_style neq 0}
                                    {if $option.payment_image_url neq ''}
                                        <img src='{$option.payment_image_url}' alt='{$option.call_to_action_text}' {if isset($option.width) && $option.width !="" && $option.width !="auto"}width='{$option.width}'{else} width="50"{/if} {if isset($option.height) && $option.height !="" && $option.height !="auto"}height='{$option.height}'{/if}/>{if $display_payment_style neq 2}{/if}{*Variable contains dynamic value, escaping not requied*}
                                    {* Start Code Added By Priyanshu on 3-June-2020 to fix the Payment method logo issue*}
                                    {else if $option.logo neq '' }
                                        <img src='{$option.logo}' alt='{$option.call_to_action_text}' {if isset($option.width) && $option.width !="" && $option.width !="auto"}width='{$option.width}'{else} width="50"{/if} {if isset($option.height) && $option.height !="" && $option.height !="auto"}height='{$option.height}'{/if}/>{if $display_payment_style neq 2}{/if}{*Variable contains dynamic value, escaping not requied*}
                                    {* End of Code Added By Priyanshu on 3-June-2020 to fix the Payment method logo issue*}
                                    {/if}
                                {/if}
                                {if $display_payment_style neq 2}
                                    {$option.call_to_action_text}{*Variable contains dynamic value, escaping not requied*}
                                {/if}
                            </label>
                        </div>

                      
                        <form method="GET" class="ps-hidden-by-js" style="display: none">
                            <button class="ps-hidden-by-js" type="submit" name="select_payment_option" value="{$option.id}"></button>{*Variable contains dynamic value, escaping not requied*}
                        </form>
                    </div>
                </div>

                {* 
                * changes added as the payment works on the default checkout, Modified the additional information to reneder as the same works on the default checkout page
                * @modifier Ashish Kumar
                * @date 09-05-2024
                * AKMay2024 stripe-checkout-compatible
                *}
                <div id="{$option.id}-additional-information" class="js-additional-information definition-list additional-information ps-hidden" style="display:none;">{*Variable contains dynamic value, escaping not requied*}
                    {$option.additionalInformation nofilter}{*escape not required as contains html*}
                </div>

                <div id="pay-with-{$option.id}-form" class="js-payment-option-form  ps-hidden" style="display:none">{*Variable contains dynamic value, escaping not requied*}
                    {if $option.form}
                        {$option.form nofilter}{*escape not required as contains html*}
                    {else}
                        <form id="payment-{$option.id}-form" method="POST" action="{$option.action nofilter}{*escape not required as contains url*}">
                        {foreach from=$option.inputs item=input}
                            <input type="{$input.type}" name="{$input.name}" value="{$input.value}">{*Variable contains dynamic value, escaping not requied*}
                        {/foreach}
                        <button style="display:none" id="pay-with-{$option.id}" type="submit"></button>{*Variable contains dynamic value, escaping not requied*}
                        </form>
                    {/if}
                   {* Start Changes to add the Payment Fee on Checkout
                    * Adding the fields for the Payment fee
                    * @date 15-10-2024
                    * NAOct2024 payment_fee
                    * @modifier Nikhil Aggarwal 
                    *}
                    <input type="hidden" name="kb_payment_fee_{$option.id}" id="kb_payment_fee_{$option.id}" value="{$option.paymentfee.applicable_fee}">{*Variable contains dynamic value, escaping not requied*}
                    <input type="hidden" name="kb_payment_fee_status_{$option.id}" id="kb_payment_fee_status_{$option.id}" value="{$option.paymentfee.status}">{*Variable contains dynamic value, escaping not requied*}
                    <input type="hidden" name="kb_payment_fee_total_{$option.id}" id="kb_payment_fee_total_{$option.id}" value="{$option.paymentfee.paymentfee_total}">{*Variable contains dynamic value, escaping not requied*}
                    <input type="hidden" name="kb_payment_fee_text_{$option.id}" id="kb_payment_fee_text_{$option.id}" value="{$option.paymentfee.paymentfee_title}">{*Variable contains dynamic value, escaping not requied*}
                    <input type="hidden" name="kb_payment_fee_applicable_{$option.id}" id="kb_payment_fee_applicable_{$option.id}" value="{$option.paymentfee.paymentfee_applicable}">{*Variable contains dynamic value, escaping not requied*}
                    {* Changes end by Nikhil *}
                </div>
                
            {/foreach}
            <input type="hidden" name="kb_payment_fee_currency" id="kb_payment_fee_currency" value="{$kb_payment_fee_currency}">{*Variable contains dynamic value, escaping not requied*}    
        </div>
            
        <div id="payment-confirmation" style="display: none">
            <div class="ps-shown-by-js"> 
                <button type="submit" class="btn btn-primary center-block"> {l s='PASSER LA COMMANDE' mod='supercheckout'} </button>
            </div>
            <div class="ps-hidden-by-js"></div>
        </div>

        <div id="payment_methods_binaries" style="display:none;">
            {hook h='displayPaymentByBinaries'}
        </div>
    {/if}
{/if}
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
* @copyright 2016 Knowband
*} 