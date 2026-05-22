{if isset($product_json_data)}
    {if !empty($product_json_data)}
        {foreach $product_json_data as $data}
            <div class="kb-cp-cart-li kb-cp-cart-li-{$data['id_customization']}">
                <div>
                    <p>{l s='Customization Cost:' mod='supercheckout'} {convertPrice price=$data['customization_cost']}</p>
                </div>
                <div class="">
                    {assign var=kb_label value="_"|explode:$data['value']}
                    {foreach $slice_data[$data['id_product']] as $key => $s_data}
                        {if $s_data['enable'] eq 1}
                            <div style="float:left;    margin-right: 6px;">
                                <p class="kb-cp-cart-text" style="margin: 0;">{$s_data['name'][$id_lang]}</p>
                                <img src="{$canvas_img_url}{$kb_label[1]}_{$key}.png" class="kb-cart-cp-img" height="auto" width="75">
                                <div class="kb-cp-cart-preview-btn">
                                    <a style=" color:#fff; font-size: 10px;padding: 6px;" href="{$canvas_img_url}{$kb_label[1]}_{$key}.png" target="_blank" class="btn btn-primary">
                                        <i class="icon-search"></i> {l s='Preview' mod='supercheckout'}</a>
                                </div>
                            </div>
                        {/if}
                    {/foreach}
                    <div style="clear: both;"></div>
                </div>
            </div>
        {/foreach}
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
* @copyright 2017 knowband
* @license   see file: LICENSE.txt
*}
