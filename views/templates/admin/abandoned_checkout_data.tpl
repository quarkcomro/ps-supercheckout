<!--
 * This file is added by Anshul to show the Abandoned cart checkout data. It basically shows the number of abandoned carts, number of ordered carts, abandoned revenues, 
 * checkout conversion & ordered revenues day/week/month/year wise. It also shows the graph for the same.
 * Feature:Abcart Stats (Jan 2020) 
-->

<style>
    .kb_input_width {
        width: 41% !important;
    }
    .abandoned_checkout_report_list {
        margin-top: 13px;
    margin-left: 5px;
    }
    .abandoned_checkout_report_list .abandoned_checkout_report_period_item {
        border-color: rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.25);
    border: 1px solid #cccccc;
    border-bottom-color: #b3b3b3;
    color: #333333;
    display: inline-block;
    padding: 4px 12px;
    margin-bottom: 0;
    font-size: 14px;
    line-height: 20px;
    text-align: center;
    vertical-align: middle;
    cursor: pointer;
    font-weight: bold;
    position: relative;
    margin-left: -1px;
    background: #ffffff;
    }
    .abandoned_checkout_report_list .active {
            background: #fbbb22;
    color: #fff;
    opacity: 1;
    }
    .abandoned_checkout_report_list .disabled {
    pointer-events: none;
    }
    
    #ab_cart_count_graph_revenue {
        width: 1000px;
        height: 300px;
        text-align: center;
        margin: 0 auto;
    }
    #ab_checkout_conversion_count {
        width: 1000px;
        height: 300px;
        text-align: center;
        margin: 0 auto;
    }
    
    #ab_cart_count_graph_numbers {
        width: 1000px;
        height: 300px;
        text-align: center;
        margin: 0 auto;
    }
</style>    
<script>
    var kb_controller_name = "{$current_url}";
    var conversion_data_graph = '{$conversion_data_graph}';
    var ac_complete_data_graph = '{$ac_complete_data_graph}';
    var current_currency_sign = '{$current_currency_sign}';
    var checkout_conversion_text = "{l s='Checkout Conversion' mod='supercheckout'}";
    var data_conversion_ac_text = "{l s='Number of Abandoned Checkouts' mod='supercheckout'}";
    var data_conversion_ar_text = "{l s='Abandoned Revenue' mod='supercheckout'}";
    var data_conversion_oc_text = "{l s='Number of orders' mod='supercheckout'}";
    var data_conversion_or_text = "{l s='Orders Revenue' mod='supercheckout'}";
</script>
<div class='panel kpi-container'>
        <div class='row'>
            <div class="col-sm-4">{$kpis1 nofilter}</div>{*Variable contains html content, escape not required*}
            <div class="col-sm-4"> {$kpis2 nofilter}</div>{*Variable contains html content, escape not required*}
            <div class="col-sm-4">{$kpis3 nofilter}</div>{*Variable contains html content, escape not required*}
            <div class="col-sm-4">{$kpis4 nofilter}</div>{*Variable contains html content, escape not required*}
            <div class="col-sm-4">{$kpis5 nofilter}</div>{*Variable contains html content, escape not required*}
            <div id="abandoned_checkout_analytics" class="col-sm-4">
                <form method="post" id="ac_filter_form">
                <div class="filter_inline_div" style="display:flex;">
                    <input type="hidden" id="ac_filter_format" name="ac_filter_format" value="{$ac_filter_format}">
                    <span style="padding:5px"><b>{l s='From' mod='supercheckout'}: </b></span>
                    <input type="text" data-hex="true" class="filter_inputs datepicker kb_input_width" id="abandoned_data_track_from_date" name="abandoned_data_track_from_date"  value="{date('d-m-Y', $start_date|escape:'quotes':'UTF-8')}" readonly />
                    <span style="padding:5px"><b>{l s='To' mod='supercheckout'}: </b></span>
                    <input type="text" class="filter_inputs datepicker kb_input_width" id="abandoned_data_track_to_date" name="abandoned_data_track_to_date"  value="{date('d-m-Y', $end_date|escape:'quotes':'UTF-8')}" readonly/>
                    <button id="abandoned_data_filter" class="btn btn-warning" name="abandoned_data_filter" style="margin-left: 4px;" value="ac_filter_submit">{l s='Filter' mod='supercheckout'}</button>
                </div>
                </form>
                <div class="abandoned_checkout_report_list">
                    <button class="abandoned_checkout_report_period_item {if $ac_filter_format == 'day'}disabled active{/if}" onclick="selectFilter('day');">{l s='Day' mod='supercheckout'}
                    </button>
                    <button class="abandoned_checkout_report_period_item {if $ac_filter_format == 'week'}disabled active{/if}" onclick="selectFilter('week');">{l s='Week' mod='supercheckout'}
                    </button>
                    <button class="abandoned_checkout_report_period_item {if $ac_filter_format == 'month'}disabled active{/if}" onclick="selectFilter('month');">{l s='Month' mod='supercheckout'}
                    </button>
                    <button class="abandoned_checkout_report_period_item {if $ac_filter_format == 'year'}disabled active{/if}" onclick="selectFilter('year');">{l s='Year' mod='supercheckout'}
                    </button>
                    <button class="abandoned_checkout_report_period_item  active" onclick="selectFilter('reset');">{l s='Reset' mod='supercheckout'}
                    </button>
                </div>
            </div>
        </div>
    </div>
        {if $ac_complete_data_graph != '' || $conversion_data_graph != ''}
            <div class="graph_con_dev panel" style="min-height: 1187px;">
                <h3 style="border-bottom: solid 1px #eee;text-align: center;font-size: 21px">{l s='Statistics' mod='supercheckout'}</h3>
                <div class="graph_con col-lg-12" style="margin-top:24px">
                            {if $ac_complete_data_graph != ''}
                    <div id="ab_cart_count_graph_revenue"></div>
                           {/if}
                </div>
                <div class="graph_con_numb col-lg-12" style="margin-top:84px">
                            {if $ac_complete_data_graph != ''}
                    <div id="ab_cart_count_graph_numbers"></div>
                           {/if}
                </div>
                <div class="graph_dev col-lg-12" style="margin-top:84px">
                            {if $conversion_data_graph != ''}
                    <div id="ab_checkout_conversion_count"></div>
                            {/if}
                </div>
            </div>
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
    * @copyright 2017 Knowband
    * @license   see file: LICENSE.txt
    *
    * Description
    *
    * Admin tpl file
    *}
