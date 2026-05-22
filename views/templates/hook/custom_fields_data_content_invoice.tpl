<div>
    <table id="table-1"  class="kb_invoice_1" style="border:1px solid #000; width: 90%">
        <thead>
            <tr><th class="product header small" colspan="2" style="text-align: center;">{l s='Additional Information' mod='supercheckout'}</th></tr>
        </thead>
        <tbody>
            {if isset($customer_profile) && !empty($customer_profile)}
                <tr>
                    <td class="grey" style="text-align: center;">{l s='Customer Profile : ' mod='supercheckout'}</td>
                    <td class="white" style="text-align: center"> {$customer_profile}</td>
                </tr>
            {/if}
                           
        {if is_array($fields_data) && !empty($fields_data)}
            {foreach $fields_data as $kbfield}
                <tr>
                    <td class="grey" style="text-align: center;">{$kbfield['field_label']|escape:'htmlall':'UTF-8'}</td>
                    {if $kbfield['type'] == 'file'}
                        {assign var=file_path value=$kbfield['field_value']|json_decode:1}
                        <td class="white" style="text-align: center">
                            <a style="padding: 4px;margin-bottom: 6px" class="btn btn-warning" href="{$kb_front_controller nofilter}&id_field={$kbfield['id_velsof_supercheckout_fields_data']}"> {l s='Download File' mod='supercheckout'}</a> {* Variable contains URL, could not escape*}
                            <a style="padding: 4px;margin-bottom: 6px" class="btn btn-warning" href="{$file_path['path'] nofilter}" target="_blank" >{l s='Preview' mod='supercheckout'}</a> {* Variable contains URL, could not escape*}
                        </td>
                    {else}
                        {if $kbfield['field_value'] != ''}
                            <td class="white" style="text-align: center">
                                {$kbfield['field_value']|escape:'htmlall':'UTF-8'}
                            </td>
                        {else}
                            <td>&nbsp;</td>
                        {/if}
                    {/if}
                </tr>
            {/foreach}
        {/if}
        </tbody>
    </table>
</div>
{*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
* We offer the best and most useful modules PrestaShop and modifications for your online store.
*
* @category  PrestaShop Module
* @author    velsof.com <support@velsof.com>
* @copyright 2017 Velocity Software Solutions Pvt Ltd
* @license   see file: LICENSE.txt
*
* Description
*
* 
*}