<script type="text/javascript">
    var subtotal_msg = "{l s='I agree to the terms of service and will adhere to them unconditionally.' mod='supercheckout'}";
    var mandatory_tos = {$mandatoryTOS};
    
    document.addEventListener("DOMContentLoaded", function(event) { 
        $(document).ready(function() {
					$(".various").fancybox({
						 scrolling: 'auto',
						width: '65%',
						height: '60%',
						fitToView: false,
						autoSize: false,
						'type': 'ajax',
						'ajax': {
						    dataFilter: function(data) {
							return $(data).find('section#main')[0];
						}
					    }
					});
				});
        /* 
         * As Modified id for the terms and conditions div according to the default checkout page we need to modify the selector for the same
         * @modifier Ashish Kumar
         * @date 09-05-2024
         * AKMay2024 stripe-checkout-compatible
        */
        $('#conditions-to-approve a').addClass('iframe various fancybox.ajax');
    });


</script>
{if !$is_virtual_cart}
    {*start by dharmanshu for 1-11-2021 for the recycle option issue fix *}
    {if $recyclablePackAllowed}
        <div id="supercheckout_recyclepack_container" class='order-shipping-extra checkbox' style="padding-bottom: 0 !important;">
            <input type="checkbox" name="recyclable" class="supercheckout-delivery-extra" id="recyclable" value="1" {if $recyclable == 1}checked="checked"{/if} />                        
            <label> {l s='I would like to receive my order in recycled packaging.' mod='supercheckout'}</label>             
        </div>
    {/if}
    {*end by dharmanshu for 1-11-2021 for the recycle option issue fix *}
    {if $gift.allowed}

        <div id="supercheckout-gift_container" class='order-shipping-extra checkbox' style="padding-bottom: 0 !important;">
            <input type="checkbox" class="supercheckout-delivery-extra" name="gift" id="gift" value="1" {if $gift.isGift == 1}checked="checked"{/if} />                        
            <label>  {$gift.label nofilter}{*escape not required as contains html*}</label>
        </div>
        {if isset($settings['confirm']['gift_message'][$user_type]['display']) && ($settings['confirm']['gift_message'][$user_type]['display'] eq 1)}
            <div id="supercheckout-gift_kb_message_container" class='order-shipping-extra checkbox' style="padding-bottom: 0 !important;{if $gift.isGift != 1}display:none;{/if}">
                <input type="checkbox" class="supercheckout-delivery-extra" name="kb_message_gift" id="kb_message_gift" {if $is_kb_gift_msg_already_added == 1}checked="checked"{/if} value="0"/>                        
                <label>    {l s='Add a gift message' mod='supercheckout'}{*escape not required as contains html*}<span id='edit_kb_gift_message' {if $is_kb_gift_msg_already_added == 1}{else} style="display:none;"{/if}>
                    <a href="javascript:void(0)" onclick="showGiftMessagePopup()">{l s='Edit' mod='supercheckout'}</a>
                </span> </label>
                
            </div>
        {else}
            {* below div commented by rishabh jain *}
            <div id="supercheckout-gift-comments" style="display:{if $gift.isGift == 1}block{else}none{/if}; margin-top: 0; margin-bottom: 15px;">
                <b>{l s='If you would like, you can add a note to the gift' mod='supercheckout'}:</b>
                <textarea id="gift_message" name="gift_comment" rows="8" >{$gift.message}</textarea>
            </div>

        {/if}
        {* changes by rishabh jain *}

        {if isset($settings['confirm']['gift_message'][$user_type]['display']) && ($settings['confirm']['gift_message'][$user_type]['display'] eq 1)}
{*
* Start Changes to fix the issue with the dialog() because of jQuery
* Commenting out #divKbgiftMessage code and adding #popup1 code
* NANov2023 dialog_jquery
* @date 20-11-2023
* @modifier Nikhil Aggarwal
*}
<script type="text/javascript" src="{$notifications_gritter_url}?b=1.0.1"></script>

