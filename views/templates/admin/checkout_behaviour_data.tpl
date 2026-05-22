 <!--
 * This file is added by Anshul to show the Checkout behavior data. It basically captures the fields which are filled before leaving the cart abandoned
 * and show the same in Checkout Behavior tab field wise. It shows the data of Email, Shipping Method, Payment Method, Shipping Address & Invoice Address.
 * Feature: Checkout Behavior (Jan 2020)
 -->
<div class='panel kpi-container'>
    <div class='row'>
        <div class="col-sm-4">{$kpis1 nofilter}</div>{*Variable contains html content, escape not required*}
        <div class="col-sm-4"> {$kpis2 nofilter}</div>{*Variable contains html content, escape not required*}
        <div class="col-sm-4">{$kpis5 nofilter}</div>{*Variable contains html content, escape not required*}
        <div id="abandoned_checkout_analytics" class="col-sm-4" style="float: right;">
            <form method="post" id="ac_filter_form">
                <div class="filter_inline_div" style="display:flex;">
                    <span style="padding:5px"><b>{l s='From' mod='supercheckout'}: </b></span>
                    <input type="text" data-hex="true" class="filter_inputs datepicker kb_input_width" id="abandoned_data_track_from_date" name="abandoned_data_track_from_date"  value="{date('d-m-Y', $start_date|escape:'quotes':'UTF-8')}" readonly />
                    <span style="padding:5px"><b>{l s='To' mod='supercheckout'}: </b></span>
                    <input type="text" class="filter_inputs datepicker kb_input_width" id="abandoned_data_track_to_date" name="abandoned_data_track_to_date"  value="{date('d-m-Y', $end_date|escape:'quotes':'UTF-8')}" readonly/>
                    <button id="abandoned_data_filter" class="btn btn-warning" name="abandoned_data_filter" style="margin-left: 4px;" value="ac_filter_submit">{l s='Filter' mod='supercheckout'}</button>
                </div>
            </form>
        </div>
    </div>
</div>


<!-- Email -->
<div class="kb_cb_data">
    <div class="kb_title">
        <strong>{l s='Email address' mod='supercheckout'}</strong>
    </div>
    <div class="kb_description">
        <span>{l s='Abandoned checkouts where email addresses were specified.' mod='supercheckout'}</span>:
    </div>
    <div class="kb_count">
        <span>{$check_behaviour_data['email']}</span>
        <span class="kb_percentage">({$check_behaviour_data['email_percent']|string_format:"%d"}%)</span>
    </div>
    <div class="kb_progress yellow">
        <div class="kb_progress-bar kb_progress-bar-success kb_progress-bar-striped" role="progressbar"
             aria-valuenow="20" aria-valuemin="0" aria-valuemax="100" style="width:{$check_behaviour_data['email_percent']|string_format:"%d"}%">
            {$check_behaviour_data['email_percent']|string_format:"%d"}%
        </div>
    </div>
</div>

<div>
    <div class="kb_cb_data" style="
    width: 49%;
    float: left;
