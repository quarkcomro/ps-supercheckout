<div class='panel'>
    <div id="abandoned_checkout_analytics" class="row" style='text-align: center;'>
        <div class="filter_inline_div"><span>{l s='From' mod='supercheckout'}:</span><input type="text" data-hex="true" class="filter_inputs datepicker" id="abandoned_data_track_from_date" name="abandoned_data_track_from_date"  value="{date('d-m-Y', $start_date|escape:'quotes':'UTF-8')}" readonly />
            <span>{l s='To' mod='supercheckout'}:</span><input type="text" class="filter_inputs datepicker" id="abandoned_data_track_to_date" name="abandoned_data_track_to_date"  value="{date('d-m-Y', $end_date|escape:'quotes':'UTF-8')}" readonly/>
            <input type="button" id="abandoned_data_filter" class="btn btn-warning" name="abandoned_data_filter" value="{l s='Filter' mod='supercheckout'}" style="
                   width: 10%;
                   "></div>
    </div>
</div>
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
* @copyright 2020 Knowband
*}