<div id="popup1" class="overlay">
    <div class="popup">
        <a class="close" href="#">&times;</a>
        <div class="content">
            <div id="divKbgiftMessage" title="{l s='Add/Edit gift Message details' mod='supercheckout'}" class="supercheckout-threecolumns divkbmobilelogin">
            {* Changes end by Nikhil *}
                {*                <div class="velsof_sc_overlay" style="display: block;"></div>*}
                <div id="gift_message_update_warning" class="supercheckout-checkout-content"></div>
                <div class="supercheckout-extra-wrap">
                    <label>
                        {l s='From' mod='supercheckout'}<span class="supercheckout-required">*</span><br></label>
                    <input type="text" style="width: 100%;" id="supercheckout_gift_sender" name="supercheckout_gift_receiver" value="{$sender}" class="supercheckout-large-field form-control">
                    <span id="kb_gift_sender_error"  style="display:none;" class="errorsmall supercheckout-required">{l s='Required Field' mod='supercheckout'}</span>
                </div>
                <div class="supercheckout-extra-wrap">
                    <label>
                        {l s='To' mod='supercheckout'}<span class="supercheckout-required">*</span><br></label>
                    <input type="text" style="width: 100%;" id="supercheckout_gift_receiver" name="supercheckout_gift_receiver" value="{$receiver}" class="supercheckout-large-field form-control">
                    <span id="kb_gift_receiver_error" style="display:none;" class="errorsmall supercheckout-required">{l s='Required Field' mod='supercheckout'}</span>
                </div>
                <div class="supercheckout-extra-wrap">
                    <label>
                        {l s='Message' mod='supercheckout'}<span class="supercheckout-required">*</span><br></label>
                    <textarea id="supercheckout_gift_message" style="width: 100%;" name="supercheckout_gift_message" rows="8" class="form-control" >{$kb_gift_msg}</textarea>
                    <span id="kb_gift_msg_error" style="display:none;" class="errorsmall supercheckout-required">{l s='Required Field' mod='supercheckout'}</span>
                </div>
                <div class="supercheckout-extra-wrap">
                    <input id="kb_gift_message_submit" type="button" onclick="updateKbGiftMessage();" class="orangebuttonapply btn btn-success" value="{if $kb_gift_msg != ''} {l s='Update' mod='supercheckout'} {else} {l s='Add ' mod='supercheckout'}{/if}">
            </div>
            </div>
                </div>
    </div>
</div>
        {/if} 

        {* changes over *}
    {/if}
{/if}
{if $show_TOS && count($conditions_to_approve) > 0}
    {* GDPR Change*}
    <input type="hidden" value="{l s='I agree to the terms of service and will adhere to them unconditionally. ' mod='supercheckout'}" name="supercheckout_default_policy" />
    {* GDPR Change*}
    {* Modified id and added a class for the terms and conditions div according to the default checkout page
     * @modifier Ashish Kumar
     * @date 09-05-2024
     * AKMay2024 stripe-checkout-compatible
    *}
    <div id="conditions-to-approve" class="js-conditions-to-approve">
        {foreach from=$conditions_to_approve item="condition" key="condition_name"}
            <div class="checkbox">
                <input id="conditions_to_approve[{$condition_name}]" type="checkbox" name="conditions_to_approve[{$condition_name}]" value="1" {if $checkedTOS} checked {/if} />
                <label for="conditions_to_approve[{$condition_name}]">

                    {$condition nofilter}{*escape not required as contains html*}
                </label>
            </div>
        {/foreach}
    </div>
{else}
    <div id="conditions-to-approve" class="js-conditions-to-approve" style="display:none">
        {foreach from=$conditions_to_approve item="condition" key="condition_name"}
            <div class="checkbox">
                <input id="conditions_to_approve[{$condition_name}]" type="checkbox" name="conditions_to_approve[{$condition_name}]" value="1" checked />
            </div>
        {/foreach}
    </div>
{/if}
{* GDPR Change*}
{hook h='customSuperCheckoutGDPRHook'}
{* GDPR Change*}
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

{*
* Start Changes to fix the issue with the dialog() because of jQuery
* Commenting out #divKbgiftMessage code and adding #popup1 code
* NANov2023 dialog_jquery
* @date 20-11-2023
* @modifier Nikhil Aggarwal
*}
<style>
#popup1 .box {
  width: 40%;
  margin: 0 auto;
  background: rgba(255,255,255,0.2);
  padding: 35px;
  border: 2px solid #fff;
  border-radius: 20px/50px;
  background-clip: padding-box;
  text-align: center;
}



#popup1.overlay {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  transition: opacity 500ms;
  visibility: hidden;
  opacity: 0;
  z-index:20000;
}
#popup1.overlay:target {
  visibility: visible;
  opacity: 1;
}

#popup1 .popup {
  margin: 70px auto;
  padding: 20px;
  background: #fff;
  border-radius: 5px;
  width: 30%;
  position: relative;
  transition: all 5s ease-in-out;
}

#popup1 .popup h2 {
  margin-top: 0;
  color: #333;
  font-family: Tahoma, Arial, sans-serif;
}
#popup1 .popup .close {
  position: absolute;
  top: 20px;
  right: 30px;
  transition: all 200ms;
  font-size: 30px;
  font-weight: bold;
  text-decoration: none;
  color: #333;
}
#popup1 .popup .close:hover {
  color: #06D85F;
}
#popup1 .popup .content {
  max-height: 30%;
  overflow: auto;
}

@media screen and (max-width: 700px){
  #popup1 .popup{
    width: 70%;
  }
}
</style>
{* Changes end by Nikhil *}