">
        <div class="kb_title">
            <strong>{l s='Shipping address' mod='supercheckout'}</strong>
        </div>
        <div class="kb_description">
            <span>{l s='Abandoned checkouts where the following shipping addresses fields were completed.' mod='supercheckout'}</span>
        </div>
        <div class="kb_cb_bar_main_container">
            <div class="kb_cb_bar_list">
            {**
             * Added is array check and count check to avoid the error in case of empty array
             * @author Prvind Panday
             * @date 08 March 2024
            *}
                {if is_array($settings) && array_key_exists('shipping_address', $settings) && count($settings['shipping_address']) > 0}
                    {foreach $settings['shipping_address'] as $key => $value}
                        {if $value['guest']['display'] != 0 || $value['logged']['display'] != 0}
                            <div class="kb_cb_bar_container">
                                <div class="kb_cb_bar_field">
                                    <div class="kb_label"><span>{l s=$value['title'] mod='supercheckout'}</span>{if $value['guest']['require'] != 0 || $value['logged']['require'] != 0 }<span class="asterisk">*</span>{/if}</div>
                                </div>
                                {assign var="indexkb" value="{$key}_percent"}
                                <div class="kb_count" style="clear: both;">
                                    <span>{$check_behaviour_data[$key]}</span>
                                    <span class="kb_percentage">({$check_behaviour_data[$indexkb]|string_format:"%d"}%)</span>
                                </div>
                                <div class="kb_progress yellow">
                                    <div class="kb_progress-bar kb_progress-bar-success kb_progress-bar-striped" role="progressbar"
                                        aria-valuenow="20" aria-valuemin="0" aria-valuemax="100" style="width:{$check_behaviour_data[$indexkb]|string_format:"%d"}%">
                                        {$check_behaviour_data[$indexkb]|string_format:"%d"}%
                                    </div>
                                </div>
                            </div>
                        {/if}
                    {/foreach}
                {/if}
            </div>
        </div>
        <label for="">
            <span>{l s='Fields with asterisk (*) shows required fields in the front.' mod='supercheckout'}</span>
        </label>
    </div>
   
    <div class="kb_cb_data" style="
    width: 50%;
    float: left;
    margin-left: 1%;
">
        <div class="kb_title">
            <strong>{l s='Invoice address' mod='supercheckout'}</strong>
        </div>
        <div class="kb_description">
            <span>{l s='Abandoned checkouts where the following Payment addresses fields were completed.' mod='supercheckout'}</span>
        </div>
        <div class="kb_cb_bar_main_container">
            <div class="kb_cb_bar_list">
            {**
             * Added is array check and count check to avoid the error in case of empty array
             * @author Prvind Panday
             * @date 08 March 2024
            *}
                {if is_array($settings) && array_key_exists('payment_address', $settings) && count($settings['shipping_address']) > 0}
                    {foreach $settings['payment_address'] as $key => $value}
                        {if $value['guest']['display'] != 0 || $value['logged']['display'] != 0}
                            <div class="kb_cb_bar_container">
                                <div class="kb_cb_bar_field">
                                    <div class="kb_label"><span>{l s=$value['title'] mod='supercheckout'}</span>{if $value['guest']['require'] != 0 || $value['logged']['require'] != 0 }<span class="asterisk">*</span>{/if}</div>
                                </div>
                                {assign var="indexkbinvoice" value="{$key}_invoice_percent"}
                                {assign var="indexkbkey" value="{$key}_invoice"}
                                <div class="kb_count" style="clear: both;">
                                    <span>{$check_behaviour_data[$indexkbkey]}</span>
                                    <span class="kb_percentage">({$check_behaviour_data[$indexkbinvoice]|string_format:"%d"}%)</span>
                                </div>
                                <div class="kb_progress yellow">
                                    <div class="kb_progress-bar kb_progress-bar-success kb_progress-bar-striped" role="progressbar"
                                        aria-valuenow="20" aria-valuemin="0" aria-valuemax="100" style="width:{$check_behaviour_data[$indexkbinvoice]|string_format:"%d"}%">
                                        {$check_behaviour_data[$indexkbinvoice]|string_format:"%d"}%
                                    </div>
                                </div>
                            </div>
                        {/if}
                    {/foreach}
                {/if}
            </div>
        </div>
        <label for="">
            <span>{l s='Fields with asterisk (*) shows required fields in the front.' mod='supercheckout'}</span>
        </label>
    </div>

    
