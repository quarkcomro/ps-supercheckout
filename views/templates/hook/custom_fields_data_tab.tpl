{if isset($kb_version) && $kb_version == '1.7.7' }
<li class="nav-item">
    <a class="nav-link" id="historyTab" data-toggle="tab" href = "#custom_fields_data_content" role="tab" aria-controls="custom_fields_data_content" aria-expanded="true" aria-selected="false">
      <i class="material-icons">info</i>
        {l s = 'Supercheckout Custom Fields' mod='supercheckout'} <span class="badge"></span>

</a>
</li>

<li class="nav-item">
    <a class="nav-link" id="historyTab" data-toggle="tab" href = "#kb_gift_message_data_content" role="tab" aria-controls="kb_gift_message_data_content" aria-expanded="true" aria-selected="false">
      <i class="material-icons">mail</i>
        {l s = 'Supercheckout Gift Message details' mod='supercheckout'} <span class="badge"></span>

</a>
</li>
{else}
<li>
    <a href = "#custom_fields_data_content" style="padding: 13px;">
        <i class = "icon-info-sign"></i>
        {l s = 'Supercheckout Custom Fields' mod='supercheckout'} <span class="badge"></span>
    </a>
</li>
{* changes by rishabh jain *}
<li>
    <a href = "#kb_gift_message_data_content" style="padding: 13px;">
        <i class = "icon-gift"></i>
        {l s = 'Supercheckout Gift Message details' mod='supercheckout'} <span class="badge"></span>
    </a>
</li>
{/if}
{* chnages over *}
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
* Product Update Block Page
*}