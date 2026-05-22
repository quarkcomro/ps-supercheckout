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
*}
<div class="modal-dialog" style="width:50%">

    <div class="modal-content">
        <div class="modal-header">
            <span class="font_popup_header">{l s='Edit Customer Profile' mod='supercheckout'}</span>
            <button type="button" class="close" onclick="closeModalPopup('modal_edit_customer_profile_form')"><span aria-hidden="true">×</span><span class="sr-only">{l s='Close' mod='supercheckout'}</span></button>
        </div>
        <div class="modal-body" style="padding-bottom:0;">
            <div class="row">
                <div class="span" style="margin-left:0; width:100%;">
                    <div id="modal_incentive_form_process_status" class="modal_process_status_blk alert" style="display:none;"></div>
                </div>
            </div>
            <input type="hidden" value="{$profile_data['id_profile']}" name="edit_customer_profiles[id_profile]" id="edit_customer_profiles[id_profile]" />
            <div style="overflow-y:auto !important;">
                <table class="list form" style="width:100%">
                    <tbody id="custom_table_tbody">

                        <tr>
                            <td style="width: 50%; position: inherit; text-align: center;"><span class="control-label">{l s='Active' mod='supercheckout'}</span>
                                <i class="icon-question-sign tooltip_color" data-toggle="tooltip" data-placement="top" data-original-title="{l s='Set the field as active or inactive.' mod='supercheckout'}"></i>
                            </td>
                            <td class="supercheckout_popup_form_field">
                                <div class="form-group">
                                    <div class="col-lg-9">
                                        <span class="switch prestashop-switch fixed-width-lg">
                                            <input type="radio" name="edit_customer_profiles[active]" id="edit_customer_profiles[active]_on" value="1" {if $profile_data['active'] eq "1"}checked="checked"{/if}>
                                            <label for="edit_customer_profiles[active]_on">{l s='Yes' mod='supercheckout'}</label>
                                            <input type="radio" name="edit_customer_profiles[active]" id="edit_customer_profiles[active]_off" value="0" {if $profile_data['active'] eq "0"}checked="checked"{/if}>
                                            <label for="edit_customer_profiles[active]_off">{l s='No' mod='supercheckout'}</label>
                                            <a class="slide-button btn"></a>
                                        </span>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        <tr class="supercheckout_custom_field_form_fields">
                            <td style="text-align: center;"><span class="control-label">{l s='Profile Name' mod='supercheckout'}</span>
                                <i class="icon-question-sign tooltip_color" data-toggle="tooltip" data-placement="top" data-original-title="{l s='Name of the customer profile.' mod='supercheckout'}"></i>
                            </td>
                            <td class="supercheckout_popup_form_field">
                                <div class="span">
                                    <span class='float_left margin_right_20'>
                                        {foreach $languages as $language}
                                            <input class="required_entry supercheckout_edit_customer_profiles {if $language_current neq $language['id_lang']}hidden_custom{/if}" type="text" id='edit_customer_profiles_language_{$language['id_lang']}' name="edit_customer_profiles[field_label][{$language['id_lang']}]" value="{$profile_data['field_label'][{$language['id_lang']}]}">
                                        {/foreach}
                                    </span>
                                    <span class='float_left'>
                                        <select class="width_small" name="languages" onchange="changeLanguageBox(this, 'edit_customer_profiles')">
                                            {foreach $languages as $language}
                                                <option value="{$language['id_lang']}" {if $language_current eq $language['id_lang']}selected{/if}>{$language['language_code']}</option>
                                            {/foreach}
                                        </select>
                                    </span>
                                    <span id="error_message_edit_profile_name" class="error_message new_line hidden_custom">Error!</span>
                                </div>
                            </td>
                        </tr>


                        <tr>
                            <td colspan="2">
                                <h4 class='' style="font-weight: 900; font-size: 20px; text-align: center;">{l s='Delivery Address' mod='supercheckout'}</h4>
                            </td>
                        </tr> 
                        {foreach from=$profile_data['profile_shipping_address'] key='k' item = 'p_addr'}
                            <tr id="customer_personal_{$profile_data['profile_shipping_address'][$k]['id']}_input" class="" >
                        <input type="hidden" value="{$profile_data['profile_shipping_address'][$k]['id']}" name="edit_customer_profiles[profile_shipping_address][{$k}][id]" />
                        <input type="hidden" value="{$profile_data['profile_shipping_address'][$k]['title']}" name="edit_customer_profiles[profile_shipping_address][{$k}][title]" />
                        <input type="hidden" value="{$profile_data['profile_shipping_address'][$k]['conditional']}" name="edit_customer_profiles[profile_shipping_address][{$k}][conditional]" />
                        <td style="text-align: center;">
                            <span>{l s=$profile_data['profile_shipping_address'][$k]['title'] mod='supercheckout'}:
                        </td>
                        {$conditional = $profile_data['profile_shipping_address'][$k]['conditional']}
                        <td class="left drag-col-2 col-pad-left">
                            <div class="widget-body uniformjs" style="padding: 0 !important;">
                                <label class="checkboxinline no-bold">
                                    {if $k eq 'vat_number'}
                                        <div style="width: 70px;text-align: center;">
                                            <i class="icon-question-sign supercheckout-tooltip-color" data-toggle="tooltip" data-placement="top" data-original-title="{l s='To make this field mandatory please go to' mod='supercheckout'} {l s='Customers->Addresses->Set required fields for this section' mod='supercheckout'}"></i>{l s='Require' mod='supercheckout'}
                                        </div>
                                    {else}
                                        <input id="customer_shipping_address_guest_{$k}_require" type="checkbox" class="checkbox input-checkbox-option require_address_field" name="edit_customer_profiles[profile_shipping_address][{$k}][logged][require]" value="{$profile_data['profile_shipping_address'][$k]['logged']['require']|intval}" {if $profile_data['profile_shipping_address'][$k]['logged']['require'] eq 1}checked="checked"{/if} />{l s='Require' mod='supercheckout'}
                                    {/if}
                                </label>
                                <label class="checkboxinline no-bold">
                                    <input id="customer_shipping_address_guest_{$k}_display" type="checkbox" class="checkbox input-checkbox-option display_address_field" name="edit_customer_profiles[profile_shipping_address][{$k}][logged][display]" value="{$profile_data['profile_shipping_address'][$k]['logged']['display']|intval}" {if $profile_data['profile_shipping_address'][$k]['logged']['display'] eq 1}checked="checked"{/if} />{l s='Show' mod='supercheckout'}                                                                        
                                </label>
                               {* {if in_array($k, $highlighted_fields)}
                                    <span style="color:red; margin-left: 5px;">*</span>
                                {/if}*}
                            </div>
                        </td>

                        </tr>
                    {/foreach}

                    <tr>
                        <td colspan="2">
                            <h4 class='' style="font-weight: 900; font-size: 20px; text-align: center;">{l s='Invoice Address' mod='supercheckout'}</h4>
                        </td>
                    </tr> 

                    {foreach from=$profile_data['profile_payment_address'] key='k' item = 'p_addr'}
                        <tr id="customer_personal_{$profile_data['profile_payment_address'][$k]['id']}_input" class="" >
                        <input type="hidden" value="{$profile_data['profile_payment_address'][$k]['id']}" name="edit_customer_profiles[profile_payment_address][{$k}][id]" />
                        <input type="hidden" value="{$profile_data['profile_payment_address'][$k]['title']}" name="edit_customer_profiles[profile_payment_address][{$k}][title]" />
                        <input type="hidden" value="{$profile_data['profile_payment_address'][$k]['conditional']}" name="edit_customer_profiles[profile_payment_address][{$k}][conditional]" />
                        <td style="text-align: center;">
                            <span>{l s=$profile_data['profile_payment_address'][$k]['title'] mod='supercheckout'}:

                                {$conditional = $profile_data['profile_payment_address'][$k]['conditional']}
                                <td class="left drag-col-2 col-pad-left">
                                    <div class="widget-body uniformjs" style="padding: 0 !important;">
                                        <label class="checkboxinline no-bold">
                                            {if $k eq 'vat_number'}
                                                <div style="width: 70px;text-align: center;">
                                                    <i class="icon-question-sign supercheckout-tooltip-color" data-toggle="tooltip" data-placement="top" data-original-title="{l s='To make this field mandatory please go to' mod='supercheckout'} {l s='Customers->Addresses->Set required fields for this section' mod='supercheckout'}"></i>{l s='Require' mod='supercheckout'}
                                                </div>
                                            {else}
                                                <input id="customer_payment_address_guest_{$k}_require" type="checkbox" class="checkbox input-checkbox-option require_address_field" name="edit_customer_profiles[profile_payment_address][{$k}][logged][require]" value="{$profile_data['profile_payment_address'][$k]['logged']['require']|intval}" {if $profile_data['profile_payment_address'][$k]['logged']['require'] eq 1}checked="checked"{/if} />{l s='Require' mod='supercheckout'}
                                            {/if}
                                        </label>
                                        <label class="checkboxinline no-bold">
                                            <input id="customer_payment_address_guest_{$k}_display" type="checkbox" class="checkbox input-checkbox-option display_address_field" name="edit_customer_profiles[profile_payment_address][{$k}][logged][display]" value="{$profile_data['profile_payment_address'][$k]['logged']['display']|intval}" {if $profile_data['profile_payment_address'][$k]['logged']['display'] eq 1}checked="checked"{/if} />{l s='Show' mod='supercheckout'}                                                                        
                                        </label>
                                       {* {if in_array($k, $highlighted_fields)}
                                            <span style="color:red; margin-left: 5px;">*</span>
                                        {/if}*}
                                    </div>
                                </td>

                                </tr>
                            {/foreach} 

                            {if count($custom_fields_details) > 0}

                                <tr>
                                    <td colspan="2">
                                        <h4 class='' style="font-weight: 900; font-size: 20px; text-align: center;">{l s='Custom Fields' mod='supercheckout'}</h4>
                                    </td>
                                </tr> 

                                {foreach from=$custom_fields_details item=array_field}
                                    <tr class="" id="{*tr_pure_table_{$array_field['id_velsof_supercheckout_custom_fields']}*}">

                                        <td class="center" style="padding: 5px 0px;"><div class="">{$array_field['field_label']}</div></td> 

                                        <td class="center" style="{*padding: 12px;*}">
                                            <div class="widget-body uniformjs" style="padding: 0 !important;">
                                                <label class="checkboxinline no-bold">
                                                    <input id="edit_customer_profiles[custom_fields][{$array_field['id_velsof_supercheckout_custom_fields']}]" type="checkbox" class="checkbox input-checkbox-option display_address_field" name="edit_customer_profiles[custom_fields][{$array_field['id_velsof_supercheckout_custom_fields']}]" value="{$profile_data['custom_fields'][{$array_field['id_velsof_supercheckout_custom_fields']}]|intval}"  {if $profile_data['custom_fields'][{$array_field['id_velsof_supercheckout_custom_fields']}] eq "1"} checked="checked"{/if}/>{l s='Show' mod='supercheckout'}                                                                        
                                                </label>
                                            </div>
                                        </td>
                                    </tr>

                                {/foreach}

                            {/if}
                            </tbody>
                </table>
            </div>
        </div>
        <div class="modal-footer no_border">
            <button type="button" onclick="closeModalPopup('modal_edit_customer_profile_form')" class="btn btn-default">{l s='Close' mod='supercheckout'}</button>
            <button type="button" onclick="submitEditCustomerProfileForm()" class="btn btn-primary" id='edit_customer_profile_save'>
                {l s='Save' mod='supercheckout'}
                <img id='loader_edit_form_customer_profile' class='loader_save_button hidden_custom' src='{$module_dir_url nofilter}{*escape not required as contains URL*}/supercheckout/views/img/admin/ajax_loader.gif'/>
            </button>
        </div>
    </div>
</div>
<script>
    $('input.input-checkbox-option').click(function(){
        if($(this).is(':checked')){
            $(this).attr('value', 1);
        } else{
            $(this).attr('value', 0);
        }
    });
</script>