</div>
        <div class="kb_cb_data" style="clear:both;">
        <div class="kb_title">
            <strong>{l s='Use Separate Address For Invoice' mod='supercheckout'}</strong>
        </div>
        <div class="kb_description">
            <span>{l s='If it is filled that means customer tried to use different address for invoice.' mod='supercheckout'}</span>:
        </div>
        <div class="kb_count">
            <span>{$check_behaviour_data['use_for_invoice']}</span>
            <span class="kb_percentage">({$check_behaviour_data['use_for_invoice_percent']|string_format:"%d"}%)</span>
        </div>
        <div class="kb_progress yellow">
            <div class="kb_progress-bar kb_progress-bar-success kb_progress-bar-striped" role="progressbar"
                 aria-valuenow="20" aria-valuemin="0" aria-valuemax="100" style="width:{$check_behaviour_data['use_for_invoice_percent']|string_format:"%d"}%">
                {$check_behaviour_data['use_for_invoice_percent']|string_format:"%d"}%
            </div>
        </div>
    </div>
<!-- Shipping Method -->
<div class="kb_cb_data">
    <div class="kb_title">
        <strong>{l s='Shipping Method' mod='supercheckout'}</strong>
    </div>
    <div class="kb_description">
        <span>{l s='Abandoned checkouts where Shipping Method was selected.' mod='supercheckout'}</span>:
    </div>
    <div class="kb_count">
        <span>{$check_behaviour_data['shipping_method']}</span>
        <span class="kb_percentage">({$check_behaviour_data['shipping_method_percent']|string_format:"%d"}%)</span>
    </div>
    <div class="kb_progress yellow">
        <div class="kb_progress-bar kb_progress-bar-success kb_progress-bar-striped" role="progressbar"
             aria-valuenow="20" aria-valuemin="0" aria-valuemax="100" style="width:{$check_behaviour_data['shipping_method_percent']|string_format:"%d"}%">
            {$check_behaviour_data['shipping_method_percent']|string_format:"%d"}%
        </div>
    </div>
</div>
<!-- Payment Method -->
<div class="kb_cb_data">
    <div class="kb_title">
        <strong>{l s='Payment Method' mod='supercheckout'}</strong>
    </div>
    <div class="kb_description">
        <span>{l s='Abandoned checkouts where Payment Method was selected.' mod='supercheckout'}</span>:
    </div>
    <div class="kb_count">
        <span>{$check_behaviour_data['payment_method']}</span>
        <span class="kb_percentage">({$check_behaviour_data['payment_method_percent']|string_format:"%d"}%)</span>
    </div>
    <div class="kb_progress yellow">
        <div class="kb_progress-bar kb_progress-bar-success kb_progress-bar-striped" role="progressbar"
             aria-valuenow="20" aria-valuemin="0" aria-valuemax="100" style="width:{$check_behaviour_data['payment_method_percent']|string_format:"%d"}%">
            {$check_behaviour_data['payment_method_percent']|string_format:"%d"}%
        </div>
    </div>
</div>

<div style="display: none;">
    <label>{l s='First Name' mod='supercheckout'}</label>
    <label>{l s='Last Name' mod='supercheckout'}</label>
    <label>{l s='Company' mod='supercheckout'}</label>
    <label>{l s='Vat Number' mod='supercheckout'}</label>
    <label>{l s='Address Line 1' mod='supercheckout'}</label>
    <label>{l s='Address Line 2' mod='supercheckout'}</label>
    <label>{l s='Zip/Postal Code' mod='supercheckout'}</label>
    <label>{l s='City' mod='supercheckout'}</label>
    <label>{l s='Country' mod='supercheckout'}</label>
    <label>{l s='State' mod='supercheckout'}</label>
    <label>{l s='Identification Number' mod='supercheckout'}</label>
    <label>{l s='Home Phone' mod='supercheckout'}</label>
    <label>{l s='Mobile Phone' mod='supercheckout'}</label>
    <label>{l s='Address Title' mod='supercheckout'}</label>
    <label>{l s='Other Information' mod='supercheckout'}</label>                
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
* @license   see file: LICENSE.txt
*
* Description
*
* Admin tpl file
*}