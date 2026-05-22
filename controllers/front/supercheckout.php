<?php
/**
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to http://www.prestashop.com for more information.
 * We offer the best and most useful modules PrestaShop and modifications for your online store.
 *
 * @author    knowband.com <support@knowband.com>
 * @copyright 2017 Knowband
 * @license   see file: LICENSE.txt
 * @category  PrestaShop Module
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

use GeoIp2\Database\Reader;
use PrestaShop\PrestaShop\Core\Checkout\TermsAndConditions;
use PrestaShop\PrestaShop\Adapter\Product\PriceFormatter;

require_once 'SupercheckoutCore.php';

include_once(_PS_MODULE_DIR_ . 'supercheckout/vendor/maxmind/autoload.php');
include_once(_PS_MODULE_DIR_ . 'supercheckout/vendor/maxmind/geoip2/geoip2/src/Database/Reader.php');



if (Module::isInstalled('kbmobilelogin') && Module::isEnabled('kbmobilelogin')) {
    if (file_exists(_PS_MODULE_DIR_ . 'kbmobilelogin/kbmobilelogin.php')) {
        include_once(_PS_MODULE_DIR_ . 'kbmobilelogin/kbmobilelogin.php');
        include_once(_PS_MODULE_DIR_ . 'kbmobilelogin/classes/Twilio.php');
    }
}

use PrestaShop\Module\PrestashopCheckout\Api\Payment\Order;
use PrestaShop\Module\PrestashopCheckout\Builder\Payload\OrderPayloadBuilder;
use PrestaShop\Module\PrestashopCheckout\Environment\PaypalEnv;
use PrestaShop\Module\PrestashopCheckout\GenerateJsonPaypalOrder;
use PrestaShop\Module\PrestashopCheckout\Presenter\Cart\CartPresenter;
use PrestaShop\Module\PrestashopCheckout\Repository\PaypalAccountRepository;

if (Module::isInstalled('ps_checkout') && Module::isEnabled('ps_checkout')) {
    require_once _PS_MODULE_DIR_ . 'ps_checkout/vendor/autoload.php';
}

// if (!class_exists('Mobile_Detect')) {
//     require_once(_PS_TOOL_DIR_ . 'mobile_Detect/Mobile_Detect.php');
// }

if (!class_exists('KbSuperMailin')) {
    include_once(dirname(__FILE__) . '/vendor/sendinBlue/Mailin.php');
}

class SupercheckoutSupercheckoutModuleFrontController extends SupercheckoutCore
{
    public function postProcess()
    {
        parent::postProcess();

        //Handle Ajax request
        if (Tools::isSubmit('ajax')) {
            $this->json = array();
            if (Tools::isSubmit('method') && Tools::getValue('method') == 'saveAddress') {
                $this->json = $this->saveAddress();
            } elseif (Tools::isSubmit($this->name . 'PlaceOrder')) {
                $this->json = $this->confirmOrder();
            } elseif (Tools::isSubmit('SubmitLogin')) {
                $this->processSubmitLogin();
            } elseif (Tools::isSubmit('submitDiscount')) {
                if ($this->nb_products) {
                    $this->json = $this->addCartRule();
                } else {
                    $this->json['error'] = $this->module->l('Your cart is empty.');
                }
            } elseif (Tools::isSubmit('deleteDiscount')) {
                if ($this->nb_products) {
                    $this->json = $this->removeDiscount();
                } else {
                    $this->json['error'] = $this->module->l('Your cart is empty.');
                }
            } elseif (Tools::isSubmit('method')) {
                switch (Tools::getValue('method')) {
                    //Start: Added by Anshul Mittal
                    case 'SaveFilesCustomField':
                        $this->json = $this->saveFileTypeCustomField($_FILES);
                        break;
                    //End: Added by Anshul Mittal
                    case 'checkDniandVat':
                        $this->json = $this->checkForDniandVat(Tools::getValue('id_country'));
                        break;
                    //Start:Changes done by Anshul Mittal on 09/01/2020 for Checkout Behaviour enhancement (Feature: Checkout Behavior (Jan 2020))
                    case 'updateCheckoutBehaviour':
                        $this->json = $this->updateCheckoutBehaviour();
                        break;
                    //End:Changes done by Anshul Mittal on 09/01/2020 for Checkout Behaviour enhancement (Feature: Checkout Behavior (Jan 2020))
                    case 'isValidDni':
                        $this->json = $this->isValidDni(Tools::getValue('dni'));
                        break;
                    case 'isValidVatNumber':
                        $this->json = $this->isValidVatNumber(Tools::getValue('vat_number'));
                        break;
                    case 'loadInvoiceAddress':
                        $this->json = $this->loadInvoiceAddress(
                            Tools::getValue('id_country'),
                            Tools::getValue('id_state'),
                            Tools::getValue('postcode'),
                            Tools::getValue('id_address_invoice')
                        );
                        break;
                    case 'loadCarriers':
                        $this->json = $this->loadCarriers(
                            Tools::getValue('id_country'),
                            Tools::getValue('id_state'),
                            Tools::getValue('postcode'),
                            (int) Tools::getValue('id_address_delivery')
                        );
                        break;
                    case 'setSameInvoice':
                        $this->context->cookie->isSameInvoiceAddress = Tools::getValue('use_for_invoice') == 1 ? 1 : 0;
                        $this->context->cookie->write();
                        $this->json = array();
                        break;
                    case 'updateCarrier':
                        $this->json = $this->updateCarrier();
                        break;
                    case 'loadCart':
                        // Changes done by Kanishka Kannoujia to fetch id_country and id_address_delivery, to display free shipping banner according to the country
                        $id_country = Tools::getValue('id_country');
                        $id_address_delivery = (int) Tools::getValue('id_address_delivery');
                        $address = new Address();
                        $id_address_delivery_new = $address->getCountryAndState($id_address_delivery);
                        if (empty($id_address_delivery_new)) {
                            $this->json = $this->loadCart($id_country, 0);
                        } else {
                            $this->json = $this->loadCart($id_country, $id_address_delivery_new['id_country']);
                        }
                        // Changes done by Kanishka Kannoujia to fetch id_country and id_address_delivery, to display free shipping banner according to the country
                        break;
                    case 'loadPayment':
                        $selected_payment_method = $this->default_payment_selected;
                        if (Tools::getIsset('selected_payment_method_id')) {
                            $selected_payment_method = Tools::getValue('selected_payment_method_id', 0);
                        }
                        $this->json = $this->loadPaymentMethods($selected_payment_method);
                        break;
                    case 'loadPaymentAdditionalInfo':
                        $this->json = $this->loadPaymentAdditionalInfo();
                        break;
                    case 'checkZipCode':
                        $this->json = $this->checkZipCode(Tools::getValue('id_country'), Tools::getValue('postcode'));
                        break;
                    case 'createFreeOrder':
                        $this->json = $this->createFreeOrder();
                        break;
                    case 'addEmailToList':
                        /*
                         * Start: Added by Anshul for subscribing email to SendinBlue & klaviyo.
                         */
                        if (Tools::getValue('platform') == 'mailchimp') {
                            $this->addEmailToList(Tools::getValue('email'));
                        } elseif (Tools::getValue('platform') == 'SendinBlue') {
                            $this->addEmailToListSendinBlue(Tools::getValue('email'));
                        } elseif (Tools::getValue('platform') == 'klaviyo') {
                            $this->addEmailToListKlaviyo(Tools::getValue('email'));
                        }
                        /*
                         * End: Added by Anshul for subscribing email to SendinBlue & klaviyo.
                         */
                        break;
                    // Code added by Anshul to render the address update form
                    case 'getAddressFormToUpdate':
                        $this->getAddressFormToUpdate(Tools::getValue('address_type'), Tools::getValue('selected_address_id'));
                        break;
                    // Code added by Anshul to delete the address update form
                    case 'deleteAddress':
                        $this->deleteAddress(Tools::getValue('address_type'), Tools::getValue('selected_address_id'));
                        break;
                    case 'updateDeliveryExtra':
                        $this->json = $this->updateDeliveryExtra();
                        break;
                    case 'updateGiftCardMessage':
                        /* changes by rishabh jain */
                        $this->json = $this->updateGiftCardMessage();
                        break;
                    /**
                     * Start Changes to address the issue of Order Comment not being saved when paying out using PayPal
                     * Using an Ajax now to save the Order Comment whenever it is modified
                     * @date 04-03-2025
                     * NAMar2025 order_comment
                     * @modifier Nikhil Aggarwal
                     */
                    case 'updateKBOrderComment':
                        $this->json = $this->updateKBOrderComment();
                        break;
                    // Changes end by Nikhil
                }
            }
            if (Tools::getValue('paypal_ec_canceled') == 1 || Tools::isSubmit('paypal_ec_canceled')) {
                Tools::redirect(
                    $this->context->link->getModuleLink(
                        'supercheckout',
                        'supercheckout',
                        array(),
                        (bool) Configuration::get('PS_SSL_ENABLED')
                    )
                );
            }

            echo json_encode($this->json);
            die;
        } elseif (Tools::isSubmit('mylogout')) {
            $this->context->customer->mylogout();
            Tools::redirect('index.php');
        } elseif (Tools::isSubmit('myfbLogin') || Tools::isSubmit('myGoogleLogin') || Tools::isSubmit('myPaypalLogin')) {
            if (Tools::isSubmit('myfbLogin')) {
                $this->social_login_type = 'fb';
            } elseif (Tools::isSubmit('myGoogleLogin')) {
                $this->social_login_type = 'google';
            } elseif (Tools::isSubmit('myPaypalLogin')) {
                $this->social_login_type = 'paypal';
            }

            $user_data_from_social = $this->socialLogin();

            if (isset($user_data_from_social) && !empty($user_data_from_social)) {
                if ($this->loggedInCustomer($user_data_from_social)) {
                    if ($this->supercheckout_settings['social_login_popup']['enable'] == 1) {
                        echo '<script>window.opener.location.reload(true);window.close();</script>';
                        die;
                    } else {
                        Tools::redirect(
                            $this->context->link->getModuleLink(
                                'supercheckout',
                                'supercheckout',
                                array(),
                                (bool) Configuration::get('PS_SSL_ENABLED')
                            )
                        );
                    }
                }
            }
        } elseif (Tools::isSubmit('code')) {
            if (Tools::isSubmit('login_type') && Tools::getValue('login_type') == 'fb') {
                $this->social_login_type = 'fb';
            } elseif (Tools::isSubmit('login_type') && Tools::getValue('login_type') == 'google') {
                $this->social_login_type = 'google';
            } elseif (Tools::isSubmit('login_type') && Tools::getValue('login_type') == 'paypal') {
                $this->social_login_type = 'paypal';
            }

            if (Tools::getValue('login_type') == 'paypal') {
                $code = Tools::getValue('code');
                $c_id = $this->supercheckout_settings['paypal_login']['client_id'];
                $c_sec = $this->supercheckout_settings['paypal_login']['client_secret'];
                if (isset($code) && $code != '') {
                    $header = array();
                    /* We have used base64_encode to encode the client Id and Client Secret according to the Paypal API , we cannot remove it for the validator */
                    $header[] = 'Authorization: BASIC ' . base64_encode($c_id . ":" . $c_sec);
                    $ch = curl_init();
                    curl_setopt($ch, CURLOPT_URL, 'https://api.paypal.com/v1/oauth2/token');
                    curl_setopt($ch, CURLOPT_POST, true);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, "grant_type=authorization_code&code=" . $code);
                    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                    curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    $result1 = curl_exec($ch);
                    curl_close($ch);
                    $token = json_decode($result1);
                    if (isset($token->access_token) && $token->access_token != '') {
                        $pay_link2 = 'https://api.paypal.com/v1/oauth2/token/userinfo?schema=openid';
                        $ch = curl_init();
                        curl_setopt($ch, CURLOPT_URL, $pay_link2);
                        curl_setopt(
                            $ch,
                            CURLOPT_HTTPHEADER,
                            array(
                                'authorization: Bearer ' . $token->access_token,
                                'content-type: application/json'
                            )
                        );
                        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                        $result2 = curl_exec($ch);
                        curl_close($ch);
                        $data = json_decode($result2);
                    }

                    if (isset($data) && !empty($data)) {
                        if (isset($data->email) && $data->email != '') {
                            $social_data = array();
                            $full_name_arr = preg_split('#\s+#', $data->name, 2);
                            $social_data['first_name'] = $full_name_arr[0];
                            $social_data['last_name'] = isset($full_name_arr[1]) ? $full_name_arr[1] : '';
                            $social_data['email'] = $data->email;
                            $social_data['gender'] = 0;
                            $user_data_from_social = $social_data;
                        } else {
                            if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on') {
                                $custom_ssl_var = 1;
                            }
                            if ((bool) Configuration::get('PS_SSL_ENABLED') && $custom_ssl_var == 1) {
                                $module_dir = _PS_BASE_URL_SSL_ . __PS_BASE_URI__ . str_replace(_PS_ROOT_DIR_ . '/', '', _PS_MODULE_DIR_);
                            } else {
                                $module_dir = _PS_BASE_URL_ . __PS_BASE_URI__ . str_replace(_PS_ROOT_DIR_ . '/', '', _PS_MODULE_DIR_);
                            }
                            $this->context->smarty->assign('modulepath', $module_dir);
                            $this->setTemplate('module:supercheckout/views/templates/front/paypal-email.tpl');
                            return;
                        }
                    } else {
                        $this->context->cookie->velsof_error = json_encode(
                            array($this->module->l('Not able to login with social site'))
                        );
                        if ($this->supercheckout_settings['social_login_popup']['enable'] == 1) {
                            echo '<script>window.opener.location.reload(true);window.close();</script>';
                            die;
                        } else {
                            Tools::redirect(
                                $this->context->link->getModuleLink(
                                    'supercheckout',
                                    'supercheckout',
                                    array(),
                                    (bool) Configuration::get('PS_SSL_ENABLED')
                                )
                            );
                        }
                    }
                } else {
                    $this->context->cookie->velsof_error =  json_encode(
                        array($this->module->l('Not able to login with social site'))
                    );
                    if ($this->supercheckout_settings['social_login_popup']['enable'] == 1) {
                        echo '<script>window.opener.location.reload(true);window.close();</script>';
                        die;
                    } else {
                        Tools::redirect(
                            $this->context->link->getModuleLink(
                                'supercheckout',
                                'supercheckout',
                                array(),
                                (bool) Configuration::get('PS_SSL_ENABLED')
                            )
                        );
                    }
                }
            } else {
                $user_data_from_social = $this->socialLogin();
            }

            if (count($user_data_from_social) > 0) {
                if ($this->loggedInCustomer($user_data_from_social)) {
                    if ($this->supercheckout_settings['social_login_popup']['enable'] == 1) {
                        echo '<script>window.opener.location.reload(true);window.close();</script>';
                        die;
                    } else {
                        Tools::redirect(
                            $this->context->link->getModuleLink(
                                'supercheckout',
                                'supercheckout',
                                array(),
                                (bool) Configuration::get('PS_SSL_ENABLED')
                            )
                        );
                    }
                }
            }
        }
    }

    public function getCartProductData($id_cart)
    {
        if ($id_cart == '' || $id_cart == null) {
            return;
        }
        return Db::getInstance()->executeS(
            'SELECT id_customization as id_customization_field, id_product,'
            . ' id_product_attribute, price FROM ' . _DB_PREFIX_ . 'kb_pc_cart'
            . ' WHERE id_cart=' . (int) $id_cart
        );
    }
    //change done by kanishka kannoujia to add customizes image of product
    public function hookDisplayProductCustomizationOnSC()
    {
        if ((Module::isInstalled('kbproductcustomization') && Module::isEnabled('kbproductcustomization'))) {
            $config = json_decode(Configuration::get('KB_PC_CONFIG_SETTING'), true);
            if (!empty($config) && $config['enable']) {
                $tpl = '';
                $id_customer = $this->context->customer->id;
                $orders = array();
                $kb_orders = array();
                $products = $this->context->cart->getProducts(true);
                if ($id_customer) {
                    $orders = Order::getCustomerOrders($id_customer);
                    foreach ($orders as $order) {
                        $cart = new Cart($order['id_cart']);
                        $products = $cart->getProducts(true);
                        $pc_data = $this->getCartProductData($order['id_cart']);
                        $customize_datas = $this->getProductFieldCustomizeData($order['id_cart'], $products, $pc_data);
                        if (!empty($customize_datas)) {
                            $kb_orders[] = $order['id_order'];
                        }
                    }
                }
                if (!empty($kb_orders)) {
                    $this->context->smarty->assign('history_reorder', 1);
                    $this->context->smarty->assign('kb_history_orders', json_encode($kb_orders));
                    $tpl .= $this->context->smarty->fetch(_PS_MODULE_DIR_ . 'kbproductcustomization/views/templates/hook/customize_cart.tpl');
                }

                $id_cart = $this->context->cart->id;
                $this->context->smarty->assign('history_reorder', 0);
                if (!empty($id_cart)) {
                    $pc_data = $this->getCartProductData($id_cart);
                    $products = $this->context->cart->getProducts(true);
                    $json_datas = $this->getProductFieldCustomizeData($id_cart, $products, $pc_data);
                    if (!empty($json_datas)) {
                        $layer_count = 1;
                        $slide_data = array();
                        $i = 0;
                        $product_cust_data = array();
                        /*
                         * code block to get the customization cost & design data
                         */
                        $currency_obj = new Currency($this->context->currency->id);
                        foreach ($json_datas as $json_data) {
                            foreach ($json_data as $key => $j_data) {
                                $id_product = $j_data['id_product'];
                                $kbpc_value = $j_data['value'];
                                if (!empty($kbpc_value)) {
                                    $kbpc_value = explode('kbcp_', $kbpc_value);
                                }
                                $cp_value = (isset($kbpc_value[1])) ? $kbpc_value[1] : '';
                                $product_config_data = $this->getProductConfigData($id_product);
                                $slide_data[$id_product] = (!empty($product_config_data) && isset($product_config_data['slice_data'])) ? json_decode($product_config_data['slice_data'], true) : '';
                                $product_design_data = $this->getProductDesign($cp_value);
                                $layer_count = (!empty($product_design_data) && isset($product_design_data['layer_count'])) ? $product_design_data['layer_count'] : $layer_count;
                                $product_cust_data[$i] = $j_data;
                                $price = $j_data['price'] * $j_data['quantity'];
                                $product_cust_data[$i]['customization_cost'] = Tools::convertPriceFull($price, null, $currency_obj);
                                $i++;
                            }
                        }

                        $this->context->smarty->assign(
                            array(
                                'kbconfig' => $config,
                                'json_data' => json_encode($product_cust_data),
                                'canvas_img_url' => $this->getModuleDirUrl() . 'kbproductcustomization/views/img/products/canvas/',
                                'layer_count' => $layer_count,
                                'page_type' => 'module-supercheckout-supercheckout',
                                'id_lang' => Context::getContext()->language->id,
                                'slice_data' => json_encode($slide_data, true),
                                'kb_download_pdf_link' => $this->context->link->getModuleLink('kbproductcustomization', 'renderpcdetails', array('ajax' => true, 'action' => 'downloadPCPDF', 'rand' => time())),
                            )
                        );
                        $tpl .= $this->context->smarty->fetch(_PS_MODULE_DIR_ . 'kbproductcustomization/views/templates/hook/customize_cart.tpl');
                    }
                }
                if ($_SERVER['REMOTE_ADDR'] == '49.36.218.39') {
                }
                return $tpl;
            }
        }
    }
    //change done by kanishka kannoujia to add customizes image of product

    //change done by kanishka kannoujia to add customizes image of product
    public function getProductDesign($kb_current)
    {
        if ($kb_current == '' || $kb_current == null) {
            return;
        }
        return Db::getInstance()->getRow(
            'SELECT * FROM ' . _DB_PREFIX_ . 'kb_pc_design_output'
            . ' WHERE id_design=' . (int) $kb_current
        );
    }
    //change done by kanishka kannoujia to add customizes image of product

    //change done by kanishka kannoujia to add customizes image of product
    public function getProductConfigData($id_product)
    {
        if ($id_product == '' || $id_product == null) {
            return;
        }
        return Db::getInstance()->getRow(
            'SELECT * FROM ' . _DB_PREFIX_ . 'kb_pc_product_setting'
            . ' WHERE id_product=' . (int) $id_product
        );
    }
    //change done by kanishka kannoujia to add customizes image of product

    //change done by kanishka kannoujia to add customizes image of product
    public function getProductFieldCustomizeData($id_cart, $products, $pc_data)
    {
        $json_data = array();
        if (!empty($products)) {
            foreach ($products as $key => $product) {
                $customize_data = Product::getAllCustomizedDatas($id_cart);
                if (!empty($customize_data)) {
                    if (isset($customize_data[$product['id_product']][$product['id_product_attribute']][$product['id_address_delivery']])) {
                        $i = 0;
                        $j_data = array();
                        foreach ($customize_data[$product['id_product']][$product['id_product_attribute']][$product['id_address_delivery']] as $id_customization => $customization) {
                            if (!empty($pc_data)) {
                                foreach ($pc_data as $data) {
                                    if (
                                        ($data['id_product'] = $product['id_product'])
                                        && $data['id_product_attribute'] == $product['id_product_attribute']
                                        && $data['id_customization_field'] == $id_customization
                                    ) {
                                        foreach ($customization['datas'] as $type => $custom_data) {
                                            if ($type == Product::CUSTOMIZE_TEXTFIELD) {
                                                foreach ($custom_data as $textField) {
                                                    $textField['price'] = $data['price'];
                                                    $textField['quantity'] = $customization['quantity'];
                                                    $j_data[$id_customization] = $textField;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        $json_data[] = $j_data;
                    }
                }
            }
        }
        return $json_data;
    }
    /*
     * Code added by Anshul to render the address form in order to allow the customers to edit the form
     */
    protected function getAddressFormToUpdate($address_type, $selected_address_id)
    {
        $errors = array();
        $addresses = $this->context->customer->getAddresses($this->context->cookie->id_lang);
        $countries = Country::getCountries((int) $this->context->cookie->id_lang, true);
        if (!empty($addresses) && isset($address_type) && isset($selected_address_id)) {
            if ($address_type == 'delivery') {
                $shipping_address_array = array();
                $enabled_shipping_address_field = array();
                $disabled_shipping_address_field = array();
                $two_column_elements = array();
                $address_field_elements = array(
                    'postcode',
                    'id_country',
                    'id_state',
                    'city'
                );
                $two_column_fields = array();
                $mobile_field_array = array(
                    'phone',
                    'phone_mobile'
                );

                $user_type = ($this->is_logged) ? 'logged' : 'guest';

                //customer profile functionality
                if ($this->supercheckout_settings['enable_customer_profile'] == 1) {
                    $sql = 'SELECT id_profile FROM ' . _DB_PREFIX_ . 'kb_supercheckout_profile_mapping WHERE id_address = ' . (int) $selected_address_id;
                    $id_profile = Db::getInstance()->getRow($sql);
                    if (!empty($id_profile)) {
                        $user_type = 'logged';
                        $existing_profile_datas = json_decode(Configuration::get('VELOCITY_SUPERCHECKOUT_CUSTOMER_PROFILE'), true);
                        $profile_config = array();
                        if (isset($existing_profile_datas) && !empty($existing_profile_datas)) {
                            foreach ($existing_profile_datas as $key => $data) {
                                if ($data['id_profile'] == $id_profile['id_profile']) {
                                    $profile_config = $existing_profile_datas[$key];
                                    break;
                                }
                            }
                        }

                        foreach ($profile_config['profile_shipping_address'] as $key => $data) {
                            $profile_config['profile_shipping_address'][$key]['sort_order'] = $this->supercheckout_settings['shipping_address'][$key]['sort_order'];
                        }

                        $this->supercheckout_settings['shipping_address'] = $profile_config['profile_shipping_address'];
                    }
                }
                //customer profile functionality

                foreach ($this->supercheckout_settings['shipping_address'] as $key => $value) {
                    if ($this->supercheckout_settings['shipping_address'][$key][$user_type]['display'] == '1') {
                        $shipping_address_array[] = $key;
                        $enabled_shipping_address_field[$key] = $this->supercheckout_settings['shipping_address'][$key];
                        $enabled_shipping_address_field[$key]['html_format'] = 0;
                    } else {
                        $disabled_shipping_address_field[$key] = $this->supercheckout_settings['shipping_address'][$key];
                        $disabled_shipping_address_field[$key]['html_format'] = 0;
                    }
                }
                $last_key = '';
                $is_next_two_column = 0;
                foreach ($enabled_shipping_address_field as $key => $value) {
                    if (!$is_next_two_column) {
                        if ($key == 'lastname' || $key == 'firstname') {
                            foreach ($shipping_address_array as $k1 => $v1) {
                                if ($v1 == $key) {
                                    if (isset($shipping_address_array[$k1 + 1]) && ($shipping_address_array[$k1 + 1] == 'lastname' || $shipping_address_array[$k1 + 1] == 'firstname')) {
                                        $is_next_two_column = 1;
                                        $enabled_shipping_address_field[$key]['html_format'] = 1;
                                    }
                                }
                            }
                        } elseif (in_array($key, $mobile_field_array)) {
                            foreach ($shipping_address_array as $k1 => $v1) {
                                if ($v1 == $key) {
                                    if (isset($shipping_address_array[$k1 + 1]) && ($shipping_address_array[$k1 + 1] == 'phone' || $shipping_address_array[$k1 + 1] == 'phone_mobile')) {
                                        $is_next_two_column = 1;
                                        $enabled_shipping_address_field[$key]['html_format'] = 1;
                                    }
                                }
                            }
                        } elseif (in_array($key, $address_field_elements)) {
                            foreach ($shipping_address_array as $k1 => $v1) {
                                if ($v1 == $key) {
                                    if (isset($shipping_address_array[$k1 + 1]) && (in_array($shipping_address_array[$k1 + 1], $address_field_elements))) {
                                        $enabled_shipping_address_field[$key]['html_format'] = 1;
                                        $is_next_two_column = 1;
                                    }
                                }
                            }
                        }
                    } else {
                        if (isset($enabled_shipping_address_field[$last_key]['html_format']) && $enabled_shipping_address_field[$last_key]['html_format'] == 1) {
                            $is_next_two_column = 0;
                            $enabled_shipping_address_field[$key]['html_format'] = 2;
                        }
                    }
                    $last_key = $key;
                }
                $this->supercheckout_settings['shipping_address'] = array_merge($enabled_shipping_address_field, $disabled_shipping_address_field);
                $default_country = (int) Configuration::get('PS_COUNTRY_DEFAULT');
                $this->context->smarty->assign(
                    array(
                        'settings' => $this->supercheckout_settings,
                        'user_type' => ($this->is_logged) ? 'logged' : 'guest',
                        'addresses' => $addresses,
                        'selected_id_address' => $selected_address_id,
                        'countries' => $countries,
                        'need_vat' => $this->isNeedVat(),
                        'need_dni' => $this->isNeedDni($default_country),
                    )
                );

                $form = $this->context->smarty->fetch(_PS_MODULE_DIR_ . 'supercheckout/views/templates/front/shipping_address_update.tpl');
                echo $form;
                die;
            } elseif ($address_type == 'invoice') {
                // changes for two column layout of payment address
                $payment_address_array = array();
                $enabled_payment_address_field = array();
                $disabled_payment_address_field = array();
                $two_column_elements = array();
                $address_field_elements = array(
                    'postcode',
                    'id_country',
                    'id_state',
                    'city'
                );
                $two_column_fields = array();
                $mobile_field_array = array(
                    'phone',
                    'phone_mobile'
                );

                $user_type = ($this->is_logged) ? 'logged' : 'guest';

                //customer profile functionality
                if ($this->supercheckout_settings['enable_customer_profile'] == 1) {
                    $sql = 'SELECT id_profile FROM ' . _DB_PREFIX_ . 'kb_supercheckout_profile_mapping WHERE id_address = ' . (int) $selected_address_id;
                    $id_profile = Db::getInstance()->getRow($sql);
                    if (!empty($id_profile)) {
                        $user_type = 'logged';
                        $existing_profile_datas = json_decode(Configuration::get('VELOCITY_SUPERCHECKOUT_CUSTOMER_PROFILE'), true);
                        $profile_config = array();
                        if (isset($existing_profile_datas) && !empty($existing_profile_datas)) {
                            foreach ($existing_profile_datas as $key => $data) {
                                if ($data['id_profile'] == $id_profile['id_profile']) {
                                    $profile_config = $existing_profile_datas[$key];
                                    break;
                                }
                            }
                        }
                        foreach ($profile_config['profile_payment_address'] as $key => $data) {
                            $profile_config['profile_payment_address'][$key]['sort_order'] = $this->supercheckout_settings['payment_address'][$key]['sort_order'];
                        }

                        $this->supercheckout_settings['payment_address'] = $profile_config['profile_payment_address'];
                    }
                }
                //customer profile functionality

                foreach ($this->supercheckout_settings['payment_address'] as $key => $value) {
                    if ($this->supercheckout_settings['payment_address'][$key][$user_type]['display'] == '1') {
                        $payment_address_array[] = $key;
                        $enabled_payment_address_field[$key] = $this->supercheckout_settings['payment_address'][$key];
                        $enabled_payment_address_field[$key]['html_format'] = 0;
                    } else {
                        $disabled_payment_address_field[$key] = $this->supercheckout_settings['payment_address'][$key];
                        $disabled_payment_address_field[$key]['html_format'] = 0;
                    }
                }
                $last_key = '';
                $is_next_two_column = 0;
                foreach ($enabled_payment_address_field as $key => $value) {
                    if (!$is_next_two_column) {
                        if ($key == 'lastname' || $key == 'firstname') {
                            foreach ($payment_address_array as $k1 => $v1) {
                                if ($v1 == $key) {
                                    if (isset($payment_address_array[$k1 + 1]) && ($payment_address_array[$k1 + 1] == 'lastname' || $payment_address_array[$k1 + 1] == 'firstname')) {
                                        $is_next_two_column = 1;
                                        $enabled_payment_address_field[$key]['html_format'] = 1;
                                    }
                                }
                            }
                        } elseif (in_array($key, $mobile_field_array)) {
                            foreach ($payment_address_array as $k1 => $v1) {
                                if ($v1 == $key) {
                                    if (isset($payment_address_array[$k1 + 1]) && ($payment_address_array[$k1 + 1] == 'phone' || $payment_address_array[$k1 + 1] == 'phone_mobile')) {
                                        $is_next_two_column = 1;
                                        $enabled_payment_address_field[$key]['html_format'] = 1;
                                    } else {
                                        $enabled_payment_address_field[$key]['html_format'] = 0;
                                    }
                                }
                            }
                        } elseif (in_array($key, $address_field_elements)) {
                            foreach ($payment_address_array as $k1 => $v1) {
                                if ($v1 == $key) {
                                    if (isset($payment_address_array[$k1 + 1]) && (in_array($payment_address_array[$k1 + 1], $address_field_elements))) {
                                        $enabled_payment_address_field[$key]['html_format'] = 1;
                                        $is_next_two_column = 1;
                                    }
                                }
                            }
                        } else {
                            $is_next_two_column = 0;
                        }
                    } else {
                        if (isset($enabled_payment_address_field[$last_key]['html_format']) && $enabled_payment_address_field[$last_key]['html_format'] == 1) {
                            $is_next_two_column = 0;
                            $enabled_payment_address_field[$key]['html_format'] = 2;
                        }
                    }
                    $last_key = $key;
                }
                $this->supercheckout_settings['payment_address'] = array_merge($enabled_payment_address_field, $disabled_payment_address_field);
                $default_country = (int) Configuration::get('PS_COUNTRY_DEFAULT');
                $this->context->smarty->assign(
                    array(
                        'settings' => $this->supercheckout_settings,
                        'user_type' => ($this->is_logged) ? 'logged' : 'guest',
                        'addresses' => $addresses,
                        'selected_id_address' => $selected_address_id,
                        'countries' => $countries,
                        'need_vat' => $this->isNeedVat(),
                        'need_dni' => $this->isNeedDni($default_country),
                    )
                );
                $form = $this->context->smarty->fetch(_PS_MODULE_DIR_ . 'supercheckout/views/templates/front/payment_address_update.tpl');
                echo $form;
                die;
            }
        } else {
            $errors['error_occured'] = 1;
            $errors['error'] = $this->module->l('Sufficient data not received', 'supercheckout');
            echo json_encode($errors);
            die;
        }
    }

    /*
     * Code added by Anshul to delete the address form
     */
    protected function deleteAddress($address_type, $selected_address_id)
    {
        $success = array();
        $errors = array();
        if (isset($address_type) && isset($selected_address_id)) {
            if ($address_type == 'delivery' || $address_type == 'invoice') {
                $address = new Address((int) $selected_address_id);
                if ($address->delete()) {
                    $success['status'] = 1;
                    $success['msg'] = $this->module->l('Address has been removed successfully.', 'supercheckout');
                    echo json_encode($success);
                    die;
                } else {
                    $success['status'] = 0;
                    $success['msg'] = $this->module->l('Error in address removing. Please try again.', 'supercheckout');
                    echo json_encode($success);
                    die;
                }
            }
        } else {
            $errors['error_occured'] = 1;
            $errors['error'] = $this->module->l('Sufficient data not received', 'supercheckout');
            echo json_encode($errors);
            die;
        }
    }

    /*
     * Function defined to validate NIF, CIF & NIE for spain
     * Feature:Spain DNI Check (Jan 2020)
     * @param string $cif DNI
     * @return int
     */
    public function checkNifCifDni($cif)
    {
        //Returns:
        // 1 = NIF ok,
        // 2 = CIF ok,
        // 3 = NIE ok,
        //-1 = NIF bad,
        //-2 = CIF bad,
        //-3 = NIE bad, 0 = ??? bad
        $cif = Tools::strtoupper($cif);
        $num = array();

        for ($i = 0; $i < 9; $i++) {
            $num[$i] = Tools::substr($cif, $i, 1);
        }
        if (!preg_match('/(^[A-Z]{1}[0-9]{7}[A-Z0-9]{1}$|^[T]{1}[A-Z0-9]{8}$)|^[0-9]{8}[A-Z]{1}$/', $cif)) {
            return 0;
        }

        if (preg_match('/^[0-9]{8}[A-Z]{1}$/', $cif)) {
            if ($num[8] == Tools::substr('TRWAGMYFPDXBNJZSQVHLCKE', Tools::substr($cif, 0, 8) % 23, 1)) {
                return 1;
            } else {
                return -1;
            }
        }
        $suma = $num[2] + $num[4] + $num[6];
        for ($i = 1; $i < 8; $i += 2) {
            $suma += Tools::substr((2 * $num[$i]), 0, 1) +
                Tools::substr((2 * $num[$i]), 1, 1);
        }
        $n = 10 - Tools::substr($suma, Tools::strlen($suma) - 1, 1);
        if (preg_match('/^[KLM]{1}/', $cif)) {
            if ($num[8] == chr(64 + $n)) {
                return 1;
            } else {
                return -1;
            }
        }
        if (preg_match('/^[ABCDEFGHJNPQRSUVW]{1}/', $cif)) {
            if ($num[8] == chr(64 + $n) || $num[8] == Tools::substr($n, Tools::strlen($n) - 1, 1)) {
                return 2;
            } else {
                return -2;
            }
        }

        if (preg_match('/^[T]{1}/', $cif)) {
            if ($num[8] == preg_match('/^[T]{1}[A-Z0-9]{8}$/', $cif)) {
                return 3;
            } else {
                return -3;
            }
        }
        if (preg_match('/^[XYZ]{1}/', $cif)) {
            if ($num[8] == Tools::substr('TRWAGMYFPDXBNJZSQVHLCKE', Tools::substr(str_replace(array('X', 'Y', 'Z'), array('0', '1', '2'), $cif), 0, 8) % 23, 1)) {
                return 3;
            } else {
                return -3;
            }
        }
        return 0;
    }

    public function saveAddress()
    {
        $response = array();
        $check_dob = false;
        $posted_data = $_POST; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
        $continue = 1;
        $condition_result = ($this->context->customer->id && Customer::customerIdExistsStatic((int) $this->context->cookie->id_customer));
        $islogged = (bool) $condition_result;
        if ($this->nb_products > 0) {
            if ($this->is_logged) {
                $id_customer = $this->context->customer->id;
            } elseif ($islogged && $this->context->cookie->is_guest) {
                $id_customer = (int) $this->context->cookie->id_customer;
            } else {
                $id_customer = 0;
            }

            $delivery_address = null;
            $invoice_address = null;

            $id_delivery_address = 0;
            if (
                (isset($posted_data['shipping_address_value']) && $posted_data['shipping_address_value'] == 1)
                || !isset($posted_data['shipping_address_value'])
            ) {
                if (
                    isset($this->context->cookie->supercheckout_temp_address_delivery)
                    && $this->context->cookie->supercheckout_temp_address_delivery > 0
                ) {
                    $id_delivery_address = $this->context->cookie->supercheckout_temp_address_delivery;
                }
            } elseif (
                isset($posted_data['shipping_address_value']) && $posted_data['shipping_address_value'] == 0
                && isset($posted_data['shipping_address_id'])
            ) {
                $id_delivery_address = $posted_data['shipping_address_id'];
            }
            $id_invoice_address = 0;
            if (isset($posted_data['use_for_invoice'])) {
                $id_invoice_address = $id_delivery_address;
            } elseif (
                ((isset($posted_data['payment_address_value']) && $posted_data['payment_address_value'] == 1)
                    || !isset($posted_data['payment_address_value']))
            ) {
                if (
                    isset($this->context->cookie->supercheckout_temp_address_invoice)
                    && $this->context->cookie->supercheckout_temp_address_invoice > 0
                ) {
                    $id_invoice_address = $this->context->cookie->supercheckout_temp_address_invoice;
                } else {
                    // changes done by kanishka on 16-12-2022 to prevent creating a new address instead of using the default id_address created with the cart
                    $temp_invoice_address = new Address($this->context->cookie->supercheckout_temp_address_invoice);
                    // changes done by kanishka on 16-12-2022 to prevent creating a new address instead of using the default id_address created with the cart
                    $temp_country_var = new Country((int) Configuration::get('PS_COUNTRY_DEFAULT'));

                    $temp_invoice_address->firstname = ' ';
                    $temp_invoice_address->lastname = ' ';
                    $temp_invoice_address->company = ' ';
                    $temp_invoice_address->address1 = ' ';
                    $temp_invoice_address->address2 = ' ';
                    $temp_invoice_address->phone_mobile = ' ';
                    $temp_invoice_address->vat_number = ' ';
                    $temp_invoice_address->city = ' ';
                    $temp_invoice_address->postcode = '0';
                    $temp_invoice_address->phone = ' ';
                    $temp_invoice_address->alias = Tools::substr($this->module->l('Address Alias') . ' - ' . date('s') . rand(0, 9), 0, 30);
                    $temp_invoice_address->other = ' ';
                    $temp_invoice_address->id_country = (int) Configuration::get('PS_COUNTRY_DEFAULT');
                    $temp_invoice_address->id_state = 0;

                    if ($temp_invoice_address->dni == '' && in_array('dni', AddressFormat::getFieldsRequired())) {
                        $temp_invoice_address->dni = '-';
                    }
                    if (!$temp_invoice_address->save()) {
                        $response['error']['general'][] = $this->module->l('Error occurred while creating new address', 'supercheckout');
                    }
                    $id_invoice_address = $temp_invoice_address->id;
                    $this->context->cookie->supercheckout_temp_address_invoice = $id_invoice_address;
                }
            } elseif (
                !isset($posted_data['use_for_invoice']) && isset($posted_data['payment_address_value'])
                && $posted_data['payment_address_value'] == 0
            ) {
                $id_invoice_address = $posted_data['payment_address_id'];
            }

            //////////////////////////Start - Plugin Validations //////////////////////////

            //Set User Type and password according to user type
            $check_new_password = 0;
            if (isset($posted_data['checkout_option']) && $posted_data['checkout_option'] != 0) {
                $checkout_option = 1;
                $check_new_password = $posted_data['checkout_option'];
            } else {
                $checkout_option = 0;
            }
            $user_type = ($checkout_option == 0) ? 'logged' : 'guest';



            if (isset($posted_data['profile_customers'])) {
                $user_type = 'logged';
                $existing_profile_datas = json_decode(Configuration::get('VELOCITY_SUPERCHECKOUT_CUSTOMER_PROFILE'), true);
                $profile_config = array();
                if (isset($existing_profile_datas) && !empty($existing_profile_datas)) {
                    foreach ($existing_profile_datas as $key => $data) {
                        if ($data['id_profile'] == $posted_data['profile_customers']) {
                            $profile_config = $existing_profile_datas[$key];
                            break;
                        }
                    }
                }
                $this->supercheckout_settings['shipping_address'] = $profile_config['profile_shipping_address'];
                $this->supercheckout_settings['payment_address'] = $profile_config['profile_payment_address'];
            }


            if (!$this->is_logged || Context::getContext()->customer->is_guest == 1) {
                $email = $posted_data['supercheckout_email'];

                if ($email == '') {
                    $response['error']['checkout_option'][] = array(
                        'key' => 'supercheckout_email',
                        'error' => $this->module->l('An email address required.')
                    );
                } elseif (!Validate::isEmail($email)) {
                    $response['error']['checkout_option'][] = array(
                        'key' => 'supercheckout_email',
                        'error' => $this->module->l('Invalid email address.')
                    );
                }  elseif (Customer::customerExists($email, false, false) && isset($posted_data['checkout_option'])) {
                    /* Changes done by Manish, Added check to only throw the error if the existing customer is a registered account (is_guest = 0).
                    @date 23-03-2026
                    @modifier Manish
                    MPMAR2026 email already exist issue 
                    */
                        $existingCustomer = new Customer();
                        $existingCustomer->getByEmail($email);
                        if (isset($existingCustomer->id) && $existingCustomer->id > 0 && !$existingCustomer->is_guest) {
                            $response['error']['checkout_option'][] = array(
                                'key' => 'supercheckout_email',
                                'error' => $this->module->l('This customer is already exist')
                            );
                        }
                }

                //Customer Personal Information
                foreach ($posted_data['customer_personal'] as $key => $value) {
                    if ($key != 'dob_days' && $key != 'dob_months' && $key != 'dob_years') {
                        if ($key == 'password') {
                            if ($check_new_password == 2) {
                                $new_password = $posted_data['customer_personal'][$key];
                                if ($new_password == '') {
                                    $response['error']['customer_personal'][] = array(
                                        'key' => $key,
                                        'error' => $this->module->l('Password is required.')
                                    );
                                } elseif (!(Tools::strlen($new_password) >= $this->password_length && Tools::strlen($new_password) < 255)) {
                                    $response['error']['customer_personal'][] = array(
                                        'key' => $key,
                                        'error' => sprintf($this->module->l('Invalid Password'), Validate::PASSWORD_LENGTH)
                                    );
                                }
                            }
                        } else {
                            if (
                                isset($this->supercheckout_settings['customer_personal'][$key][$user_type]['require'])
                                && $this->supercheckout_settings['customer_personal'][$key][$user_type]['require'] == 1
                                && !isset($posted_data['customer_personal'][$key])
                            ) {
                                $response['error']['customer_personal'][] = array(
                                    'key' => $key,
                                    'error' => $this->module->l('Required Field')
                                );
                            }
                        }
                    }
                }
                $check_dob = false;
                if (
                    isset($posted_data['customer_personal']['dob_days'])
                    && isset($posted_data['customer_personal']['dob_months'])
                    && isset($posted_data['customer_personal']['dob_years'])
                ) {
                    if ($this->supercheckout_settings['customer_personal']['dob'][($checkout_option == 0) ? 'logged' : 'guest']['require'] == 1 && $checkout_option == 1) {
                        $check_dob = true;

                        $year  = !empty($posted_data['customer_personal']['dob_years']) ? (int) $posted_data['customer_personal']['dob_years'] : null;
                        $month = !empty($posted_data['customer_personal']['dob_months']) ? (int) $posted_data['customer_personal']['dob_months'] : null;
                        $day   = !empty($posted_data['customer_personal']['dob_days']) ? (int) $posted_data['customer_personal']['dob_days'] : null;

                        if ($year && $month && $day) {
                            $birthday = sprintf('%04d-%02d-%02d', $year, $month, $day);
                            if ($birthday === '0000-00-00' || !Validate::isBirthDate($birthday)) {
                                $response['error']['customer_personal'][] = array(
                                    'key' => 'dob',
                                    'error' => $this->module->l('Invalid date of birth')
                                );
                            }
                        } else {
                            $response['error']['customer_personal'][] = array(
                                'key' => 'dob',
                                'error' => $this->module->l('Required Field')
                            );
                        }
                    }
                }
            } else {
                $checkout_option = 0;
            }

            $shipping_address_value = 1;
            if (isset($posted_data['shipping_address_value'])) {
                $shipping_address_value = $posted_data['shipping_address_value'];
            }

            $loop_index = 0;

	    /*
	    * Removed the check from the module configuration for fields like dni and vat because the validations for these fields are referred from the default prestashop.
	    * @modifier Himanshu Vishwakarma
	    * @date 23-02-2026
	    */
            if ((!$this->context->cart->isVirtualCart() && $shipping_address_value == 1) || (!$this->context->cart->isVirtualCart() && isset($posted_data['kbshipping_update_data']) && $posted_data['kbshipping_update_data'] == 1)) { // Code modified by Anshul to validate the shipping address details
                foreach ($posted_data['shipping_address'] as $key => $value) {
                    $add_plugin_config = $this->supercheckout_settings['shipping_address'][$key];
                    $is_field_required = ($add_plugin_config[$user_type]['require'] == 1);
                    if ($key == 'dni') {
                        $country_id = isset($posted_data['shipping_address']['id_country']) ? (int) $posted_data['shipping_address']['id_country'] : 0;
                        $is_field_required = $is_field_required || (in_array('dni', AddressFormat::getFieldsRequired()) && Country::isNeedDniByCountryId($country_id));
                    }
                    if ($is_field_required && $posted_data['shipping_address'][$key] == '') {
                        if ($key == 'dni') {
                            $country = new Country($posted_data['shipping_address']['id_country']);

                            /*Start: Code added by Anshul to validate the DNI in defined format for Spain if setting for the same is enabled (Feature:Spain DNI Check (Jan 2020))*/
                            if ($this->supercheckout_settings['enable_validation_dni'] == 1 && Tools::strtolower($country->iso_code) == 'es') {
                                $data = $this->checkNifCifDni($posted_data['shipping_address']['dni']);
                                if ($data == -1) {
                                    $response['error']['shipping_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid NIF.'));
                                } elseif ($data == -2) {
                                    $response['error']['shipping_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid CIF.'));
                                } elseif ($data == -3) {
                                    $response['error']['shipping_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid NIE.'));
                                } elseif ($data == 0) {
                                    $response['error']['shipping_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid DNI number'));
                                } else {
                                    $response['error']['shipping_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Required Field'));
                                }
                            } else {
                                /* DNI required by PrestaShop Set required fields - add Required Field error when empty (19-02-2025) */
                                $response['error']['shipping_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Required Field'));
                            }
                            /*End: Code added by Anshul to validate the DNI in defined format for Spain if setting for the same is enabled (Feature:Spain DNI Check (Jan 2020))*/
                        } else {
                            $response['error']['shipping_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Required Field'));
                        }
                    }

                    /*Start: Code added by Anshul to validate the DNI in defined format for Spain if setting for the same is enabled (Feature:Spain DNI Check (Jan 2020))*/
                    if ($key == 'dni') {
                        $country = new Country($posted_data['shipping_address']['id_country']);
                        if ($this->supercheckout_settings['enable_validation_dni'] == 1 && Tools::strtolower($country->iso_code) == 'es') {
                            $data = $this->checkNifCifDni($posted_data['shipping_address']['dni']);
                            if ($data == -1) {
                                $response['error']['shipping_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid NIF.'));
                            } elseif ($data == -2) {
                                $response['error']['shipping_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid CIF.'));
                            } elseif ($data == -3) {
                                $response['error']['shipping_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid NIE.'));
                            } elseif ($data == 0) {
                                $response['error']['shipping_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid DNI number'));
                            }
                        }
                    }
                    /*End: Code added by Anshul to validate the DNI in defined format for Spain if setting for the same is enabled (Feature:Spain DNI Check (Jan 2020))*/
                    if (
                        ($key == 'phone_mobile' || $key == 'phone') && !empty($posted_data['shipping_address'][$key])
                        && !(boolean) Validate::isPhoneNumber($posted_data['shipping_address'][$key])
                    ) {
                        $response['error']['shipping_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid phone number'));
                    }
                    if ($key == 'id_country') {
                        $country = new Country($posted_data['shipping_address'][$key]);
                        if ($posted_data['shipping_address'][$key] == 0) {
                            $response['error']['shipping_address'][$loop_index] = array(
                                'key' => $key,
                                'error' => $this->module->l('Required Field')
                            );
                        } elseif (!$country->active) {
                            $response['error']['shipping_address'][$loop_index] = array(
                                'key' => $key,
                                'error' => $this->module->l('This country is not active')
                            );
                        } elseif (
                            (int) $country->contains_states && (isset($posted_data['shipping_address']['id_state'])
                                && !(int) $posted_data['shipping_address']['id_state'])
                        ) {
                            $response['error']['shipping_address'][$loop_index] = array(
                                'key' => $key,
                                'error' => $this->module->l('This country requires you to chose a State')
                            );
                        }
                        if (
                            isset($posted_data['shipping_address']['postcode']) && !empty($posted_data['shipping_address']['postcode'])
                            && $postcode_error = $this->checkZipForCountry($country, $posted_data['shipping_address']['postcode'], true)
                        ) {
                            $response['error']['shipping_address'][$loop_index] = $postcode_error;
                        }

                        /* Check DNI: Supercheckout require OR PrestaShop Set required fields
			 * @modifier Himanshu Vishwakarma
			 * @date 23-02-2026
			 */
                        $dni_require_sc = ($this->supercheckout_settings['shipping_address']['dni'][$user_type]['require'] == 1);
                        $dni_require_ps = in_array('dni', AddressFormat::getFieldsRequired());
                        $country_id = $posted_data['shipping_address']['id_country'];
                        $is_applicable = Country::isNeedDniByCountryId($country_id);
                        if (($dni_require_sc || $dni_require_ps) && $is_applicable) {
                            if (isset($posted_data['shipping_address']['dni']) && ($posted_data['shipping_address']['dni'] == '' || !Validate::isDniLite($posted_data['shipping_address']['dni']))) {
                                $response['error']['shipping_address'][$loop_index] = array('key' => 'dni', 'error' => $this->module->l('DNI Error'));
                            }
                            /*changes made by Kanishka To check the dni is enabled for the country is not added in the module*/
                        }
                    }
                    if ($key == 'id_state' && $posted_data['shipping_address'][$key] == 0) {
                        if (Country::containsStates((int) $posted_data['shipping_address']['id_country'])) {
                            $response['error']['shipping_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Required Field'));
                        }
                    }

                    /* Start - Code Added by Raghu on 22-Aug-2017 for fixing 'VAT Number Required Validation' issue */
                    // if ($key == 'vat_number' && $this->isNeedVat($posted_data['profile_customers'], 'shipping_address') && empty($posted_data['shipping_address'][$key])) {
                    //     $response['error']['shipping_address'][$loop_index] = array(
                    //         'key' => $key,
                    //         'error' => $this->module->l('Required Field')
                    //     );
                    // }

                    if (
                            $key == 'vat_number' &&
                            isset($posted_data['profile_customers']) &&
                            $this->isNeedVat($posted_data['profile_customers'], 'shipping_address') &&
                            empty($posted_data['shipping_address'][$key])
                        ) {
                        $response['error']['shipping_address'][$loop_index] = array(
                            'key' => $key,
                            'error' => $this->module->l('Required Field')
                        );
                    }
                    /* End - Code Added by Raghu on 22-Aug-2017 for fixing 'VAT Number Required Validation' issue */

                    $loop_index++;
                }
            }

            $payment_address_value = 1;
            if (isset($posted_data['payment_address_value'])) {
                $payment_address_value = $posted_data['payment_address_value'];
            }

            if (!isset($posted_data['use_for_invoice'])) {
                $loop_index = 0;
                if ($payment_address_value == 1 || (!$this->context->cart->isVirtualCart() && isset($posted_data['kbpayment_update_data']) && $posted_data['kbpayment_update_data'] == 1)) {
                    foreach ($posted_data['payment_address'] as $key => $value) {
                        $add_plugin_config = $this->supercheckout_settings['payment_address'][$key];
                        /*
                         * For DNI: consider required if Supercheckout require OR PrestaShop Customers->Addresses->Set required fields
			 * @modifier Himanshu Vishwakarma
			 * @date 23-02-2026
                         */
                        $is_field_required_pay = ($add_plugin_config[$user_type]['require'] == 1);
                        if ($key == 'dni') {
                            $country_id_pay = isset($posted_data['payment_address']['id_country']) ? (int) $posted_data['payment_address']['id_country'] : 0;
                            $is_field_required_pay = $is_field_required_pay || (in_array('dni', AddressFormat::getFieldsRequired()) && Country::isNeedDniByCountryId($country_id_pay));
                        }
                        if ($is_field_required_pay && $posted_data['payment_address'][$key] == '') {
                            if ($key == 'dni') {
                                $country = new Country($posted_data['payment_address']['id_country']);
                                /*Start: Code added by Anshul to validate the DNI in defined format for Spain if setting for the same is enabled (Feature:Spain DNI Check (Jan 2020))*/
                                if ($this->supercheckout_settings['enable_validation_dni'] == 1 && Tools::strtolower($country->iso_code) == 'es') {
                                    $data = $this->checkNifCifDni($posted_data['payment_address']['dni']);
                                    if ($data == -1) {
                                        $response['error']['payment_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid NIF.'));
                                    } elseif ($data == -2) {
                                        $response['error']['payment_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid CIF.'));
                                    } elseif ($data == -3) {
                                        $response['error']['payment_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid NIE.'));
                                    } elseif ($data == 0) {
                                        $response['error']['payment_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid DNI number'));
                                    } else {
                                        $response['error']['payment_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Required Field'));
                                    }
                                } else {
                                    /* DNI required by PrestaShop Set required fields (19-02-2025) */
                                    $response['error']['payment_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Required Field'));
                                }
                                /*End: Code added by Anshul to validate the DNI in defined format for Spain if setting for the same is enabled (Feature:Spain DNI Check (Jan 2020))*/
                            } else {
                                $response['error']['payment_address'][$loop_index] = array(
                                    'key' => $key,
                                    'error' => $this->module->l('Required Field')
                                );
                            }
                        }

                        /*Start: Code added by Anshul to validate the DNI in defined format for Spain if setting for the same is enabled (Feature:Spain DNI Check (Jan 2020))*/
                        if ($key == 'dni') {
                            $country = new Country($posted_data['payment_address']['id_country']);
                            if ($this->supercheckout_settings['enable_validation_dni'] == 1 && Tools::strtolower($country->iso_code) == 'es') {
                                $data = $this->checkNifCifDni($posted_data['payment_address']['dni']);
                                if ($data == -1) {
                                    $response['error']['payment_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid NIF.'));
                                } elseif ($data == -2) {
                                    $response['error']['payment_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid CIF.'));
                                } elseif ($data == -3) {
                                    $response['error']['payment_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid NIE.'));
                                } elseif ($data == 0) {
                                    $response['error']['payment_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Invalid DNI number'));
                                }
                            }
                        }
                        /*End: Code added by Anshul to validate the DNI in defined format for Spain if setting for the same is enabled (Feature:Spain DNI Check (Jan 2020))*/
                        if (
                            ($key == 'phone_mobile' || $key == 'phone') && !empty($posted_data['payment_address'][$key])
                            && !(boolean) Validate::isPhoneNumber($posted_data['payment_address'][$key])
                        ) {
                            $response['error']['payment_address'][$loop_index] = array(
                                'key' => $key,
                                'error' => $this->module->l('Invalid phone number')
                            );
                        }
                        if ($key == 'id_country') {
                            $country = new Country($posted_data['payment_address'][$key]);
                            if ($posted_data['payment_address'][$key] == 0) {
                                $response['error']['payment_address'][$loop_index] = array('key' => $key, 'error' => $this->module->l('Required Field'));
                            } elseif (
                                (int) $country->contains_states && (isset($posted_data['payment_address']['id_state'])
                                    && !(int) $posted_data['payment_address']['id_state'])
                            ) {
                                $response['error']['payment_address'][$loop_index] = array(
                                    'key' => $key,
                                    'error' => $this->module->l('This country requires you to chose a State')
                                );
                            } elseif (!$country->active) {
                                $response['error']['payment_address'][$loop_index] = array(
                                    'key' => $key,
                                    'error' => $this->module->l('This country is not active')
                                );
                            }
                            if (
                                isset($posted_data['payment_address']['postcode']) && !empty($posted_data['payment_address']['postcode'])
                                && $postcode_error = $this->checkZipForCountry($country, $posted_data['payment_address']['postcode'])
                            ) {
                                $response['error']['payment_address'][$loop_index] = $postcode_error;
                            }

                            $dni_require_sc_pay = ($this->supercheckout_settings['payment_address']['dni'][$user_type]['require'] == 1);
                            $dni_require_ps_pay = in_array('dni', AddressFormat::getFieldsRequired());
                            $country_id_pay_block = isset($posted_data['payment_address']['id_country']) ? (int) $posted_data['payment_address']['id_country'] : (int) $posted_data['shipping_address']['id_country'];
                            $is_applicable_pay = Country::isNeedDniByCountryId($country_id_pay_block);
                            if (($dni_require_sc_pay || $dni_require_ps_pay) && $is_applicable_pay) {
                                if (isset($posted_data['payment_address']['dni']) && ($posted_data['payment_address']['dni'] == '' || !Validate::isDniLite($posted_data['payment_address']['dni']))) {
                                    $response['error']['payment_address'][$loop_index] = array(
                                        'key' => 'dni',
                                        'error' => $this->module->l('DNI Error')
                                    );
                                }
                                /*changes made by Kanishka To check the dni is enabled for the country is not added in the module*/
                            }
                        }
                        if ($key == 'id_state' && $posted_data['payment_address'][$key] == 0) {
                            if (Country::containsStates((int) $posted_data['payment_address']['id_country'])) {
                                $response['error']['payment_address'][$loop_index] = array(
                                    'key' => $key,
                                    'error' => $this->module->l('Required Field')
                                );
                            }
                        }
                        /* Start - Code Added by Raghu on 22-Aug-2017 for fixing 'VAT Number Required Validation' issue */
                        if ($key == 'vat_number' && $this->isNeedVat($posted_data['profile_customers'] ?? 0, 'payment_address') && empty($posted_data['payment_address'][$key])) {
                            $response['error']['payment_address'][$loop_index] = array(
                                'key' => $key,
                                'error' => $this->module->l('Required Field')
                            );
                        }
                        /* End - Code Added by Raghu on 22-Aug-2017 for fixing 'VAT Number Required Validation' issue */

                        $loop_index++;
                    }
                }
            }

             if (isset($response['error'])) {
                $continue = 0;
            }

            //////////////////////////End - Plugin Validations //////////////////////////

            if (
                $continue == 1 && !$this->context->cart->isVirtualCart() && ((isset($posted_data['shipping_address_value']) && $posted_data['shipping_address_value'] == 1)
                    || !isset($posted_data['shipping_address_value']))
            ) {
                // changes done by kanishka on 16-12-2022 to prevent creating a new address instead of using the default id_address created with the cart
                $delivery_address = new Address();
                // changes done by kanishka on 16-12-2022 to prevent creating a new address instead of using the default id_address created with the cart
                $delivery_address->firstname = (!empty($posted_data['shipping_address']['firstname'])) ? $posted_data['shipping_address']['firstname'] : ' ';

                $delivery_address->lastname = (!empty($posted_data['shipping_address']['lastname'])) ? $posted_data['shipping_address']['lastname'] : ' ';

                $delivery_address->company = (!empty($posted_data['shipping_address']['company'])) ? $posted_data['shipping_address']['company'] : ' ';

                $delivery_address->address1 = (!empty($posted_data['shipping_address']['address1'])) ? $posted_data['shipping_address']['address1'] : ' ';

                $delivery_address->address2 = (!empty($posted_data['shipping_address']['address2'])) ? $posted_data['shipping_address']['address2'] : ' ';

                $delivery_address->city = (!empty($posted_data['shipping_address']['city'])) ? $posted_data['shipping_address']['city'] : ' ';

                $delivery_address->phone = (!empty($posted_data['shipping_address']['phone'])) ? $posted_data['shipping_address']['phone'] : ' ';

                $delivery_address->phone_mobile = (!empty($posted_data['shipping_address']['phone_mobile']))
                    ? $posted_data['shipping_address']['phone_mobile']
                    : ' ';

                $delivery_address->id_country = (!empty($posted_data['shipping_address']['id_country']))
                    ? $posted_data['shipping_address']['id_country']
                    : (int) Configuration::get('PS_COUNTRY_DEFAULT');

                $delivery_address->postcode = (!empty($posted_data['shipping_address']['postcode'])) ? $posted_data['shipping_address']['postcode'] : 0;
                if (!Country::getNeedZipCode($delivery_address->id_country)) {
                    $delivery_address->postcode = '0';
                }

                $delivery_address->id_state = (!empty($posted_data['shipping_address']['id_state'])) ? $posted_data['shipping_address']['id_state'] : 0;
                if (!Country::containsStates($delivery_address->id_country)) {
                    $delivery_address->id_state = 0;
                }

                $delivery_address->vat_number = (!empty($posted_data['shipping_address']['vat_number'])) ? $posted_data['shipping_address']['vat_number'] : ' ';

                $delivery_address->dni = (!empty($posted_data['shipping_address']['dni'])) ? $posted_data['shipping_address']['dni'] : '-';

                $delivery_address->alias = (isset($posted_data['shipping_address']['alias']))
                    ? (empty($posted_data['shipping_address']['alias']))
                    ? Tools::substr($this->module->l('Address Alias') . ' - ' . date('s') . rand(0, 9), 0, 30)
                    : $posted_data['shipping_address']['alias']
                    : Tools::substr($this->module->l('Address Alias') . ' - ' . date('s') . rand(0, 9), 0, 30);
                $delivery_address->other = (!empty($posted_data['shipping_address']['other'])) ? $posted_data['shipping_address']['other'] : ' ';

                $delivery_address->id_customer = $id_customer;

                $validate_address = $delivery_address->validateController();
                if ($validate_address) {
                    $response['error']['shipping_address'] = array();
                    foreach ($validate_address as $key => $value) {
                        if ($key == '0') {
                            $response['error']['shipping_address'][] = array('key' => 'vat_number', 'error' => $value);
                        } else {
                            $response['error']['shipping_address'][] = array('key' => $key, 'error' => $value);
                        }
                    }
                } else {
                    if (!$delivery_address->save()) {
                        $response['error']['general'][] = $this->module('Error occurred while creating new address');
                    } else {
                        $id_delivery_address = $delivery_address->id;
                    }
                }
            } elseif ($continue == 1 && isset($posted_data['shipping_address_value']) && $posted_data['shipping_address_value'] == 0 && isset($posted_data['shipping_address_id']) && isset($posted_data['kbshipping_update_data'])) {
                $id_delivery_address = $posted_data['shipping_address_id'];

                // Code added by Anshul to update the shipping addresss

                $delivery_address = new Address((int) $id_delivery_address);

                $address_used = 0;
                $address_change = 0;
                if ($this->isUsed($id_delivery_address)) {
                    $address_used = 1;
                }

                if ($address_used == 1) {
                    if ($delivery_address->firstname != $posted_data['shipping_address']['firstname']) {
                        $address_change = 1;
                    } else if ($delivery_address->lastname != $posted_data['shipping_address']['lastname']) {
                        $address_change = 1;
                    } else if ($delivery_address->company != $posted_data['shipping_address']['company']) {
                        $address_change = 1;
                    } else if ($delivery_address->address1 != $posted_data['shipping_address']['address1']) {
                        $address_change = 1;
                    } else if ($delivery_address->address2 != $posted_data['shipping_address']['address2']) {
                        $address_change = 1;
                    } else if ($delivery_address->city != $posted_data['shipping_address']['city']) {
                        $address_change = 1;
                    } else if ($delivery_address->phone != $posted_data['shipping_address']['phone']) {
                        $address_change = 1;
                    } else if ($delivery_address->phone_mobile != $posted_data['shipping_address']['phone_mobile']) {
                        $address_change = 1;
                    } else if ($delivery_address->id_country != $posted_data['shipping_address']['id_country']) {
                        $address_change = 1;
                    } else if ($delivery_address->postcode != $posted_data['shipping_address']['postcode']) {
                        $address_change = 1;
                    } else if ($delivery_address->id_state != $posted_data['shipping_address']['id_state']) {
                        $address_change = 1;
                    } else if ($delivery_address->vat_number != $posted_data['shipping_address']['vat_number']) {
                        $address_change = 1;
                    } else if ($delivery_address->dni != $posted_data['shipping_address']['dni']) {
                        $address_change = 1;
                    } else if ($delivery_address->alias != $posted_data['shipping_address']['alias']) {
                        $address_change = 1;
                    }
                }

                if ($delivery_address->id_country == $posted_data['shipping_address']['id_country'] && $address_change == 0) {
                    $delivery_address->firstname = (!empty($posted_data['shipping_address']['firstname'])) ? $posted_data['shipping_address']['firstname'] : ' ';

                    $delivery_address->lastname = (!empty($posted_data['shipping_address']['lastname'])) ? $posted_data['shipping_address']['lastname'] : ' ';

                    $delivery_address->company = (!empty($posted_data['shipping_address']['company'])) ? $posted_data['shipping_address']['company'] : ' ';

                    $delivery_address->address1 = (!empty($posted_data['shipping_address']['address1'])) ? $posted_data['shipping_address']['address1'] : ' ';

                    $delivery_address->address2 = (!empty($posted_data['shipping_address']['address2'])) ? $posted_data['shipping_address']['address2'] : ' ';

                    $delivery_address->city = (!empty($posted_data['shipping_address']['city'])) ? $posted_data['shipping_address']['city'] : ' ';

                    $delivery_address->phone = (!empty($posted_data['shipping_address']['phone'])) ? $posted_data['shipping_address']['phone'] : ' ';

                    $delivery_address->phone_mobile = (!empty($posted_data['shipping_address']['phone_mobile'])) ? $posted_data['shipping_address']['phone_mobile'] : ' ';

                    $delivery_address->id_country = (!empty($posted_data['shipping_address']['id_country'])) ? $posted_data['shipping_address']['id_country'] : (int) Configuration::get('PS_COUNTRY_DEFAULT');

                    $delivery_address->postcode = (!empty($posted_data['shipping_address']['postcode'])) ? $posted_data['shipping_address']['postcode'] : 0;
                    if (!Country::getNeedZipCode($delivery_address->id_country)) {
                        $delivery_address->postcode = '0';
                    }

                    $delivery_address->id_state = (!empty($posted_data['shipping_address']['id_state'])) ? $posted_data['shipping_address']['id_state'] : 0;
                    if (!Country::containsStates($delivery_address->id_country)) {
                        $delivery_address->id_state = 0;
                    }

                    $delivery_address->vat_number = (!empty($posted_data['shipping_address']['vat_number'])) ? $posted_data['shipping_address']['vat_number'] : '';

                    $delivery_address->dni = (!empty($posted_data['shipping_address']['dni'])) ? $posted_data['shipping_address']['dni'] : '-';

                    $delivery_address->alias = (isset($posted_data['shipping_address']['alias'])) ? (empty($posted_data['shipping_address']['alias'])) ? Tools::substr($this->module->l('Address Alias') . ' - ' . date('s') . rand(0, 9), 0, 30) : $posted_data['shipping_address']['alias'] : Tools::substr($this->module->l('Address Alias') . ' - ' . date('s') . rand(0, 9), 0, 30);
                    $delivery_address->other = (!empty($posted_data['shipping_address']['other'])) ? $posted_data['shipping_address']['other'] : '';

                    $delivery_address->id_customer = $id_customer;

                    $validate_address = $delivery_address->validateController();
                    if ($validate_address) {
                        $response['error']['shipping_address'] = array();
                        foreach ($validate_address as $key => $value) {
                            if ($key == '0') {
                                $response['error']['shipping_address'][] = array(
                                    'key' => 'vat_number',
                                    'error' => $value
                                );
                            } else {
                                $response['error']['shipping_address'][] = array(
                                    'key' => $key,
                                    'error' => $value
                                );
                            }
                        }
                    } else {
                        if (!$delivery_address->update()) {
                            $response['error']['general'][] = $this->module('Error occurred while updating the address');
                        } else {
                            $id_delivery_address = $id_delivery_address;
                        }
                    }
                } else {
                    // changes done by kanishka on 16-12-2022 to prevent creating a new address instead of using the default id_address created with the cart
                    $delivery_address = new Address($this->context->cookie->supercheckout_temp_address_delivery);
                    // changes done by kanishka on 16-12-2022 to prevent creating a new address instead of using the default id_address created with the cart

                    $delivery_address->firstname = (!empty($posted_data['shipping_address']['firstname'])) ? $posted_data['shipping_address']['firstname'] : ' ';

                    $delivery_address->lastname = (!empty($posted_data['shipping_address']['lastname'])) ? $posted_data['shipping_address']['lastname'] : ' ';

                    $delivery_address->company = (!empty($posted_data['shipping_address']['company'])) ? $posted_data['shipping_address']['company'] : ' ';

                    $delivery_address->address1 = (!empty($posted_data['shipping_address']['address1'])) ? $posted_data['shipping_address']['address1'] : ' ';

                    $delivery_address->address2 = (!empty($posted_data['shipping_address']['address2'])) ? $posted_data['shipping_address']['address2'] : ' ';

                    $delivery_address->city = (!empty($posted_data['shipping_address']['city'])) ? $posted_data['shipping_address']['city'] : ' ';

                    $delivery_address->phone = (!empty($posted_data['shipping_address']['phone'])) ? $posted_data['shipping_address']['phone'] : ' ';

                    $delivery_address->phone_mobile = (!empty($posted_data['shipping_address']['phone_mobile'])) ? $posted_data['shipping_address']['phone_mobile'] : ' ';

                    $delivery_address->id_country = (!empty($posted_data['shipping_address']['id_country'])) ? $posted_data['shipping_address']['id_country'] : (int) Configuration::get('PS_COUNTRY_DEFAULT');

                    $delivery_address->postcode = (!empty($posted_data['shipping_address']['postcode'])) ? $posted_data['shipping_address']['postcode'] : 0;
                    if (!Country::getNeedZipCode($delivery_address->id_country)) {
                        $delivery_address->postcode = '0';
                    }

                    $delivery_address->id_state = (!empty($posted_data['shipping_address']['id_state'])) ? $posted_data['shipping_address']['id_state'] : 0;
                    if (!Country::containsStates($delivery_address->id_country)) {
                        $delivery_address->id_state = 0;
                    }

                    $delivery_address->vat_number = (!empty($posted_data['shipping_address']['vat_number'])) ? $posted_data['shipping_address']['vat_number'] : ' ';

                    $delivery_address->dni = (!empty($posted_data['shipping_address']['dni'])) ? $posted_data['shipping_address']['dni'] : '-';

                    $delivery_address->alias = (isset($posted_data['shipping_address']['alias'])) ? (empty($posted_data['shipping_address']['alias'])) ? Tools::substr($this->module->l('Address Alias') . ' - ' . date('s') . rand(0, 9), 0, 30) : $posted_data['shipping_address']['alias'] : Tools::substr($this->module->l('Address Alias') . ' - ' . date('s') . rand(0, 9), 0, 30);
                    $delivery_address->other = (!empty($posted_data['shipping_address']['other'])) ? $posted_data['shipping_address']['other'] : '';

                    $delivery_address->id_customer = $id_customer;

                    $validate_address = $delivery_address->validateController();
                    if ($validate_address) {
                        $response['error']['shipping_address'] = array();
                        foreach ($validate_address as $key => $value) {
                            if ($key == '0') {
                                $response['error']['shipping_address'][] = array('key' => 'vat_number', 'error' => $value);
                            } else {
                                $response['error']['shipping_address'][] = array('key' => $key, 'error' => $value);
                            }
                        }
                    } else {
                        if (!$delivery_address->save()) {
                            $response['error']['general'][] = $this->module('Error occurred while creating new address');
                        } else {
                            $id_delivery_address = $delivery_address->id;
                        }
                    }
                }
            }

            if (
                isset($posted_data['use_for_invoice']) && ((isset($posted_data['shipping_address_value']) && $posted_data['shipping_address_value'] == 1)
                    || !isset($posted_data['shipping_address_value']))
            ) {
                $invoice_address = $delivery_address;
                $id_invoice_address = $id_delivery_address;
            } elseif (
                isset($posted_data['use_for_invoice']) && isset($posted_data['shipping_address_value'])
                && $posted_data['shipping_address_value'] == 0
            ) {
                $id_invoice_address = $id_delivery_address;
            }

            if (
                $continue == 1 && !isset($posted_data['use_for_invoice']) && ((isset($posted_data['payment_address_value']) && $posted_data['payment_address_value'] == 1)
                    || !isset($posted_data['payment_address_value']))
            ) {
                // changes done by kanishka on 16-12-2022 to prevent creating a new address instead of using the default id_address created with the cart
                $invoice_address = new Address($this->context->cookie->supercheckout_temp_address_invoice);
                // changes done by kanishka on 16-12-2022 to prevent creating a new address instead of using the default id_address created with the cart
                $invoice_address->firstname = (!empty($posted_data['payment_address']['firstname']))
                    ? $posted_data['payment_address']['firstname'] : ' ';
                $invoice_address->lastname = (!empty($posted_data['payment_address']['lastname']))
                    ? $posted_data['payment_address']['lastname'] : ' ';
                $invoice_address->company = (!empty($posted_data['payment_address']['company']))
                    ? $posted_data['payment_address']['company'] : ' ';
                $invoice_address->address1 = (!empty($posted_data['payment_address']['address1']))
                    ? $posted_data['payment_address']['address1'] : ' ';
                $invoice_address->address2 = (!empty($posted_data['payment_address']['address2']))
                    ? $posted_data['payment_address']['address2'] : ' ';
                $invoice_address->city = (!empty($posted_data['payment_address']['city']))
                    ? $posted_data['payment_address']['city'] : ' ';
                $invoice_address->phone = (!empty($posted_data['payment_address']['phone']))
                    ? $posted_data['payment_address']['phone'] : ' ';
                $invoice_address->phone_mobile = (!empty($posted_data['payment_address']['phone_mobile']))
                    ? $posted_data['payment_address']['phone_mobile'] : ' ';
                $invoice_address->id_country = (!empty($posted_data['payment_address']['id_country']))
                    ? $posted_data['payment_address']['id_country'] : (int) Configuration::get('PS_COUNTRY_DEFAULT');
                $invoice_address->postcode = (!empty($posted_data['payment_address']['postcode']))
                    ? $posted_data['payment_address']['postcode'] : 0;
                if (!Country::getNeedZipCode($invoice_address->id_country)) {
                    $invoice_address->postcode = '0';
                }
                $invoice_address->id_state = (!empty($posted_data['payment_address']['id_state']))
                    ? $posted_data['payment_address']['id_state'] : 0;
                if (!Country::containsStates($invoice_address->id_country)) {
                    $invoice_address->id_state = 0;
                }
                $invoice_address->vat_number = (!empty($posted_data['payment_address']['vat_number']))
                    ? $posted_data['payment_address']['vat_number'] : ' ';
                $invoice_address->dni = (!empty($posted_data['payment_address']['dni']))
                    ? $posted_data['payment_address']['dni'] : '-';
                $invoice_address->alias = (isset($posted_data['payment_address']['alias']))
                    ? (empty($posted_data['payment_address']['alias']))
                    ? Tools::substr($this->module->l('Address Alias') . ' - ' . date('s') . rand(0, 9), 0, 30)
                    : $posted_data['payment_address']['alias']
                    : Tools::substr($this->module->l('Address Alias') . ' - ' . date('s') . rand(0, 9), 0, 30);
                $invoice_address->other = (!empty($posted_data['payment_address']['other'])) ? $posted_data['payment_address']['other'] : ' ';
                $invoice_address->id_customer = $id_customer;

                $validate_address = $invoice_address->validateController();
                if ($validate_address) {
                    $response['error']['payment_address'] = array();
                    foreach ($validate_address as $key => $value) {
                        if ($key == '0') {
                            $response['error']['payment_address'][] = array('key' => 'vat_number', 'error' => $value);
                        } else {
                            $response['error']['payment_address'][] = array('key' => $key, 'error' => $value);
                        }
                    }
                } else {
                    if (!$invoice_address->save()) {
                        $response['error']['general'][] = $this->module('Error occurred while creating new address');
                    } else {
                        $id_invoice_address = $invoice_address->id;
                    }
                }
            } elseif ($continue == 1 && !isset($posted_data['use_for_invoice']) && isset($posted_data['payment_address_value']) && $posted_data['payment_address_value'] == 0 && isset($posted_data['payment_address_id']) && isset($posted_data['kbpayment_update_data'])) { // Code added by Anshul to update the invoice address
                $id_invoice_address = $posted_data['payment_address_id'];
                $invoice_address = new Address((int) $id_invoice_address);

                $address_used = 0;
                $address_change = 0;
                if ($this->isUsed($id_invoice_address)) {
                    $address_used = 1;
                }

                if ($address_used == 1) {
                    if ($invoice_address->firstname != $posted_data['payment_address']['firstname']) {
                        $address_change = 1;
                    } else if ($invoice_address->lastname != $posted_data['payment_address']['lastname']) {
                        $address_change = 1;
                    } else if ($invoice_address->company != $posted_data['payment_address']['company']) {
                        $address_change = 1;
                    } else if ($invoice_address->address1 != $posted_data['payment_address']['address1']) {
                        $address_change = 1;
                    } else if ($invoice_address->address2 != $posted_data['payment_address']['address2']) {
                        $address_change = 1;
                    } else if ($invoice_address->city != $posted_data['payment_address']['city']) {
                        $address_change = 1;
                    } else if ($invoice_address->phone != $posted_data['payment_address']['phone']) {
                        $address_change = 1;
                    } else if ($invoice_address->phone_mobile != $posted_data['payment_address']['phone_mobile']) {
                        $address_change = 1;
                    } else if ($invoice_address->id_country != $posted_data['payment_address']['id_country']) {
                        $address_change = 1;
                    } else if ($invoice_address->postcode != $posted_data['payment_address']['postcode']) {
                        $address_change = 1;
                    } else if ($invoice_address->id_state != $posted_data['payment_address']['id_state']) {
                        $address_change = 1;
                    } else if ($invoice_address->vat_number != $posted_data['payment_address']['vat_number']) {
                        $address_change = 1;
                    } else if ($invoice_address->dni != $posted_data['payment_address']['dni']) {
                        $address_change = 1;
                    } else if ($invoice_address->alias != $posted_data['payment_address']['alias']) {
                        $address_change = 1;
                    }
                }

                if ($invoice_address->id_country == $posted_data['payment_address']['id_country'] && $address_change == 0) {
                    $invoice_address->firstname = (!empty($posted_data['payment_address']['firstname'])) ? $posted_data['payment_address']['firstname'] : ' ';
                    $invoice_address->lastname = (!empty($posted_data['payment_address']['lastname'])) ? $posted_data['payment_address']['lastname'] : ' ';
                    $invoice_address->company = (!empty($posted_data['payment_address']['company'])) ? $posted_data['payment_address']['company'] : ' ';
                    $invoice_address->address1 = (!empty($posted_data['payment_address']['address1'])) ? $posted_data['payment_address']['address1'] : ' ';
                    $invoice_address->address2 = (!empty($posted_data['payment_address']['address2'])) ? $posted_data['payment_address']['address2'] : ' ';
                    $invoice_address->city = (!empty($posted_data['payment_address']['city'])) ? $posted_data['payment_address']['city'] : ' ';
                    $invoice_address->phone = (!empty($posted_data['payment_address']['phone'])) ? $posted_data['payment_address']['phone'] : ' ';
                    $invoice_address->phone_mobile = (!empty($posted_data['payment_address']['phone_mobile'])) ? $posted_data['payment_address']['phone_mobile'] : ' ';
                    $invoice_address->id_country = (!empty($posted_data['payment_address']['id_country'])) ? $posted_data['payment_address']['id_country'] : (int) Configuration::get('PS_COUNTRY_DEFAULT');
                    $invoice_address->postcode = (!empty($posted_data['payment_address']['postcode'])) ? $posted_data['payment_address']['postcode'] : 0;
                    if (!Country::getNeedZipCode($invoice_address->id_country)) {
                        $invoice_address->postcode = '0';
                    }
                    $invoice_address->id_state = (!empty($posted_data['payment_address']['id_state'])) ? $posted_data['payment_address']['id_state'] : 0;
                    if (!Country::containsStates($invoice_address->id_country)) {
                        $invoice_address->id_state = 0;
                    }
                    $invoice_address->vat_number = (!empty($posted_data['payment_address']['vat_number'])) ? $posted_data['payment_address']['vat_number'] : '';
                    $invoice_address->dni = (!empty($posted_data['payment_address']['dni'])) ? $posted_data['payment_address']['dni'] : '-';
                    $invoice_address->alias = (isset($posted_data['payment_address']['alias'])) ? (empty($posted_data['payment_address']['alias'])) ? Tools::substr($this->module->l('Address Alias') . ' - ' . date('s') . rand(0, 9), 0, 30) : $posted_data['payment_address']['alias'] : Tools::substr($this->module->l('Address Alias') . ' - ' . date('s') . rand(0, 9), 0, 30);
                    $invoice_address->other = (!empty($posted_data['payment_address']['other'])) ? $posted_data['payment_address']['other'] : '';
                    $invoice_address->id_customer = $id_customer;

                    $validate_address = $invoice_address->validateController();
                    if ($validate_address) {
                        $response['error']['payment_address'] = array();
                        foreach ($validate_address as $key => $value) {
                            if ($key == '0') {
                                $response['error']['payment_address'][] = array(
                                    'key' => 'vat_number',
                                    'error' => $value
                                );
                            } else {
                                $response['error']['payment_address'][] = array(
                                    'key' => $key,
                                    'error' => $value
                                );
                            }
                        }
                    } else {
                        if (!$invoice_address->update()) {
                            $response['error']['general'][] = $this->module('Error occurred while updating the address');
                        } else {
                            $id_invoice_address = $posted_data['payment_address_id'];
                        }
                    }
                } else {
                    // changes done by kanishka on 16-12-2022 to prevent creating a new address instead of using the default id_address created with the cart
                    $invoice_address = new Address($this->context->cookie->supercheckout_temp_address_invoice);
                    // changes done by kanishka on 16-12-2022 to prevent creating a new address instead of using the default id_address created with the cart
                    $invoice_address->firstname = (!empty($posted_data['payment_address']['firstname'])) ? $posted_data['payment_address']['firstname'] : ' ';
                    $invoice_address->lastname = (!empty($posted_data['payment_address']['lastname'])) ? $posted_data['payment_address']['lastname'] : ' ';
                    $invoice_address->company = (!empty($posted_data['payment_address']['company'])) ? $posted_data['payment_address']['company'] : ' ';
                    $invoice_address->address1 = (!empty($posted_data['payment_address']['address1'])) ? $posted_data['payment_address']['address1'] : ' ';
                    $invoice_address->address2 = (!empty($posted_data['payment_address']['address2'])) ? $posted_data['payment_address']['address2'] : ' ';
                    $invoice_address->city = (!empty($posted_data['payment_address']['city'])) ? $posted_data['payment_address']['city'] : ' ';
                    $invoice_address->phone = (!empty($posted_data['payment_address']['phone'])) ? $posted_data['payment_address']['phone'] : ' ';
                    $invoice_address->phone_mobile = (!empty($posted_data['payment_address']['phone_mobile'])) ? $posted_data['payment_address']['phone_mobile'] : ' ';
                    $invoice_address->id_country = (!empty($posted_data['payment_address']['id_country'])) ? $posted_data['payment_address']['id_country'] : (int) Configuration::get('PS_COUNTRY_DEFAULT');
                    $invoice_address->postcode = (!empty($posted_data['payment_address']['postcode'])) ? $posted_data['payment_address']['postcode'] : 0;
                    if (!Country::getNeedZipCode($invoice_address->id_country)) {
                        $invoice_address->postcode = '0';
                    }
                    $invoice_address->id_state = (!empty($posted_data['payment_address']['id_state'])) ? $posted_data['payment_address']['id_state'] : 0;
                    if (!Country::containsStates($invoice_address->id_country)) {
                        $invoice_address->id_state = 0;
                    }
                    $invoice_address->vat_number = (!empty($posted_data['payment_address']['vat_number'])) ? $posted_data['payment_address']['vat_number'] : ' ';
                    $invoice_address->dni = (!empty($posted_data['payment_address']['dni'])) ? $posted_data['payment_address']['dni'] : '-';
                    $invoice_address->alias = (isset($posted_data['payment_address']['alias'])) ? (empty($posted_data['payment_address']['alias'])) ? Tools::substr($this->module->l('Address Alias') . ' - ' . date('s') . rand(0, 9), 0, 30) : $posted_data['payment_address']['alias'] : Tools::substr($this->module->l('Address Alias') . ' - ' . date('s') . rand(0, 9), 0, 30);
                    $invoice_address->other = (!empty($posted_data['payment_address']['other'])) ? $posted_data['payment_address']['other'] : ' ';
                    $invoice_address->id_customer = $id_customer;

                    $validate_address = $invoice_address->validateController();
                    if ($validate_address) {
                        $response['error']['payment_address'] = array();
                        foreach ($validate_address as $key => $value) {
                            if ($key == '0') {
                                $response['error']['payment_address'][] = array('key' => 'vat_number', 'error' => $value);
                            } else {
                                $response['error']['payment_address'][] = array('key' => $key, 'error' => $value);
                            }
                        }
                    } else {
                        if (!$invoice_address->save()) {
                            $response['error']['general'][] = $this->module('Error occurred while creating new address');
                        } else {
                            $id_invoice_address = $invoice_address->id;
                        }
                    }
                }
            }

            //If any Error return
            if (isset($response['error'])) {
                $continue = 0;
            }

            $customer = null;

            if (!$this->is_logged && $continue == 1) {
                $original_password = '';
                if ($posted_data['checkout_option'] == 2) {
                    $_POST['is_new_customer'] = 1; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                    $_POST['passwd'] = $posted_data['customer_personal']['password']; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                    $original_password = Tools::getValue('passwd');
                } else {
                    $_POST['is_new_customer'] = 0; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                    $_POST['passwd'] = $this->generateRandomPassword(); //uniqid(rand(), true); // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                    if ($this->supercheckout_settings['enable_guest_register']) {
                        $_POST['is_new_customer'] = 1; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                        $original_password = Tools::getValue('passwd');
                    }
                }
                $_POST['email'] = $posted_data['supercheckout_email']; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                $_POST['id_gender'] = (isset($posted_data['customer_personal']['id_gender'])) ? $posted_data['customer_personal']['id_gender'] : 0; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.


                /* Start Code Modified By Priyanshu on 25-August-2020 to provide an option to admin to use shipping or payment address name while registering an account */
                if (isset($this->supercheckout_settings['enable_payment_address_name']) && $this->supercheckout_settings['enable_payment_address_name'] == 1) {
                    if (!empty($posted_data['payment_address']['firstname'])) {
                        if (
                            isset($posted_data['payment_address']['firstname']) && !empty($posted_data['payment_address']['firstname'])
                        ) {
                            $_POST['customer_firstname'] = $posted_data['payment_address']['firstname']; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                        } else {
                            $_POST['customer_firstname'] = ' '; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                        }
                    } else {
                        $_POST['customer_firstname'] = (isset($posted_data['shipping_address']['firstname'])) ? $posted_data['shipping_address']['firstname'] : ''; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                    }

                    if (!empty($posted_data['payment_address']['lastname'])) {
                        if (
                            isset($posted_data['payment_address']['lastname']) && !empty($posted_data['payment_address']['lastname'])
                        ) {
                            $_POST['customer_lastname'] = $posted_data['payment_address']['lastname']; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                        } else {
                            $_POST['customer_lastname'] = ' '; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                        }
                    } else {
                        $_POST['customer_lastname'] = (isset($posted_data['shipping_address']['lastname'])) ? $posted_data['shipping_address']['lastname'] : ''; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                    }
                } else {
                    if (empty($posted_data['shipping_address']['firstname']) && $this->supercheckout_settings['shipping_address']['firstname'][$user_type]['require'] == 0) {
                        if (isset($posted_data['payment_address']['firstname']) && !empty($posted_data['payment_address']['firstname'])) {
                            $_POST['customer_firstname'] = $posted_data['payment_address']['firstname']; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                        } else {
                            $_POST['customer_firstname'] = ' '; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                        }
                    } else {
                        $_POST['customer_firstname'] = (isset($posted_data['shipping_address']['firstname'])) ? $posted_data['shipping_address']['firstname'] : ''; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                    }

                    if (empty($posted_data['shipping_address']['lastname']) && $this->supercheckout_settings['shipping_address']['lastname'][$user_type]['require'] == 0) {
                        if (isset($posted_data['payment_address']['lastname']) && !empty($posted_data['payment_address']['lastname'])) {
                            $_POST['customer_lastname'] = $posted_data['payment_address']['lastname']; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                        } else {
                            $_POST['customer_lastname'] = ' '; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                        }
                    } else {
                        $_POST['customer_lastname'] = (isset($posted_data['shipping_address']['lastname'])) ? $posted_data['shipping_address']['lastname'] : ''; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                    }
                }
                /* End Code Modified By Priyanshu on 25-August-2020 to provide an option to admin to use shipping or payment address name while registering an account */

                $blocknewsletter = Module::isInstalled('blocknewsletter')
                    && $module_newsletter = Module::getInstanceByName('blocknewsletter');
                if (isset($posted_data['customer_personal']['newsletter'])) {
                    if ($blocknewsletter && $module_newsletter->active) {
                        if (
                            is_callable(array($module_newsletter, 'isNewsletterRegistered'))
                            && $module_newsletter->isNewsletterRegistered(Tools::getValue('email')) != $module_newsletter::GUEST_REGISTERED
                        ) {
                            /* Force newsletter registration as customer as already registred as guest */
                            $_POST['newsletter'] = true; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                        }
                    }
                }
                $newsletter = (isset($posted_data['customer_personal']['newsletter'])) ? 1 : 0;
                $_POST['optin'] = (isset($posted_data['customer_personal']['optin'])) ? 1 : 0; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                if ($check_dob) {
                    $_POST['days'] = (isset($posted_data['customer_personal']['dob_days'])) ? $posted_data['customer_personal']['dob_days'] : ''; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                    $_POST['months'] = (isset($posted_data['customer_personal']['dob_months'])) ? $posted_data['customer_personal']['dob_months'] : ''; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                    $_POST['years'] = (isset($posted_data['customer_personal']['dob_years'])) ? $posted_data['customer_personal']['dob_years'] : ''; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                }

                Hook::exec('actionBeforeSubmitAccount');

                $flag = false;
                if ($islogged && $this->context->cookie->is_guest) {
                    $customer = new Customer((int) $this->context->cookie->id_customer);
                    $flag = true;
                } else {
                    $customer = new Customer();
                }

                $customer->id_gender = Tools::getValue('id_gender');
                $customer->firstname = Tools::getValue('customer_firstname');
                $customer->lastname = Tools::getValue('customer_lastname');
                /*
                 * Include company in customer object from personal or shipping only; billing company is used only in invoice address
                 * 23-02-2025
                 */
                $company = '';
                if (!empty($posted_data['customer_personal']['company'])) {
                    $company = $posted_data['customer_personal']['company'];
                } elseif (!empty($posted_data['shipping_address']['company'])) {
                    $company = $posted_data['shipping_address']['company'];
                }
                $customer->company = $company;
                $customer->email = Tools::getValue('email');
                $passwd = Tools::getValue('passwd');
                if (isset($passwd) && !empty($passwd)) {
                    if (version_compare(_PS_VERSION_, '8.0.0', '<')) {
                        if (!Validate::isPasswd($passwd)) {
                            $response['error']['general'][] = $this->module->l('Invalid Password');
                        }
                    } elseif (version_compare(_PS_VERSION_, '8.0.0', '>=')) {
                        if (!Validate::isAcceptablePasswordLength($passwd)) {
                            $response['error']['general'][] = $this->module->l('Invalid Password');
                        }
                    }
                }
                // ... existing code ...
                // For $passd = Tools::encrypt($original_passd);, just assign $passd = $original_passd; and use $customer->plain_password = $passd; where needed.
                /*
                 * Updated: Using manual password hashing for PrestaShop 9 compatibility
                 * @modifier Himanshu Vishwakarma
                 * @date 04-07-2025
                 */
                $customer->passwd = password_hash($passwd, PASSWORD_DEFAULT);
                $customer->newsletter = (bool) $newsletter;
                $customer->optin = Tools::getValue('optin');
                $customer->secure_key = md5(uniqid((string) rand(), true));
                // changes by rishabh jain for recaptcha integration
                $recaptcha_verification_status = 1;
                if (!$flag) {
                    if (Module::isInstalled('googlerecaptcha') && Module::isEnabled('googlerecaptcha')) {
                        //Testing for one page checkout is disabled and authentication is enabled
                        /**
                         * Start Changes to fix the issue of customer being able to login without verifying the recaptcha
                         * NASep2023 GOOGLE_RECAPTCHA 
                         * @date 26-09-2023
                         * @modifier Nikhil Aggarwal
                         */
                        $values = json_decode(Configuration::get('GOOGLE_RECAPTCHA'), true);
                        // Changes end by Nikhil
                        if (isset($values['enable']) && $values['enable'] == 1) {
                            if ($values['google_recaptcha']['check'][5] == 'on') {
                                $recaptch_type = $values['recaptcha_supercheckout'];
                                if ($recaptch_type == 'v2') {
                                    if (isset($this->context->cookie->check_login_attempt)) {
                                        $gr_set = $this->context->cookie->check_login_attempt + 1;
                                        $this->context->cookie->__set('check_login_attempt', $gr_set);
                                        if ($this->context->cookie->check_login_attempt > $values['attempts']) {
                                            $recaptcha_mod_obj = Module::getInstanceByName('googlerecaptcha');
                                            $recaptcha_verification_status = $recaptcha_mod_obj->v2RecaptchaVerificationSupercheckout($values);
                                        }
                                    }
                                } else {
                                    $recaptcha_mod_obj = Module::getInstanceByName('googlerecaptcha');
                                    $recaptcha_response = Tools::getValue('recaptcha_response', '');
                                    $recaptcha_verification_status = $recaptcha_mod_obj->v3RecaptchaVerificationSupercheckout($values, $recaptcha_response);
                                }
                                if ($recaptcha_verification_status == 1) {
                                    $this->context->cookie->__set('check_login_attempt', 0);
                                } elseif ($recaptcha_verification_status == 0) {
                                    $response['error']['general'][] = $this->module->l('Failed to verify.Try again.');
                                } elseif ($recaptcha_verification_status == 2) {
                                    $response['error']['general'][] = $this->module->l('Please verify the reCAPTCHA.');
                                }
                            }
                        }
                    }
                    if (isset($response['error'])) {
                        return $response;
                    }
                }

                // changes over
                if (isset($posted_data['customer_personal']['newsletter'])) {
                    $this->processCustomerNewsletter($customer);
                    /**
                     * Start Changes to fix the issue of email not being added in all the marketing platforms. Email id being added in only one platform as if else condition is used.
                     * Replacing elseif with if to add the email in all the enabled Marketing Platforms
                     * NADec2023 MARKETING_PLATFORMS
                     * @date 29-12-2023
                     * @modifier Nikhil Aggarwal
                     */
                    if ($this->supercheckout_settings['mailchimp']['enable'] == 1) {
                        $this->addEmailToList($customer->email, $customer->firstname, $customer->lastname);
                    }
                    if ($this->supercheckout_settings['SendinBlue']['enable'] == 1) {
                        $this->addEmailToListSendinBlue($customer->email, $customer->firstname, $customer->lastname);
                    }
                    if ($this->supercheckout_settings['klaviyo']['enable'] == 1) {
                        $this->addEmailToListKlaviyo($customer->email, $customer->firstname, $customer->lastname);
                    }
                    // Changes end by Nikhil
                }

                if ($check_dob) {
                    $customer->birthday = (int) Tools::getValue('years') . '-' . (int) Tools::getValue('months') . '-' . Tools::getValue('days');
                } else {
                    $customer->birthday = '';
                }

                $customer->active = 1;

                if ($flag) {
                    $customer->update(true);
                } else {
                    // New Guest customer
                    if (Tools::isSubmit('is_new_customer')) {
                        $customer->is_guest = !Tools::getValue('is_new_customer', 1);
                    } else {
                        $customer->is_guest = 0;
                    }

                    if (!$customer->save()) {
                        $response['error']['general'][] = $this->module->l('An error occurred while creating your account.');
                    } else {
                        $customer->cleanGroups();
                        if (!$customer->is_guest) {
                            // we add the guest customer in the default customer group
                            $customer->addGroups(array((int) Configuration::get('PS_CUSTOMER_GROUP')));

                            if (!$this->sendConfirmationMail($customer, $original_password)) {
                                $response['warning'][] = $this->module->l('An error ocurred while sending account confirmation email');
                            }
                        } else {
                            $customer->addGroups(array((int) Configuration::get('PS_GUEST_GROUP')));
                        }

                        Hook::exec(
                            'actionCustomerAccountAdd',
                            array(
                                '_POST' => $_POST, // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
                                'newCustomer' => $customer
                            )
                        );
                        $id_customer = $customer->id;
                    }
                }
            } else {
                $id_customer = $this->context->customer->id;
            }

            if (!isset($response['error'])) {
                //start by dharmanshu for the issue fix related to customer profile 30-10-2021
                if (Validate::isLoadedObject($delivery_address) && $delivery_address != null) {
                    $delivery_address->id_customer = $id_customer;
                    if (!$delivery_address->save()) {
                        $response['error']['general'][] = $this->module('Error occurred while updating address');
                    } else {
                        $id_delivery_address = $delivery_address->id;
                    }
                    //mapping id profil with address start
                    if (isset($posted_data['profile_customers'])) {
                        $sql = 'INSERT INTO ' . _DB_PREFIX_ . 'kb_supercheckout_profile_mapping '
                            . 'SET id_profile = ' . (int) $posted_data['profile_customers']
                            . ',id_address = ' . (int) $id_delivery_address
                            . ', time_updated = now(), time_added = now()';
                        Db::getInstance()->execute($sql);
                    }
                    //mapping id profil with address end
                }
                //end by dharmanshu for the issue fix related to customer profile 30-10-2021

                /*
                 * When use_for_invoice is checked, invoice and delivery point to the same address; skip duplicate save (delivery already updated it)
                 * 23-02-2025
                 */
                $is_same_invoice_as_delivery = (isset($posted_data['use_for_invoice']) && (int) $id_invoice_address === (int) $id_delivery_address);
                if (!$is_same_invoice_as_delivery && Validate::isLoadedObject($invoice_address) && $invoice_address != null) {
                    $invoice_address->id_customer = $id_customer;
                    if (!$invoice_address->save()) {
                        $response['error']['general'][] = $this->module('Error occurred while updating address');
                    } else {
                        $id_invoice_address = $invoice_address->id;
                    }
                    //mapping id profil with address start
                    if (isset($posted_data['profile_customers'])) {
                        $sql = 'INSERT INTO ' . _DB_PREFIX_ . 'kb_supercheckout_profile_mapping '
                            . 'SET id_profile = ' . (int) $posted_data['profile_customers']
                            . ',id_address = ' . (int) $id_invoice_address
                            . ', time_updated = now(), time_added = now()';
                        Db::getInstance()->execute($sql);
                    }
                    //mapping id profil with address end
                }
            }

            if (isset($response['error'])) {
            }
            
            if (Tools::getIsset('custom_fields') && $this->nb_products > 0) {
                if (Tools::getIsset('use_for_invoice')) {
                    $use_for_invoice_early = Tools::getValue('use_for_invoice');
                } else {
                    $use_for_invoice_early = 'off';
                }
                $this->saveCustomfieldsData(
                    Tools::getValue('custom_fields'),
                    $use_for_invoice_early,
                    (Tools::getIsset('profile_customers')) ? Tools::getValue('profile_customers') : 0
                );
            }

            if (!isset($response['error'])) {
                // Add customer to the context
                if (!$this->is_logged) {
                    $this->context->customer = $customer;
                    $this->context->cookie->id_customer = (int) $customer->id;
                    $this->context->cookie->customer_lastname = $customer->lastname;
                    $this->context->cookie->customer_firstname = $customer->firstname;
                    $this->context->cookie->logged = 1;
                    $customer->logged = 1;
                    $this->context->cookie->is_guest = $customer->isGuest();
                    $this->context->cookie->email = $customer->email;
                    /*
                     * Ensure customer remains logged in after registration and order placement by storing password hash in cookie (required on newer PrestaShop versions)
                     * 26-02-2026
                     */
                    $this->context->cookie->passwd = $customer->passwd;
                    if (version_compare(_PS_VERSION_, '1.7.6.7', '>=')) {
                        $this->context->cookie->registerSession(new CustomerSession());
                    }
                }

                $this->context->cart->id_customer = (int) $id_customer;
                $this->context->cart->id_address_delivery = $id_delivery_address;
                $this->context->cart->id_address_invoice = $id_invoice_address;
                $this->context->cart->secure_key = $this->context->customer->secure_key;

                $this->context->cart->save();
                $this->context->cookie->id_cart = (int) $this->context->cart->id;
                $this->context->cookie->write();
                //As there is no multishipping, set each product delivery address with main delivery address
                $this->context->cart->setNoMultishipping();
                $this->context->cart->autosetProductAddress();
                /**
                 * Start changes to fix issue of saving custom field at the time of saving address
                 * NASep2023 custom_field_persistence
                 * @date 26-09-2023
                 * @modifier Nikhil Aggarwal
                 */
                /****** Custom Fields code *********/
                // Sending data for validation
                if (Tools::getIsset('use_for_invoice')) {
                    $use_for_invoice = Tools::getValue('use_for_invoice');
                } else {
                    $use_for_invoice = 'off';
                }
                /**
                 * Start Changes to not use isset with $_POST and $_GET and access these variables directly. Using Tools::getIsset() and Tools::getValue() instead to fix the PS Validator issue.
                 * Replacing isset($_POST['custom_fields']) with Tools::getIsset('custom_fields') and isset($_POST['profile_customers']) with Tools::getIsset('profile_customers')
                 * @NANov2023 $_POST_Tools_getIsset
                 * @date 16-11-2023
                 * @modifier Nikhil Aggarwal
                 */
                if (Tools::getIsset('custom_fields')) {
                    $custom_fields_response = $this->saveCustomfieldsData(Tools::getValue('custom_fields'), $use_for_invoice, (Tools::getIsset('profile_customers')) ? Tools::getValue('profile_customers') : 0);
                    // If there is some error in custom fields, then the whole form is not submitted
                    if (isset($custom_fields_response['error_occured']) && $custom_fields_response['error_occured'] == 1) {
                        $response['error']['general'][] = $this->module->l('Please provide required information. Check all the fields in the form.', 'supercheckout');
                        $response['custom_fields_errors'] = $custom_fields_response;
                        return $response;
                    }
                }
                // Changes end by Nikhil
            }
        } else {
            $response['error']['general'][] = $this->module->l('Your Cart is Empty');
        }

        if (!isset($response['error'])) {


            /**
             * Setting cookie for the selected payment address and shipping address in case of error. Also assign the address IDs to the cart 
             * @modifier Ashish Kumar
             * @date 06-05-2024
             * AKMay2024 stripe-checkout-compatible
             */
            $cart = new Cart($this->context->cart->id);
            $cart->id_address_delivery = $id_delivery_address;
            $cart->id_address_invoice = $id_invoice_address;
            $cart->update();

            $this->context->cookie->supercheckout_temp_address_invoice = $id_invoice_address;
            $this->context->cookie->supercheckout_temp_address_delivery = $id_delivery_address;

            $this->context->cookie->supercheckout_perm_address_delivery = $id_delivery_address;
            $this->context->cookie->supercheckout_perm_address_invoice = $id_invoice_address;
            $response['success'] = true;
        }

        return $response;
    }

    public function isUsed($id_address)
    {
        $result = (int) Db::getInstance(_PS_USE_SQL_SLAVE_)->getValue('
		SELECT COUNT(`id_order`) AS used
		FROM `' . _DB_PREFIX_ . 'orders`
		WHERE `id_address_delivery` = ' . (int) $id_address . '
		OR `id_address_invoice` = ' . (int) $id_address);

        return $result > 0 ? (int) $result : false;
    }

    public function initContent()
    {
        parent::initContent();

        /*
         * Start: Added by Anshul for file download
         */
        if (Tools::isSubmit('downloadFile')) {
            $this->module->downloadFile(Tools::getValue('id_field'));
        }
        /*
         * End: Added by Anshul for file download
         */

        $this->context->smarty->assign(
            array(
                'HOOK_LEFT_COLUMN' => null,
                'HOOK_RIGHT_COLUMN' => null
            )
        );

        /**
         * Start Changes to fix the issue of using php inbuilt functions directly in the tpl
         * Using custom modifier approach (registerPlugin)
         * NASep modifier_smarty
         * @date 25-09-2023
         * @modifier Nikhil Aggarwal
         */
        $this->context->smarty->registerPlugin("modifier", "stst", "strstr");
        // Changes end by Nikhil

        if (!$this->context->cart->nbProducts()) {
            /* Start Code Added by Priyanshu on 11-Feb-2021 to fix the Custom CSS and JS not working issue when the Cart is empty */
            $this->context->smarty->assign('settings', $this->supercheckout_settings);
            /* End Code Added by Priyanshu on 11-Feb-2021 to fix the Custom CSS and JS not working issue when the Cart is empty */
            $this->context->smarty->assign(array('empty' => true));

            if (version_compare(_PS_VERSION_, '1.7.8.0', '>=')) {
                $this->context->smarty->assign([
                    'display_transaction_updated_info' => Tools::getIsset('updatedTransaction'),
                    'tos_cms' => $this->getDefaultTermsAndConditions(),
                ]);
            }

            $email_require = 1;
            $mobile_login_data = json_decode(Configuration::get('KB_MOBILE_LOGIN'), true);
            if (isset($mobile_login_data) && $mobile_login_data['register_without_email'] == 1) {
                $email_require = 0;
            }

            if (Module::isInstalled('ps_checkout') && Module::isEnabled('ps_checkout')) {
                $this->context->smarty->assign('ps_checkout_enable', 1);
                $url = __PS_BASE_URI__;
                $this->context->smarty->assign('store_url', $url);
            } else {
                $url = __PS_BASE_URI__;
                $this->context->smarty->assign('store_url', $url);
                $this->context->smarty->assign('ps_checkout_enable', 0);
            }
            $this->context->smarty->assign('email_require', $email_require);

            $this->setTemplate('module:supercheckout/views/templates/front/supercheckout.tpl');
            return;
        }

        $page_data = array();

        //Addresses
        $default_country = (int) Configuration::get('PS_COUNTRY_DEFAULT');

        $countries = Country::getCountries((int) $this->context->cookie->id_lang, true);
        // <editor-fold defaultstate="collapsed" desc="Below code added by Harish on 23 Nov 2018 for Google AutoComplete Feature">
        if ($this->supercheckout_settings['enable_auto_detect_country'] == 1) {
            $ip_data = $this->getIpArray();

            foreach ($countries as $active_country) {
                if ($active_country['iso_code'] == $ip_data) {
                    $default_country = $active_country['id_country'];
                    break;
                }
            }
        }
        $page_data = array_merge($page_data, array('countries' => $countries));

        $islogged = (bool) ($this->context->customer->id && Customer::customerIdExistsStatic((int) $this->context->cookie->id_customer));
        if ($islogged && $this->context->cookie->is_guest) {
            $guest_data = $this->getGuestInformations();
            // changes done by kanishka on 08-12-2022
            $guest_information = str_replace("'", "%27", json_encode($guest_data));
            // changes done by kanishka on 08-12-2022
            $this->context->smarty->assign(array('guest_information' => $guest_information));
        }

        $translated_months = array();
        $months = Tools::dateMonths();
        foreach ($months as $i => $m) {
            $translated_months[$i] = $this->module->l($m);
        }

        //Load plugin Settings
        $custom_ssl_var = 0;
        if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on') {
            $custom_ssl_var = 1;
        }
        $supercheckout_url = $this->context->link->getModuleLink(
            'supercheckout',
            'supercheckout',
            array(),
            (bool) Configuration::get('PS_SSL_ENABLED')
        );
        $addon_url = __PS_BASE_URI__ . 'index.php?fc=module&module=supercheckoutpaymentaddon&controller=paymentaddon';
        $analytic_url = __PS_BASE_URI__ . 'index.php?fc=module&module=supercheckoutanalyticaddon&controller=analyticaddon';
        /* start-MK made changes to display layout based on the selected demo layout in the frontend */
        if (Configuration::get('VELOCITY_SUPERCHECKOUT_DEMO')) {
            if (isset($this->context->cookie->kb_supercheckout_demo) && $this->context->cookie->kb_supercheckout_demo) {
                $supercheckout_config = new Supercheckout();
                $default_setting = $supercheckout_config->getDefaultSettings();
                $demo_column = $this->context->cookie->kb_supercheckout_demo;
                if (!empty($this->supercheckout_settings)) {
                    $this->supercheckout_settings['layout'] = $demo_column;
                }
            }
        }
        /* End-MK made changes to display layout based on the selected demo layout in the frontend */
        /* changes started by rishabh jain to modfy the shipping address form html
         * on 2nd jan 18
         */
        $shipping_address_array = array();
        $enabled_shipping_address_field = array();
        $disabled_shipping_address_field = array();
        $two_column_elements = array();
        $address_field_elements = array('postcode', 'id_country', 'id_state', 'city');
        $two_column_fields = array();
        $mobile_field_array = array('phone', 'phone_mobile');
        foreach ($this->supercheckout_settings['shipping_address'] as $key => $value) {
            $user_type = ($this->is_logged) ? 'logged' : 'guest';
            if ($this->supercheckout_settings['shipping_address'][$key][$user_type]['display'] == '1') {
                $shipping_address_array[] = $key;
                $enabled_shipping_address_field[$key] = $this->supercheckout_settings['shipping_address'][$key];
                $enabled_shipping_address_field[$key]['html_format'] = 0;
            } else {
                $disabled_shipping_address_field[$key] = $this->supercheckout_settings['shipping_address'][$key];
                $disabled_shipping_address_field[$key]['html_format'] = 0;
            }
        }
        $last_key = '';
        $is_next_two_column = 0;
        foreach ($enabled_shipping_address_field as $key => $value) {
            if (!$is_next_two_column) {
                if ($key == 'lastname' || $key == 'firstname') {
                    foreach ($shipping_address_array as $k1 => $v1) {
                        if ($v1 == $key) {
                            if (isset($shipping_address_array[$k1 + 1]) && ($shipping_address_array[$k1 + 1] == 'lastname' || $shipping_address_array[$k1 + 1] == 'firstname')) {
                                $is_next_two_column = 1;
                                $enabled_shipping_address_field[$key]['html_format'] = 1;
                            }
                        }
                    }
                } elseif (in_array($key, $mobile_field_array)) {
                    foreach ($shipping_address_array as $k1 => $v1) {
                        if ($v1 == $key) {
                            if (isset($shipping_address_array[$k1 + 1]) && ($shipping_address_array[$k1 + 1] == 'phone' || $shipping_address_array[$k1 + 1] == 'phone_mobile')) {
                                $is_next_two_column = 1;
                                $enabled_shipping_address_field[$key]['html_format'] = 1;
                            }
                        }
                    }
                } elseif (in_array($key, $address_field_elements)) {
                    foreach ($shipping_address_array as $k1 => $v1) {
                        if ($v1 == $key) {
                            if (isset($shipping_address_array[$k1 + 1]) && (in_array($shipping_address_array[$k1 + 1], $address_field_elements))) {
                                $enabled_shipping_address_field[$key]['html_format'] = 1;
                                $is_next_two_column = 1;
                            }
                        }
                    }
                }
            } else {
                if (isset($enabled_shipping_address_field[$last_key]['html_format']) && $enabled_shipping_address_field[$last_key]['html_format'] == 1) {
                    $is_next_two_column = 0;
                    $enabled_shipping_address_field[$key]['html_format'] = 2;
                }
            }
            $last_key = $key;
        }
        $this->supercheckout_settings['shipping_address'] = array_merge($enabled_shipping_address_field, $disabled_shipping_address_field);

        // changes for two column layout of payment address
        $payment_address_array = array();
        $enabled_payment_address_field = array();
        $disabled_payment_address_field = array();
        $two_column_elements = array();
        $address_field_elements = array('postcode', 'id_country', 'id_state', 'city');
        $two_column_fields = array();
        $mobile_field_array = array('phone', 'phone_mobile');
        foreach ($this->supercheckout_settings['payment_address'] as $key => $value) {
            $user_type = ($this->is_logged) ? 'logged' : 'guest';
            if ($this->supercheckout_settings['payment_address'][$key][$user_type]['display'] == '1') {
                $payment_address_array[] = $key;
                $enabled_payment_address_field[$key] = $this->supercheckout_settings['payment_address'][$key];
                $enabled_payment_address_field[$key]['html_format'] = 0;
            } else {
                $disabled_payment_address_field[$key] = $this->supercheckout_settings['payment_address'][$key];
                $disabled_payment_address_field[$key]['html_format'] = 0;
            }
        }
        $last_key = '';
        $is_next_two_column = 0;
        foreach ($enabled_payment_address_field as $key => $value) {
            if (!$is_next_two_column) {
                if ($key == 'lastname' || $key == 'firstname') {
                    foreach ($payment_address_array as $k1 => $v1) {
                        if ($v1 == $key) {
                            if (isset($payment_address_array[$k1 + 1]) && ($payment_address_array[$k1 + 1] == 'lastname' || $payment_address_array[$k1 + 1] == 'firstname')) {
                                $is_next_two_column = 1;
                                $enabled_payment_address_field[$key]['html_format'] = 1;
                            }
                        }
                    }
                } elseif (in_array($key, $mobile_field_array)) {
                    foreach ($payment_address_array as $k1 => $v1) {
                        if ($v1 == $key) {
                            if (isset($payment_address_array[$k1 + 1]) && ($payment_address_array[$k1 + 1] == 'phone' || $payment_address_array[$k1 + 1] == 'phone_mobile')) {
                                $is_next_two_column = 1;
                                $enabled_payment_address_field[$key]['html_format'] = 1;
                            } else {
                                $enabled_payment_address_field[$key]['html_format'] = 0;
                            }
                        }
                    }
                } elseif (in_array($key, $address_field_elements)) {
                    foreach ($payment_address_array as $k1 => $v1) {
                        if ($v1 == $key) {
                            if (isset($payment_address_array[$k1 + 1]) && (in_array($payment_address_array[$k1 + 1], $address_field_elements))) {
                                $enabled_payment_address_field[$key]['html_format'] = 1;
                                $is_next_two_column = 1;
                            }
                        }
                    }
                } else {
                    $is_next_two_column = 0;
                }
            } else {
                if (isset($enabled_payment_address_field[$last_key]['html_format']) && $enabled_payment_address_field[$last_key]['html_format'] == 1) {
                    $is_next_two_column = 0;
                    $enabled_payment_address_field[$key]['html_format'] = 2;
                }
            }
            $last_key = $key;
        }
        $this->supercheckout_settings['payment_address'] = array_merge($enabled_payment_address_field, $disabled_payment_address_field);
        // changes over

        //customer profile data start
        $existing_profile_datas = json_decode(Configuration::get('VELOCITY_SUPERCHECKOUT_CUSTOMER_PROFILE'), true);
        $customer_profile_data = array();
        if (isset($existing_profile_datas) && !empty($existing_profile_datas)) {
            foreach ($existing_profile_datas as $key => $data) {
                if ($data['active'] == 1) {
                    $profile_data = array();
                    $profile_data['id_profile'] = $data['id_profile'];
                    $profile_data['field_label'] = $data['field_label'][$this->context->language->id];
                    $profile_data['shipping_address'] = $data['profile_shipping_address'];
                    $profile_data['payment_address'] = $data['profile_payment_address'];
                    if (isset($data['custom_fields'])) {
                        $profile_data['custom_fields'] = $data['custom_fields'];
                    }
                    $customer_profile_data[$data['id_profile']] = $profile_data;
                }
            }
        }
        $this->context->smarty->assign('customer_profiles', $customer_profile_data);
        //customer profile data end
        //get customer address and profile map data
        $sql = 'SELECT Distinct(id_address) FROM ' . _DB_PREFIX_ . 'address WHERE id_customer = ' . (int) $this->context->customer->id;
        $result_address = Db::getInstance()->executeS($sql);

        $ids_address = '0,';
        foreach ($result_address as $value) {
            $ids_address = $ids_address . ' ' . $value['id_address'] . ' ,';
        }
        $ids_address = Tools::substr($ids_address, 0, -1);

        $sql = 'SELECT id_profile, id_address FROM ' . _DB_PREFIX_ . 'kb_supercheckout_profile_mapping WHERE id_address IN (' . $ids_address . ')';
        $profile_mapping_data = Db::getInstance()->executeS($sql);
        $this->context->smarty->assign('profile_mapping_data', $profile_mapping_data);

        $plugin_settings = array(
            'plugin_name' => $this->name,
            'settings' => $this->supercheckout_settings,
            'module_image_path' => _PS_BASE_URL_SSL_ . _MODULE_DIR_ . 'supercheckout/views/img/front/',
            'module_url' => $supercheckout_url,
            'supercheckout_url' => $supercheckout_url,
            'sc_logout_url' => $this->context->link->getPageLink('index', true, null, 'mylogout'),
            'addon_url' => $addon_url,
            'analytic_url' => $analytic_url,
            'forgotten_link' => $this->context->link->getPageLink('password'),
            'my_account_url' => $this->context->link->getPageLink('my-account'),
            'module_tpl_dir' => $this->module_dir . 'views/templates/front/',
            'logged' => $this->is_logged,
            'default_country' => $default_country,
            'user_type' => ($this->is_logged) ? 'logged' : 'guest',
            'genders' => Gender::getGenders(),
            'years' => Tools::dateYears(),
            'months' => $translated_months,
            'days' => Tools::dateDays(),
            'need_vat' => $this->isNeedVat(),
            'need_dni' => $this->isNeedDni($default_country),
            'guest_enable_by_system' => Configuration::get('PS_GUEST_CHECKOUT_ENABLED'),
            'iso_code' => $this->context->language->iso_code,
            'is_virtual_cart' => $this->context->cart->isVirtualCart(),
            'cartRefreshURL' => $this->context->link->getModuleLink('ps_shoppingcart', 'ajax'),
            'PS_STOCK_MANAGEMENT' => Configuration::get('PS_STOCK_MANAGEMENT'),
            'check_dni_valid' => $this->supercheckout_settings['enable_validation_dni'] //Feature:Spain DNI Check (Jan 2020)
        );

        if ((bool) Configuration::get('PS_SSL_ENABLED') && $custom_ssl_var == 1) {
            $plugin_settings['module_image_path'] = _PS_BASE_URL_SSL_ . _MODULE_DIR_
                . 'supercheckout/views/img/front/';
        } else {
            $plugin_settings['module_image_path'] = _PS_BASE_URL_ . _MODULE_DIR_
                . 'supercheckout/views/img/front/';
        }

        $page_data = array_merge($page_data, $plugin_settings);

        $id_address_delivery = $this->checkout_session->getIdAddressDelivery();
        $id_address_invoice = $this->checkout_session->getIdAddressInvoice();
        if ($this->is_logged) {
            $customer_name = $this->context->customer->firstname . ' ' . $this->context->customer->lastname;
            $page_data = array_merge($page_data, array('customer_name' => $customer_name));
        }

        $this->loadCarriers($default_country, 0, 0, $id_address_delivery, $this->default_shipping_selected);

        $data = $this->getOrderExtraParams();
        $page_data = array_merge($page_data, $data);

        $page_data = array_merge(
            $page_data,
            array('id_address_delivery' => $id_address_delivery, 'id_address_invoice' => $id_address_invoice)
        );

        //Set Same Invoice Address in cookie for later use
        /*
        Fixes to  Only set default if not already set by user interaction
        @date 19-04-2026
        @modifier Manish
        * MPAPR2026 InvoiceCheckboxReset
        */
        if (!isset($this->context->cookie->isSameInvoiceAddress)) {
            $this->context->cookie->isSameInvoiceAddress = 1;
            $this->context->cookie->write();
        }

        //Message Titles
        $messages = array(
            'warning' => $this->module->l('Warning'),
            'product_remove_success' => $this->module->l('Products successfully removed'),
            'product_qty_update_success' => $this->module->l('Products quantity successfully updated')
        );

        $page_data = array_merge($page_data, $messages);
        $this->context->smarty->assign($page_data);
        // changes by rishabh jain
        /**
         * When a guest comes back to the supercheckout page again from the payment gateway page without making the payment, the module shows the customer is logged in
         * Passing 0 to is_logged if the is_guest is not empty and has a value of 1
         * NASep2023 guest_payment_gateway_cancel
         * @date 26-09-2023
         * @modifier Nikhil Aggarwal
         */
        $this->context->smarty->assign('logged', (!empty($this->context->cookie->is_guest) && $this->context->cookie->is_guest == 1) ? 0 : $this->is_logged);
        // Changes end by Nikhil
        // changes over
        $velsof_errors = array();
        if (isset($this->context->cookie->velsof_error) && $this->context->cookie->velsof_error) {
            $velsof_errors = json_decode($this->context->cookie->velsof_error, true);
            $this->context->cookie->velsof_error = null;
            $this->context->cookie->__unset($this->context->cookie->velsof_error);
        }

        if (isset($_REQUEST['message']) && Tools::getValue('message')) {
            $velsof_errors[] = Tools::getValue('message');
        }

        if (isset($_REQUEST['firstdataError']) && Tools::getValue('firstdataError')) {
            $velsof_errors[] = Tools::getValue('firstdataError');
        }

        $this->context->smarty->assign(array('velsof_errors' => $velsof_errors));

        //Added for showing Social Loginizer buttons on SuperCheckout page
        if (Module::isInstalled('socialloginizer') && Module::isEnabled('socialloginizer')) {
            $social_login_data = json_decode(Configuration::get('VELOCITY_SOCIAL_LOGINIZER'), true);
            if (isset($social_login_data['order'])) {
                $this->context->smarty->assign('show_on_supercheckout', $social_login_data['order']);
            } else {
                $this->context->smarty->assign('show_on_supercheckout', array());
            }
            unset($social_login_data);
        }

        /* Start - Code Modified by Priyanshu on 14-June-2019  to fix the issue of Privacy Policy URL field */
        $current_lang_id = $this->context->language->id;
        $this->context->smarty->assign('current_lang_id', $current_lang_id);
        /* End - Code Modified by Priyanshu on 14-June-2019  to fix the issue of Privacy Policy URL field */
        // Assigning Custon Fields Variables into the tpl
        $id_lang_current = $this->context->language->id;
        $array_fields = $this->getCustomFieldsDetails($id_lang_current);
        $this->context->smarty->assign('array_fields', $array_fields);

        if ($this->checkMobileLoginActive()) {
            $mobile_login_setting = json_decode(Configuration::get('KB_MOBILE_LOGIN'), true);
            $this->context->smarty->assign('mobileLoginActive', 1);
            $current_lang_id = $this->context->language->id;
            $mobileLoginobject = new KbMobileLogin();
            $total_active_country = $mobileLoginobject->getCountries($current_lang_id);
            $this->context->smarty->assign('total_active_country', $total_active_country);
            $kbmobile_front_url = $this->context->link->getModuleLink('kbmobilelogin', 'verification');
            $this->context->smarty->assign('kbmobile_front_url', $kbmobile_front_url);
            $this->context->smarty->assign('mobile_login_setting', $mobile_login_setting);
        }
        // changes by rishabh jain to add continue shopping button
        $this->context->smarty->assign('index_page_link', $this->context->link->getPageLink('index'));
        // chnages over


        //Start: Changes added by Anshul
        if (isset($this->supercheckout_settings['free_shipping_amount']) && !empty($this->supercheckout_settings['free_shipping_amount'])) {
            $this->showFreeShippingBannerCalculations();
        }
        $is_mobile = false;
        $this->mobile_detect = Context::getContext()->getMobileDetect();
        if ($this->mobile_detect->isMobile()) {
            $is_mobile = true;
            //start by dharmanshu for the exit popup module issue fix 7-11-2021
            $this->context->smarty->assign('is_sc_mobile', $is_mobile);
            //start by dharmanshu for the exit popup module issue fix 7-11-2021
        }
        //End: Changes added by Anshul

        //        //START: Added by Anshul for making compatible with ps_checkout
        $this->context->smarty->assign('ps_checkout_enabled', false);
        //END: Added by Anshul for making compatible with ps_checkout

        //START: Added by Anshul for creating/updating the data of all fields (Feature: Checkout Behavior (Jan 2020))
        $this->insertCartBehaviour();
        $this->checkSavedAddressAndUpdate();
        //End: Added by Anshul for creating/updating the data of all fields (Feature: Checkout Behavior (Jan 2020))

        //changes by vishal for gift the card compatibility
        if (Module::isInstalled('gifttheproduct') && Module::isEnabled('gifttheproduct')) {
            $config_gift = json_decode(Configuration::get('gift_the_product'), true);
            if ($config_gift['enable'] == 1) {
                $this->context->smarty->assign('HOOK_SHOPPING_CART', Hook::exec('displayShoppingCartFooter'));
            }
        }
        //changes end

        if (Tools::isSubmit('myPaypalLogin')) {
            if (Tools::isSubmit('myPaypalLogin')) {
                $this->social_login_type = 'paypal';
            }

            $user_data_from_social = $this->socialLogin();

            if (isset($user_data_from_social) && !empty($user_data_from_social)) {
                if ($this->loggedInCustomer($user_data_from_social)) {
                    if ($this->supercheckout_settings['social_login_popup']['enable'] == 1) {
                        echo '<script>window.opener.location.reload(true);window.close();</script>';
                        die;
                    } else {
                        Tools::redirect(
                            $this->context->link->getModuleLink(
                                'supercheckout',
                                'supercheckout',
                                array(),
                                (bool) Configuration::get('PS_SSL_ENABLED')
                            )
                        );
                    }
                }
            }
        } elseif (Tools::isSubmit('code') && Tools::isSubmit('login_type') && Tools::getValue('login_type') == 'paypal') {
            $this->social_login_type = 'paypal';
            $code = Tools::getValue('code');
            $paypalemail = '';
            if (Tools::isSubmit('login_email')) {
                $paypalemail = Tools::getValue('login_email');
                if (Customer::customerExists($paypalemail)) {
                    $errormsg = $this->module->l('Email already exist please choose another one');
                    $this->context->smarty->assign('errormsg', $errormsg);
                    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on') {
                        $custom_ssl_var = 1;
                    }
                    if ((bool) Configuration::get('PS_SSL_ENABLED') && $custom_ssl_var == 1) {
                        $module_dir = _PS_BASE_URL_SSL_ . __PS_BASE_URI__ . str_replace(_PS_ROOT_DIR_ . '/', '', _PS_MODULE_DIR_);
                    } else {
                        $module_dir = _PS_BASE_URL_ . __PS_BASE_URI__ . str_replace(_PS_ROOT_DIR_ . '/', '', _PS_MODULE_DIR_);
                    }
                    $this->context->smarty->assign('modulepath', $module_dir);
                    $this->setTemplate('module:socialloginizer/views/templates/front/paypal-email.tpl');
                }
            }
            $c_id = $this->supercheckout_settings['paypal_login']['client_id'];
            $c_sec = $this->supercheckout_settings['paypal_login']['client_secret'];
            if (isset($code) && $code != '') {
                $header = array();
                /* We have used base64_encode to encode the client Id and Client Secret according to the Paypal API , we cannot remove it for the validator */
                $header[] = 'Authorization: BASIC ' . base64_encode($c_id . ":" . $c_sec);
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, 'https://api.paypal.com/v1/oauth2/token');
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, "grant_type=client_credentials&&code=" . $code);
                curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                $result1 = curl_exec($ch);
                curl_close($ch);
                $token = json_decode($result1);
                if (isset($token->access_token) && $token->access_token != '') {
                    $pay_link2 = 'https://api.paypal.com/v1/identity/oauth2/userinfo?schema=openid&access_token=';
                    $ch = curl_init();
                    curl_setopt($ch, CURLOPT_URL, $pay_link2 . $token->access_token);
                    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                    curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    $result2 = curl_exec($ch);
                    curl_close($ch);
                    $data = json_decode($result2);
                }

                if (isset($data) && !empty($data)) {
                    if (isset($paypalemail) && $paypalemail != '') {
                        $social_data = array();
                        $full_name_arr = preg_split('#\s+#', $data->name, 2);
                        $social_data['first_name'] = $full_name_arr[0];
                        $social_data['last_name'] = isset($full_name_arr[1]) ? $full_name_arr[1] : '';
                        $social_data['email'] = $paypalemail;
                        $social_data['gender'] = 0;
                        $user_data_from_social = $social_data;
                    } else if (isset($data->email) && $data->email != '') {
                        $social_data = array();
                        $full_name_arr = preg_split('#\s+#', $data->name, 2);
                        $social_data['first_name'] = $full_name_arr[0];
                        $social_data['last_name'] = isset($full_name_arr[1]) ? $full_name_arr[1] : '';
                        $social_data['email'] = $data->email;
                        $social_data['gender'] = 0;
                        $user_data_from_social = $social_data;
                    } else {
                        if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on') {
                            $custom_ssl_var = 1;
                        }
                        if ((bool) Configuration::get('PS_SSL_ENABLED') && $custom_ssl_var == 1) {
                            $module_dir = _PS_BASE_URL_SSL_ . __PS_BASE_URI__ . str_replace(_PS_ROOT_DIR_ . '/', '', _PS_MODULE_DIR_);
                        } else {
                            $module_dir = _PS_BASE_URL_ . __PS_BASE_URI__ . str_replace(_PS_ROOT_DIR_ . '/', '', _PS_MODULE_DIR_);
                        }
                        $this->context->smarty->assign('modulepath', $module_dir);
                        $this->setTemplate('module:supercheckout/views/templates/front/paypal-email.tpl');
                        return;
                    }
                } else {
                    $this->context->cookie->velsof_error = json_encode(
                        array($this->module->l('Not able to login with social site'))
                    );
                    if ($this->supercheckout_settings['social_login_popup']['enable'] == 1) {
                        echo '<script>window.opener.location.reload(true);window.close();</script>';
                        die;
                    } else {
                        Tools::redirect(
                            $this->context->link->getModuleLink(
                                'supercheckout',
                                'supercheckout',
                                array(),
                                (bool) Configuration::get('PS_SSL_ENABLED')
                            )
                        );
                    }
                }
            } else {
                $this->context->cookie->velsof_error = json_encode(
                    array($this->module->l('Not able to login with social site'))
                );
                if ($this->supercheckout_settings['social_login_popup']['enable'] == 1) {
                    echo '<script>window.opener.location.reload(true);window.close();</script>';
                    die;
                } else {
                    Tools::redirect(
                        $this->context->link->getModuleLink(
                            'supercheckout',
                            'supercheckout',
                            array(),
                            (bool) Configuration::get('PS_SSL_ENABLED')
                        )
                    );
                }
            }

            if (count($user_data_from_social) > 0) {
                if ($this->loggedInCustomer($user_data_from_social)) {
                    if ($this->supercheckout_settings['social_login_popup']['enable'] == 1) {
                        echo '<script>window.opener.location.reload(true);window.close();</script>';
                        die;
                    } else {
                        Tools::redirect(
                            $this->context->link->getModuleLink(
                                'supercheckout',
                                'supercheckout',
                                array(),
                                (bool) Configuration::get('PS_SSL_ENABLED')
                            )
                        );
                    }
                }
            }
        }

        if (Module::isInstalled('ps_checkout') && Module::isEnabled('ps_checkout')) {
            $this->context->smarty->assign('ps_checkout_enable', 1);
            $url = __PS_BASE_URI__;
            /**
             * Start Changes for the compatibility with the PS Checkout module
             * Loading the front.js file of the PS CHeckout module on the basis of PS version as the files are different for the different PS versions
             * @date 30-05-2024
             * @modifier Nikhil Aggarwal
             */
            if (version_compare(_PS_VERSION_, '8.0.0.0', '>=')) {
                /**
                 * Start Changes to make the OPC module compatible with PS Checkout version 8.4
                 * Adding its front.js file if ps_checkout version is greater than or equal to 8.4
                 * @date 05-06-2024
                 * @modifier Nikhil Aggarwal
                 */
                $ps_checkout_module_data = Module::getInstanceByName('ps_checkout');
                if ($ps_checkout_module_data->version >= '8.4.0.0') {
                    $this->context->smarty->assign('store_url', _PS_BASE_URL_SSL_ . _MODULE_DIR_ . 'supercheckout/views/js/front/front8400.js');
                } else {
                    $this->context->smarty->assign('store_url', _PS_BASE_URL_SSL_ . _MODULE_DIR_ . 'supercheckout/views/js/front/front.js');
                }
                // Changes end by Nikhil for ps_checkout 8.4
            } else {
                $this->context->smarty->assign('store_url', _PS_BASE_URL_SSL_ . _MODULE_DIR_ . 'supercheckout/views/js/front/front7.js');
            }
        } else {
            $url = __PS_BASE_URI__;
            if (version_compare(_PS_VERSION_, '8.0.0.0', '>=')) {
                $this->context->smarty->assign('store_url', _PS_BASE_URL_SSL_ . _MODULE_DIR_ . 'supercheckout/views/js/front/front.js');
            } else {
                $this->context->smarty->assign('store_url', _PS_BASE_URL_SSL_ . _MODULE_DIR_ . 'supercheckout/views/js/front/front7.js');
            }
            // Changes end by Nikhil
            $this->context->smarty->assign('ps_checkout_enable', 0);
        }
        if (version_compare(_PS_VERSION_, '1.7.8.0', '>=')) {
            $this->context->smarty->assign([
                'display_transaction_updated_info' => Tools::getIsset('updatedTransaction'),
                'tos_cms' => $this->getDefaultTermsAndConditions(),
            ]);
        }
        /**
         * Check the shipping address is same as billing address or not for the current cart
         * @date 16-03-2023
         * @author Prvind Panday
         */
        if (isset($this->context->cart) && $this->context->cart->id) {
            if (isset($this->context->cart->id_address_delivery) && isset($this->context->cart->id_address_invoice)) {
                /**
                 * Start Changes to fix invoice checkbox being checked after saving address twice
                 * Read cookie value instead of hardcoding 1 so user's last choice is respected
                 * @date 19-04-2026
                 * @modifier Manish
                 * MPAPR2026 InvoiceCheckboxReset
                 */
               if ($this->context->cart->id_address_delivery != $this->context->cart->id_address_invoice) {
                    $this->context->smarty->assign('is_shipping_address_same_as_billing', 0);
                } else {
                    $sameInvoiceCookie = isset($this->context->cookie->isSameInvoiceAddress)
                        ? (int)$this->context->cookie->isSameInvoiceAddress
                        : 1;
                    $this->context->smarty->assign('is_shipping_address_same_as_billing', $sameInvoiceCookie);
                }
            } else {
                $this->context->smarty->assign('is_shipping_address_same_as_billing', 1);
            }
        } else {
            $this->context->smarty->assign('is_shipping_address_same_as_billing', 1);
        }
        /**
         * Start Changes to fix the issue with the dialog() because of jQuery
         * Assigning the path of the JS file in the TPL variable notifications_gritter_url
         * NANov2023 dialog_jquery
         * @date 20-11-2023
         * @modifier Nikhil Aggarwal
         */
        $this->context->smarty->assign('notifications_gritter_url', _PS_BASE_URL_SSL_ . _MODULE_DIR_ . 'supercheckout/views/js/front/notifications/jquery.gritter.min.js');
        /* Changes end by Nikhil */


        /**
         * Stripe Official module is installed and enabled, assigns the Stripe checkout js URL to our module
         * @modifier Ashish Kumar
         * @date 06-05-2024
         * AKMay2024 stripe-checkout-compatible
         */
        if (Module::isInstalled('stripe_official') && Module::isEnabled('stripe_official')) {

            $this->context->smarty->assign('stripe_checkout_url', _PS_BASE_URL_SSL_ . _MODULE_DIR_ . 'stripe_official/views/js/checkout.js');
        } else {
            // Assign a default value when the Stripe module is not present
            $this->context->smarty->assign('stripe_checkout_url', '');
        }

        /**
         * Setting cookie for the selected payment methods & loading the payment method html to assign to tpl
         * @modifier Ashish Kumar
         * @date 06-05-2024
         * AKMay2024 stripe-checkout-compatible
         */

        $payment_methods_html = '';

        $selected_payment_method_cookie = $this->default_payment_selected;
        if (!empty($this->context->cookie->selected_payment_method)) {
            $selected_payment_method_cookie = $this->context->cookie->selected_payment_method;
        }

        $payment_methods = $this->loadPaymentMethods($selected_payment_method_cookie);
        if (!empty($payment_methods['html'])) {
            $payment_methods_html = $payment_methods['html'];
        }
        $this->context->smarty->assign('payment_methods', $payment_methods_html);
        //End changes added
        $this->setTemplate('module:supercheckout/views/templates/front/supercheckout.tpl');
    }

    public function getDefaultTermsAndConditions()
    {
        $cms = new CMS((int) Configuration::get('PS_CONDITIONS_CMS_ID'), $this->context->language->id);

        if (!Validate::isLoadedObject($cms)) {
            return false;
        }

        $link = $this->context->link->getCMSLink($cms, $cms->link_rewrite, (bool) Configuration::get('PS_SSL_ENABLED'));

        $termsAndConditions = new TermsAndConditions();
        $termsAndConditions
            ->setText(
                '[' . $cms->meta_title . ']',
                $link
            )
            ->setIdentifier('terms-and-conditions-footer');

        return $termsAndConditions->format();
    }

    /**
     * Function defined to update the checkout behavior data if customer is logged in and has address saved.
     * Feature: Checkout Behavior (Jan 2020)
     */
    public function checkSavedAddressAndUpdate()
    {
        $address = $this->context->customer->getAddresses($this->context->language->id);
        //if customer is logged in & address exists then update all field data for current cart
        if (!empty($address) && count($address) > 0 && $this->context->customer->logged == 1) {
            $sql = 'SELECT * FROM ' . _DB_PREFIX_ . 'kb_checkout_behaviour_stats WHERE id_cart = ' . (int) $this->context->cart->id;
            $result = Db::getInstance()->getRow($sql);
            if (isset($result) && !empty($result) && $result != "" && $result) { //update
                $sql = 'UPDATE ' . _DB_PREFIX_ . 'kb_checkout_behaviour_stats '
                    . 'SET email = 1 '
                    . ',firstname = 1 '
                    . ',lastname = 1 '
                    . ',company = 1 '
                    . ',address1 = 1 '
                    . ',address2 = 1 '
                    . ',city = 1 '
                    . ',id_country = 1 '
                    . ',id_state = 1 '
                    . ',postcode = 1 '
                    . ',phone = 1 '
                    . ',phone_mobile = 1 '
                    . ',vat_number = 1 '
                    . ',dni = 1 '
                    . ',other = 1 '
                    . ',alias = 1 '
                    . ',firstname_invoice = 1 '
                    . ',lastname_invoice = 1 '
                    . ',company_invoice = 1 '
                    . ',address1_invoice = 1 '
                    . ',address2_invoice = 1 '
                    . ',city_invoice = 1 '
                    . ',id_country_invoice = 1 '
                    . ',id_state_invoice = 1 '
                    . ',postcode_invoice = 1 '
                    . ',phone_invoice = 1 '
                    . ',phone_mobile_invoice = 1 '
                    . ',vat_number_invoice = 1 '
                    . ',dni_invoice = 1 '
                    . ',other_invoice = 1 '
                    . ',alias_invoice = 1 '
                    . ' WHERE id_cart = ' . (int) $this->context->cart->id;
                Db::getInstance()->execute($sql);
            } else { //insert
                $sql = 'INSERT INTO ' . _DB_PREFIX_ . 'kb_checkout_behaviour_stats '
                    . 'SET email = 1 '
                    . ',firstname = 1 '
                    . ',lastname = 1 '
                    . ',company = 1 '
                    . ',address1 = 1 '
                    . ',address2 = 1 '
                    . ',city = 1 '
                    . ',id_country = 1 '
                    . ',id_state = 1 '
                    . ',postcode = 1 '
                    . ',phone = 1 '
                    . ',phone_mobile = 1 '
                    . ',vat_number = 1 '
                    . ',dni = 1 '
                    . ',other = 1 '
                    . ',alias = 1 '
                    . ',firstname_invoice = 1 '
                    . ',lastname_invoice = 1 '
                    . ',company_invoice = 1 '
                    . ',address1_invoice = 1 '
                    . ',address2_invoice = 1 '
                    . ',city_invoice = 1 '
                    . ',id_country_invoice = 1 '
                    . ',id_state_invoice = 1 '
                    . ',postcode_invoice = 1 '
                    . ',phone_invoice = 1 '
                    . ',phone_mobile_invoice = 1 '
                    . ',vat_number_invoice = 1 '
                    . ',dni_invoice = 1 '
                    . ',other_invoice = 1 '
                    . ',alias_invoice = 1 , date_add = now(), date_upd = now()';
                Db::getInstance()->execute($sql);
            }
        }
    }

    /*
     * Insert cart id in table to update the fields later when customer will fill the same
     * Feature: Checkout Behavior (Jan 2020)
     */
    protected function insertCartBehaviour()
    {
        $sql = 'SELECT * FROM ' . _DB_PREFIX_ . 'kb_checkout_behaviour_stats WHERE id_cart = ' . (int) $this->context->cart->id;
        $result = Db::getInstance()->getRow($sql);
        if (isset($result) && !empty($result) && $result != "") {
        } else {
            $sql = "INSERT INTO " . _DB_PREFIX_ . "kb_checkout_behaviour_stats (id_cart, date_add, date_upd) VALUES (" . (int) $this->context->cart->id . ", '" . pSQL(date('Y-m-d H:i:s', time())) . "', '" . pSQL(date('Y-m-d H:i:s', time())) . "')";
            Db::getInstance()->execute($sql);
        }
    }

    /*
     * Update the field behaviour in the table according to user activity
     * Feature: Checkout Behavior (Jan 2020)
     */
    protected function updateCheckoutBehaviour()
    {
        if (Tools::getValue('filled') == 'true') {
            $filled = 1;
        } else {
            $filled = 0;
        }
        $field_name = (Tools::getValue('field_name') != '') ? Tools::getValue('field_name') : '';
        if ($field_name == 'use_for_invoice') {
            $this->updateSameAsShippingAddressDataInInvoice($filled);
        }
        $sql = 'SELECT * FROM ' . _DB_PREFIX_ . 'kb_checkout_behaviour_stats WHERE id_cart = ' . (int) $this->context->cart->id;
        $result = Db::getInstance()->getRow($sql);
        if (isset($result) && !empty($result) && $result != "") {
            //check if column exists or not
            $check_col_sql = 'SELECT count(*) FROM information_schema.COLUMNS
                               WHERE COLUMN_NAME = "' . pSQL($field_name) . '"
                               AND TABLE_NAME = "' . _DB_PREFIX_ . 'kb_checkout_behaviour_stats"
                               AND TABLE_SCHEMA = "' . _DB_NAME_ . '"';
            $check_col = Db::getInstance(_PS_USE_SQL_SLAVE_)->getValue($check_col_sql);
            if ($check_col == 1) {
                $sql = 'UPDATE ' . _DB_PREFIX_ . 'kb_checkout_behaviour_stats SET ' . pSQL($field_name) . ' = ' . (int) $filled . ' WHERE id_cart = ' . (int) $this->context->cart->id;
                Db::getInstance()->execute($sql);
                if ((Tools::getValue('use_for_invoice') == 'true' || Tools::getValue('use_for_invoice') == true) && $field_name != 'email' && (strpos($field_name, '_invoice') == false)) {
                    $sql = 'UPDATE ' . _DB_PREFIX_ . 'kb_checkout_behaviour_stats SET ' . pSQL($field_name) . '_invoice = ' . (int) $filled . ' WHERE id_cart = ' . (int) $this->context->cart->id;
                    Db::getInstance()->execute($sql);
                }
            }
        } else {
            $this->insertCartBehaviour();
        }
        /** Start Changes to add the Payment Fee on Checkout
         * Adding/Updating the data of the fee in the table kb_supercheckout_payment_fee according to the user activity
         * @date 15-10-2024
         * NAOct2024 payment_fee
         * @modifier Nikhil Aggarwal 
         */
        if ($field_name == 'payment_method') {
            $sql = 'SELECT * FROM ' . _DB_PREFIX_ . 'kb_supercheckout_payment_fee WHERE id_cart = ' . (int) $this->context->cart->id;
            $payment_fee = Db::getInstance()->getRow($sql);
            if (isset($payment_fee) && !empty($payment_fee) && $payment_fee != "") {
            } else {
                $sql = "INSERT INTO " . _DB_PREFIX_ . "kb_supercheckout_payment_fee (id_order, id_cart, id_module, paymentfee_applicable) VALUES (0," . (int) $this->context->cart->id . ",0,0)";
                Db::getInstance()->execute($sql);
            }
        }
        // Changes end by Nikhil
    }

    /**
     * Function defined to update the data of Invoice Address according to "Use for invoice" field
     * Feature: Checkout Behavior (Jan 2020)
     * @param int $filled
     */
    protected function updateSameAsShippingAddressDataInInvoice($filled)
    {
        if ($filled == 1) {
            //update all invoice address field to 0 if Use For Invoice field is unchecked
            $sql = 'UPDATE ' . _DB_PREFIX_ . 'kb_checkout_behaviour_stats '
                . 'SET firstname_invoice = 0 '
                . ',lastname_invoice = 0 '
                . ',company_invoice = 0 '
                . ',address1_invoice = 0 '
                . ',address2_invoice = 0 '
                . ',city_invoice = 0 '
                . ',id_country_invoice = 0 '
                . ',id_state_invoice = 0 '
                . ',postcode_invoice = 0 '
                . ',phone_invoice = 0 '
                . ',phone_mobile_invoice = 0 '
                . ',vat_number_invoice = 0 '
                . ',dni_invoice = 0 '
                . ',other_invoice = 0 '
                . ',alias_invoice = 0 '
                . ' WHERE id_cart = ' . (int) $this->context->cart->id;
            Db::getInstance()->execute($sql);
        } elseif ($filled == 0) {
            //update all invoice address field to same as shipping address field if Use For Invoice field is checked
            $sql = 'SELECT * FROM ' . _DB_PREFIX_ . 'kb_checkout_behaviour_stats WHERE id_cart = ' . (int) $this->context->cart->id;
            $result = Db::getInstance()->getRow($sql);
            if (isset($result) && !empty($result) && $result != "") {
                $sql = 'UPDATE ' . _DB_PREFIX_ . 'kb_checkout_behaviour_stats '
                    . 'SET firstname_invoice = ' . $result['firstname'] . ' '
                    . ', lastname_invoice = ' . $result['lastname'] . ' '
                    . ', company_invoice = ' . $result['company'] . ' '
                    . ', address1_invoice = ' . $result['address1'] . ' '
                    . ', address2_invoice = ' . $result['address2'] . ' '
                    . ', city_invoice = ' . $result['city'] . ' '
                    . ', id_country_invoice = ' . $result['id_country'] . ' '
                    . ', id_state_invoice = ' . $result['id_state'] . ' '
                    . ', postcode_invoice = ' . $result['postcode'] . ' '
                    . ', phone_invoice = ' . $result['phone'] . ' '
                    . ', phone_mobile_invoice = ' . $result['phone_mobile'] . ' '
                    . ', vat_number_invoice = ' . $result['vat_number'] . ' '
                    . ', dni_invoice = ' . $result['dni'] . ' '
                    . ', other_invoice = ' . $result['other'] . ' '
                    . ', alias_invoice = ' . $result['alias'] . ' '
                    . ' WHERE id_cart = ' . (int) $this->context->cart->id;
                Db::getInstance()->execute($sql);
            }
        }
    }

    /**
     * Generate the url to the order validation controller
     * Function is used from ps_checkout module.
     * @param string $orderId order id paypal
     * @param string $paymentMethod can be 'card' or 'paypal'
     *
     * @return string
     */
    private function getValidateOrderLink($orderId, $paymentMethod)
    {
        return $this->context->link->getModuleLink(
            $this->name,
            'ValidateOrder',
            [
                'orderId' => $orderId,
                'paymentMethod' => $paymentMethod,
            ],
            true
        );
    }

    /*
     * Added by Anshul to calculate the amount and percentage for showing Free Shipping Banner
     */
    public function showFreeShippingBannerCalculations()
    {
        $percent = 0;
        $amount = 0;
        $calc2 = 0;
        $remaining_amount = 0;
        if (context::getContext()->cart->isVirtualCart()) {
            return false;
        }
        $free_shipping_amount = $this->supercheckout_settings['free_shipping_amount'];
        // changes done by kanishka, when free shipping method is selected then banner show the 100%
        $is_free = 0;
        if (!empty(Tools::getValue('shippingId'))) {
            $shippingId_array = explode(',', Tools::getValue('shippingId'));
            $carrier = new Carrier($shippingId_array[0]);
            $is_free = $carrier->is_free;
        }
        // changes done by kanishka, when free shipping method is selected then banner show the 100%

        /**
         * changes done by kanishka, to check if tax included or not
         * @date 21-03-2023
         */
        if ($this->supercheckout_settings['total_price_method']['default'] == 2) {
            $total_cart_amount = $this->context->cart->getOrderTotal(false, Cart::ONLY_PRODUCTS);
        } else {
            $total_cart_amount = $this->context->cart->getOrderTotal(true, Cart::ONLY_PRODUCTS);
        }
        if (Configuration::get('PS_CURRENCY_DEFAULT') != $this->context->currency->id) {
            $free_shipping_amount = Tools::convertPrice($free_shipping_amount, (int) $this->context->currency->id);
        }

        /*
         * Fixed free shipping banner calculation logic to properly handle all scenarios
         * @modifier Himanshu Vishwakarma
         * @date 04-07-2025
         */

        // If free shipping method is selected, show 100% completion
        if ($is_free == 1) {
            $percent = 100;
            $amount = 0;
            $remaining_amount = '';
        }
        // If cart total is greater than or equal to free shipping amount, show 100% completion
        elseif ($total_cart_amount >= $free_shipping_amount) {
            $percent = 100;
            $amount = 0;
            $remaining_amount = '';
        }
        // If cart total is less than free shipping amount, calculate the percentage
        elseif ($free_shipping_amount > $total_cart_amount) {
            $calc1 = ($total_cart_amount / $free_shipping_amount);
            $percent = round($calc1 * 100, 1);
            $amount = $free_shipping_amount - $total_cart_amount;
            /*
             * Replaced Tools::displayPrice with PriceFormatter for PS9 compatibility
             * @modifier Himanshu Vishwakarma
             * @date 04-07-2025
             */
            $priceFormatter = new PriceFormatter();
            $remaining_amount = $priceFormatter->format($amount, $this->context->currency->id);
        }

        $this->context->smarty->assign('kb_free_shipping_percent', $percent);
        $this->context->smarty->assign('kb_free_shipping_amount', $remaining_amount);
        $this->context->smarty->assign('hidden_amount', $amount);
    }

    public function checkMobileLoginActive()
    {
        if (Module::isInstalled('kbmobilelogin') && Module::isEnabled('kbmobilelogin')) {
            $mobileLoginSettings = json_decode(Configuration::get('KB_MOBILE_LOGIN'), true);
            $settings = json_decode(Configuration::get('VELOCITY_SUPERCHECKOUT'), true);
            if ($mobileLoginSettings['enable'] && ($mobileLoginSettings['show_mobile_on_registration'] || $mobileLoginSettings['login_by_mobile'] || $mobileLoginSettings['login_by_otp']) && isset($settings['mobile_login']['enable']) && $settings['mobile_login']['enable']) {
                return true;
            }
        }
        return false;
    }

    /*
     * Function modified by RS for fixing the pSQL() errors reported by PrestaShop Addons team
     */
    private function getCustomFieldsDetails($id_lang_current)
    {
        $id_lang = $this->context->cookie->id_lang;
        // Each field value
        $query = 'SELECT * FROM ' . _DB_PREFIX_ . 'velsof_supercheckout_custom_fields cf ';
        $query = $query . 'JOIN ' . _DB_PREFIX_ . 'velsof_supercheckout_custom_fields_lang cfl ';
        $query = $query . 'ON cf.id_velsof_supercheckout_custom_fields = cfl.id_velsof_supercheckout_custom_fields ';
        $query = $query . 'WHERE active = 1 AND cfl.id_lang = ' . (int) $id_lang;

        $result_fields = Db::getInstance()->executeS($query);
        $array_fields = array();
        foreach ($result_fields as $field) {
            $id_velsof_supercheckout_custom_fields = $field['id_velsof_supercheckout_custom_fields'];
            if ($field['type'] == 'textbox' || $field['type'] == 'textarea' || $field['type'] == 'date' || $field['type'] == 'file') { //Modified by Anshul
                $query = 'SELECT * FROM ' . _DB_PREFIX_ . 'velsof_supercheckout_custom_fields cf ';
                $query .= 'JOIN ' . _DB_PREFIX_ . 'velsof_supercheckout_custom_fields_lang cfl ';
                $query .= 'ON cf.id_velsof_supercheckout_custom_fields = cfl.id_velsof_supercheckout_custom_fields ';
                $query .= 'WHERE cf.id_velsof_supercheckout_custom_fields = ' . (int) $id_velsof_supercheckout_custom_fields . '
					AND cfl.id_lang = ' . (int) $id_lang_current . ' AND cf.active = 1';
                $result_custom_fields_details = Db::getInstance()->executeS($query);
                $array_fields[$id_velsof_supercheckout_custom_fields] = $result_custom_fields_details[0];
            } else {
                $query = 'SELECT * FROM ' . _DB_PREFIX_ . 'velsof_supercheckout_custom_fields cf ';
                $query .= 'JOIN ' . _DB_PREFIX_ . 'velsof_supercheckout_custom_fields_lang cfl ';
                $query .= 'ON cf.id_velsof_supercheckout_custom_fields = cfl.id_velsof_supercheckout_custom_fields ';
                $query .= 'JOIN ' . _DB_PREFIX_ . 'velsof_supercheckout_custom_field_options_lang cfol ';
                $query .= 'ON cf.id_velsof_supercheckout_custom_fields = cfol.id_velsof_supercheckout_custom_fields ';
                $query .= 'WHERE cf.id_velsof_supercheckout_custom_fields = ' . (int) $id_velsof_supercheckout_custom_fields . '
					AND cfl.id_lang = ' . (int) $id_lang_current . ' AND cfol.id_lang = ' . (int) $id_lang_current . ' AND cf.active = 1';
                $result_custom_fields_details = Db::getInstance()->executeS($query);
                // Setting required variables
                $array_fields[$id_velsof_supercheckout_custom_fields]['options'] = $result_custom_fields_details;
                $array_fields[$id_velsof_supercheckout_custom_fields]['id_velsof_supercheckout_custom_fields'] = $id_velsof_supercheckout_custom_fields;
                $array_fields[$id_velsof_supercheckout_custom_fields]['type'] = $result_custom_fields_details[0]['type'];
                $array_fields[$id_velsof_supercheckout_custom_fields]['position'] = $result_custom_fields_details[0]['position'];
                $array_fields[$id_velsof_supercheckout_custom_fields]['required'] = $result_custom_fields_details[0]['required'];
                $array_fields[$id_velsof_supercheckout_custom_fields]['field_label'] = $result_custom_fields_details[0]['field_label'];
                $array_fields[$id_velsof_supercheckout_custom_fields]['field_help_text'] = $result_custom_fields_details[0]['field_help_text'];
            }
            /**
             * Start changes to fix issue of saving custom field at the time of saving address
             * NASep2023 custom_field_persistence
             * @date 26-09-2023
             * @modifier Nikhil Aggarwal
             */
            $custom_value = '';
            $custom_value = Db::getInstance(_PS_USE_SQL_SLAVE_)->getValue('SELECT field_value from ' . _DB_PREFIX_ . 'velsof_supercheckout_fields_data where id_velsof_supercheckout_custom_fields = ' . (int) $id_velsof_supercheckout_custom_fields . ' AND id_cart = ' . (int) $this->context->cookie->id_cart);
            if (!empty($custom_value)) {
                $array_fields[$id_velsof_supercheckout_custom_fields]['default_value'] = $custom_value;
            }
            // Changes end by Nikhil
        }
        ksort($array_fields);
        return $array_fields;
    }

    private function loadCarriers(
        $id_country = 0,
        $id_state = 0,
        $postcode = '',
        $id_address_delivery = 0,
        $default_carrier = null
    ) {
        if (Tools::getIsset('id_address_delivery') && !Tools::getValue('id_address_delivery')) {
            $this->context->cart->id_address_delivery = 0;
            $this->context->cart->id_address_invoice = 0;
        }

        if ($id_address_delivery == "undefined") {
            $id_address_delivery = 0;
        }
        $this->context->cookie->__unset('address_selector');
        $old_id_address_delivery = $this->checkout_session->getIdAddressDelivery();
        $value = Tools::getValue('id_address_delivery');
        if ($value == "undefined") {
            $value = 0;
        }
        if (Tools::getIsset($value) && !$value) {
            $this->context->cookie->__set('address_selector', 'new');
            $this->context->smarty->assign('address_selector', 'new');
        } else {
            $this->context->cookie->__set('address_selector', 'existing');
            $this->context->smarty->assign('address_selector', 'existing');
        }


        $this->initCheckoutAddresses($id_country, $id_state, $postcode, $id_address_delivery);
        $context = Context::getContext();
        $updated_id_address_delivery = $this->checkout_session->getIdAddressDelivery();
        $this->updateCartDeliveryAddress($old_id_address_delivery, $updated_id_address_delivery);

        $products = $this->context->cart->getProducts();
        foreach ($products as $key => $product) {
            $old_product_address_id = isset($product['id_address_delivery']) ? (int) $product['id_address_delivery'] : 0;
            $this->updateCartDeliveryAddress($old_product_address_id, $this->context->cart->id_address_delivery);
            $this->context->cart->update();
        }

        if (Tools::isSubmit('ajax')) {
            if (!$this->context->cart->isVirtualCart()) {
                $id_address_delivery = $this->checkout_session->getIdAddressDelivery();
                $checkoutDeliveryStep = new CheckoutDeliveryStep(
                    $this->context,
                    $this->getTranslator()
                );

                $checkoutDeliveryStep
                    ->setRecyclablePackAllowed((bool) Configuration::get('PS_RECYCLABLE_PACK'))
                    ->setGiftAllowed((bool) Configuration::get('PS_GIFT_WRAPPING'))
                    ->setIncludeTaxes(
                        !Product::getTaxCalculationMethod((int) $this->context->cart->id_customer)
                        && (int) Configuration::get('PS_TAX')
                    )
                    ->setDisplayTaxesLabel(
                        (Configuration::get('PS_TAX') && !Configuration::get('AEUC_LABEL_TAX_INC_EXC'))
                    )
                    ->setGiftCost(
                        $this->context->cart->getGiftWrappingPrice(
                            $checkoutDeliveryStep->getIncludeTaxes()
                        )
                    );

                $delivery_options = $this->checkout_session->getDeliveryOptions();

                if (
                    !empty($default_carrier) && isset($delivery_options[$id_address_delivery])
                    && array_key_exists($default_carrier . ',', $delivery_options[$id_address_delivery])
                ) {
                    $this->checkout_session->setDeliveryOption(array($default_carrier . ','));
                } else {
                    $this->checkout_session->setDeliveryOption($this->superCheckoutGetDeliveryOption());
                }
            }

            $_POST['id_address_delivery'] = $id_address_delivery; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
            $delivery_options = $this->checkout_session->getDeliveryOptions();
            $deliverdata = json_decode(Configuration::get('VELOCITY_SUPERCHECKOUT_DATA'), true);
            foreach ($delivery_options as $id_carrier => &$carrier) {
                foreach ($deliverdata['delivery_method'] as $did => $deliveryid) {
                    /**
                     * Start Changes to fix the issue of comparing string with integer
                     * $id_carrier contains a ',' in the end
                     * So, typecasted it to int
                     * NAOct2023 carrier_image_change
                     * @date 06-10-2023
                     * @modifier Nikhil Aggarwal
                     */
                    if ($did == (int) $id_carrier) {
                        // Changes end by Nikhil
                        if ($deliveryid['logo']['title'] != '') {
                            $custom_ssl_var = 0;
                            if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on') {
                                $custom_ssl_var = 1;
                            }
                            if ((bool) Configuration::get('PS_SSL_ENABLED') && $custom_ssl_var == 1) {
                                $delivery_logo_path = _PS_BASE_URL_SSL_ . __PS_BASE_URI__
                                    . 'modules/supercheckout/views/img/admin/uploads/' . $deliveryid['logo']['title'];
                            } else {
                                $delivery_logo_path = _PS_BASE_URL_ . __PS_BASE_URI__
                                    . 'modules/supercheckout/views/img/admin/uploads/' . $deliveryid['logo']['title'];
                            }
                            $delivery_path = _PS_ROOT_DIR_ . '/modules/supercheckout/views/img/admin/uploads/'
                                . $deliveryid['logo']['title'];
                            if (file_exists($delivery_path)) {
                                $carrier['logo'] = $delivery_logo_path;
                                $carrier['logo_width'] = $deliveryid['logo']['resolution']['width'];
                                $carrier['logo_height'] = $deliveryid['logo']['resolution']['height'];
                            }
                        }
                        if ($deliveryid['logo']['resolution']['width'] != 'auto') {
                            $carrier['logo_width'] = $deliveryid['logo']['resolution']['width'];
                        }

                        if ($deliveryid['logo']['resolution']['height'] != 'auto') {
                            $carrier['logo_height'] = $deliveryid['logo']['resolution']['height'];
                        }
                        $lid = $this->context->language->id;
                        if (isset($deliveryid['title'][$lid]) && !empty($deliveryid['title'][$lid])) {
                            $carrier['name'] = $deliveryid['title'][$lid];
                        }
                    }
                }
            }

            $data = array(
                'hookDisplayBeforeCarrier' => Hook::exec(
                    'displayBeforeCarrier',
                    array('cart' => $this->checkout_session->getCart())
                ),
                'hookDisplayAfterCarrier' => Hook::exec(
                    'displayAfterCarrier',
                    array('cart' => $this->checkout_session->getCart())
                ),
                'id_address' => $id_address_delivery,
                'delivery_options' => $delivery_options,
                'delivery_option' => $this->getSelectedSupercheckoutDeliveryOption(),
                'display_carrier_style' => $this->supercheckout_settings['shipping_method']['display_style'],
                'default_shipping_method' => $this->default_shipping_selected,
                'is_virtual_cart' => $this->context->cart->isVirtualCart(),
                'settings' => $this->supercheckout_settings
            );

            if (!count($delivery_options)) {
                $this->shipping_error[] = $this->module->l('No Delivery Method Available for this Address');
            }

            if (count($this->shipping_error)) {
                $data = array_merge(
                    $data,
                    array(
                        'hasError' => !empty($this->shipping_error),
                        'shipping_error' => $this->shipping_error,
                    )
                );
            }

            $this->context->smarty->assign($data);

            $temp_vars = array(
                'hasError' => !empty($this->shipping_error),
                'shipping_error' => $this->shipping_error,
                'html' => $this->context->smarty->fetch(
                    _PS_MODULE_DIR_ . 'supercheckout/views/templates/front/delivery_methods.tpl'
                )
            );

            return $temp_vars;
        }
    }

    private function processSubmitLogin()
    {
        $email = trim(Tools::getValue('supercheckout_email'));
        $passwd = trim(Tools::getValue('supercheckout_password'));

        if (empty($email)) {
            $this->json['error']['email'] = $this->module->l('An email address required.');
        } elseif (!Validate::isEmail($email)) {
            $this->json['error']['email'] = $this->module->l('Invalid email address.');
        }
        if (empty($passwd)) {
            $this->json['error']['password'] = $this->module->l('Password is required.');
        } elseif (version_compare(_PS_VERSION_, '8.0.0', '<')) {
            if (!Validate::isPasswd($passwd)) {
                $this->json['error']['password'] = $this->module->l('Invalid Password');
            }
        } elseif (version_compare(_PS_VERSION_, '8.0.0', '>=')) {
            if (!Validate::isAcceptablePasswordLength($passwd)) {
                $this->json['error']['password'] = $this->module->l('Invalid Password');
            }
        }
        if (empty($this->json['error'])) {
            $_POST['email'] = trim($email); // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
            $_POST['password'] = trim($passwd); // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.

            Hook::exec('actionAuthenticationBefore');

            $customer = new Customer();
            $authentication = $customer->getByEmail(trim($email), trim($passwd));
            if (isset($authentication->active) && !$authentication->active) {
                $this->json['error']['general'] = $this->module->l('Your account is not active at this time.');
            } elseif (!$authentication || !$customer->id || $customer->is_guest) {
                $this->json['error']['general'] = $this->module->l('Authentication failed.');
            } else {
                $recaptcha_verification_status = 1;
                if (Module::isInstalled('googlerecaptcha') && Module::isEnabled('googlerecaptcha')) {
                    /**
                     * Start Changes to fix the issue of customer being able to login without verifying the recaptcha
                     * NASep2023 GOOGLE_RECAPTCHA 
                     * @date 26-09-2023
                     * @modifier Nikhil Aggarwal
                     */
                    $values = json_decode(Configuration::get('GOOGLE_RECAPTCHA'), true);
                    // Changes end by Nikhil
                    if (isset($values['enable']) && $values['enable'] == 1) {
                        if (isset($values['google_recaptcha']['check'][5]) && $values['google_recaptcha']['check'][5] == 'on') {
                            $recaptch_type = $values['recaptcha_supercheckout'];
                            if ($recaptch_type == 'v2') {
                                if (isset($this->context->cookie->check_login_attempt)) {
                                    $gr_set = $this->context->cookie->check_login_attempt + 1;
                                    $this->context->cookie->__set('check_login_attempt', $gr_set);
                                    if ($this->context->cookie->check_login_attempt > $values['attempts']) {
                                        $recaptcha_mod_obj = Module::getInstanceByName('googlerecaptcha');
                                        $recaptcha_verification_status = $recaptcha_mod_obj->v2RecaptchaVerificationSupercheckout($values);
                                    }
                                }
                            } else {
                                $recaptcha_mod_obj = Module::getInstanceByName('googlerecaptcha');
                                $recaptcha_response = Tools::getValue('recaptcha_response', '');
                                $recaptcha_verification_status = $recaptcha_mod_obj->v3RecaptchaVerificationSupercheckout($values, $recaptcha_response);
                            }
                            if ($recaptcha_verification_status == 1) {
                                $this->context->cookie->__set('check_login_attempt', 0);
                            } elseif ($recaptcha_verification_status == 0) {
                                $this->json['error']['general'] = $this->module->l('Failed to verify.Try again.');
                            } elseif ($recaptcha_verification_status == 2) {
                                $this->json['error']['general'] = $this->module->l('Please verify the reCAPTCHA.');
                            }
                        }
                    }
                }
                if ($recaptcha_verification_status == 1) {
                    $update_product_delivery = true;
                    if (
                        Configuration::get('PS_CART_FOLLOWING')
                        && (empty($this->context->cookie->id_cart)
                            || Cart::getNbProducts($this->context->cookie->id_cart) == 0)
                        && (int) Cart::lastNoneOrderedCart($customer->id)
                    ) {
                        $update_product_delivery = false;
                    } else {
                        $update_product_delivery = true;
                    }

                    $this->context->updateCustomer($customer);
                    if ($update_product_delivery) {
                        $updated_id_address_delivery = (int) Address::getFirstCustomerAddressId((int) ($customer->id));
                        $old_id_address_delivery = 0;
                        if (
                            isset($this->context->cookie->supercheckout_temp_address_delivery)
                            && (int) $this->context->cookie->supercheckout_temp_address_delivery > 0
                        ) {
                            $old_id_address_delivery = (int) $this->context->cookie->supercheckout_temp_address_delivery;
                        }
                        $this->updateCartDeliveryAddress($old_id_address_delivery, $updated_id_address_delivery);
                    }

                    Hook::exec('actionAuthentication', array('customer' => $this->context->customer));

                    CartRule::autoRemoveFromCart($this->context);
                    CartRule::autoAddToCart($this->context);

                    if ($customer->newsletter == 1) {
                        /**
                         * Start Changes to fix the issue of email not being added in all the marketing platforms. Email id being added in only one platform as if else condition is used.
                         * Replacing elseif with if to add the email in all the enabled Marketing Platforms
                         * NADec2023 MARKETING_PLATFORMS
                         * @date 29-12-2023
                         * @modifier Nikhil Aggarwal
                         */
                        if ($this->supercheckout_settings['mailchimp']['enable'] == 1) {
                            $this->addEmailToList($customer->email, $customer->firstname, $customer->lastname);
                        }
                        if ($this->supercheckout_settings['SendinBlue']['enable'] == 1) {
                            $this->addEmailToListSendinBlue($customer->email, $customer->firstname, $customer->lastname);
                        }
                        if ($this->supercheckout_settings['klaviyo']['enable'] == 1) {
                            $this->addEmailToListKlaviyo($customer->email, $customer->firstname, $customer->lastname);
                        }
                        // Changes end by Nikhil
                    }

                    $this->json['success'] = $this->context->link->getModuleLink(
                        'supercheckout',
                        'supercheckout',
                        array(),
                        (bool) Configuration::get('PS_SSL_ENABLED')
                    );
                }
                // changes over
            }
        }
    }

    protected function socialLogin()
    {
        require_once(_PS_MODULE_DIR_ . 'supercheckout/vendor/http.php');
        require_once(_PS_MODULE_DIR_ . 'supercheckout/vendor/oauth_client.php');
        $client = new oauth_client_class;
        $custom_ssl_var = 0;
        if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on') {
            $custom_ssl_var = 1;
        }

        /**
         * Start Changes to fix the issue of wrong URL being created because of hardcoded URL
         * Commented out hardcoded URI and used PS function
         * Also added if else condition to check that '?' exists in the $client->redirect_uri or not
         * NASep2023 wrongURI_social_login
         * @date 26-09-2023
         * @modifier Nikhil Aggarwal
         */
        if ((bool) Configuration::get('PS_SSL_ENABLED') && $custom_ssl_var == 1) {
            $client->redirect_uri = $this->context->link->getModuleLink(
                'supercheckout',
                'supercheckout',
                array(),
                true
            );
        } else {
            $client->redirect_uri = $this->context->link->getModuleLink(
                'supercheckout',
                'supercheckout',
                array(),
                false
            );
        }

        if (strpos($client->redirect_uri, '?') !== false) {
            $client->redirect_uri .= '&';
        } else {
            $client->redirect_uri .= '?';
        }
        if ($this->social_login_type == 'fb') {
            $client->redirect_uri .= 'login_type=fb';
            $client->server = 'Facebook';
            $client->client_id = $this->supercheckout_settings['fb_login']['app_id'];
            $client->client_secret = $this->supercheckout_settings['fb_login']['app_secret'];
            $client->scope = 'email';
        } elseif ($this->social_login_type == 'google') {
            $client->redirect_uri .= 'login_type=google';
            $client->offline = true;
            $client->server = 'Google';
            $client->client_id = $this->supercheckout_settings['google_login']['client_id'];
            $client->client_secret = $this->supercheckout_settings['google_login']['app_secret'];
            $client->scope = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
        } elseif ($this->social_login_type == 'paypal') {
            $client->debug = true;
            $client->debug_http = true;
            $client->server = 'Paypal';
            $client->redirect_uri .= 'login_type=paypal';
            $client->scope = 'profile email';
            $client->client_id = $this->supercheckout_settings['paypal_login']['client_id'];
            $client->client_secret = $this->supercheckout_settings['paypal_login']['client_secret'];
        }
        // Changes end by Nikhil
        $user = array();
        if (($success = $client->Initialize())) {
            if (($success = $client->Process())) {
                if ($this->social_login_type == 'fb') {
                    if (Tools::strlen($client->access_token)) {
                        $success = $client->CallAPI(
                            'https://graph.facebook.com/me?fields=email,first_name,last_name,gender',
                            'GET',
                            array(),
                            array('FailOnAccessError' => true),
                            $user
                        );
                    }
                } elseif ($this->social_login_type == 'google') {
                    if (Tools::strlen($client->authorization_error)) {
                        $client->error = $client->authorization_error;
                        $success = false;
                    } elseif (Tools::strlen($client->access_token)) {
                        $success = $client->CallAPI(
                            'https://www.googleapis.com/oauth2/v1/userinfo',
                            'GET',
                            array(),
                            array('FailOnAccessError' => true),
                            $user
                        );
                    }
                } elseif ($this->social_login_type == 'paypal') {
                    if (Tools::strlen($client->access_token)) {
                        $success = $client->CallAPI('https://api.paypal.com/v1/identity/oauth2/userinfo', 'GET', array(), array('FailOnAccessError' => true), $user);
                    } else {
                        return $client->authorization_error;
                    }
                }
            }
            $success = $client->Finalize($success);
        }
        if ($client->exit) {
            exit;
        }

        $social_customer_array = array();
        /**
         * Added default empty string if first name, last name and email is not returned from the API
         * @modifier Himanshu Vishwakarma
         * @date 26-09-2025
         */
        if ($success) {
            if ($this->social_login_type == 'fb') {
                $social_customer_array['first_name'] = isset($user->first_name) ? $user->first_name : '';
                $social_customer_array['last_name']  = isset($user->last_name) ? $user->last_name : '';
            } elseif ($this->social_login_type == 'google') {
                $social_customer_array['first_name'] = isset($user->given_name) ? $user->given_name : '';
                $social_customer_array['last_name']  = isset($user->family_name) ? $user->family_name : '';
            } elseif ($this->social_login_type == 'paypal') {
                $full_name_arr = isset($user->name) ? preg_split('#\s+#', $user->name, 2) : [];
                $social_customer_array['first_name'] = isset($full_name_arr[0]) ? $full_name_arr[0] : '';
                $social_customer_array['last_name']  = isset($full_name_arr[1]) ? $full_name_arr[1] : '';
            }
        
            if (isset($user->gender)) {
                $social_customer_array['gender'] = ($user->gender == 'male') ? 0 : 1;
            } else {
                $social_customer_array['gender'] = 0;
            }
        
            $social_customer_array['email'] = isset($user->email) ? $user->email : '';
        
            $this->addEmailToList(
                $social_customer_array['first_name'],
                $social_customer_array['email']
            );
        } else {
            $this->context->cookie->velsof_error = json_encode(
                array($this->module->l('Not able to login with social site'))
            );
            Tools::redirect(
                $this->context->link->getModuleLink(
                    'supercheckout',
                    'supercheckout',
                    array(),
                    (bool) Configuration::get('PS_SSL_ENABLED')
                )
            );
        }

        /**
         * Reseting the access token after the login attempt to reset the session.
         * @modifier Himanshu Vishwakarma
         * @date 26-09-2025
         */
        $client->ResetAccessToken();

        return $social_customer_array;
    }

    protected function loadInvoiceAddress($id_country = 0, $id_state = 0, $postcode = 0, $id_address_invoice = 0)
    {
        if ((int) $id_address_invoice > 0) {
            $this->checkout_session->setIdAddressInvoice((int) $id_address_invoice);
            $this->context->cookie->supercheckout_temp_address_invoice = $id_address_invoice;
            return true;
        }
        if ($this->context->cart->isVirtualCart()) {
            if (
                isset($this->context->cookie->isSameInvoiceAddress)
                && $this->context->cookie->isSameInvoiceAddress == 1
            ) {
                $this->checkout_session->setIdAddressInvoice($this->checkout_session->getIdAddressDelivery());
                $tmp_id_address = $this->checkout_session->getIdAddressInvoice();
                $this->context->cookie->supercheckout_temp_address_invoice = $tmp_id_address;
                return true;
            }

            if (empty($id_country)) {
                $id_country = Configuration::get('PS_COUNTRY_DEFAULT');
            }

            if (empty($id_address_invoice)) {
                if (
                    isset($this->context->cookie->supercheckout_temp_address_invoice)
                    && $this->context->cookie->supercheckout_temp_address_invoice > 0
                ) {
                    $id_address_invoice = $this->context->cookie->supercheckout_temp_address_invoice;
                }
            }
            if ($id_address_invoice == 0) {
                $invoice_address = new Address($id_address_invoice);
                $invoice_address->firstname = ' ';
                $invoice_address->lastname = ' ';
                $invoice_address->company = ' ';
                $invoice_address->address1 = ' ';
                $invoice_address->address2 = ' ';
                $invoice_address->phone_mobile = ' ';
                $invoice_address->vat_number = ' ';
                $invoice_address->city = '';
                $invoice_address->id_country = $id_country;
                $invoice_address->id_state = $id_state;
                $invoice_address->postcode = $postcode;
                $invoice_address->other = ' ';
                $invoice_address->alias = Tools::substr($this->module->l('Address Alias') . ' - ' . date('s') . rand(0, 9), 0, 30);
                if ($invoice_address->save()) {
                    $this->checkout_session->setIdAddressInvoice($invoice_address->id);
                    $this->context->cookie->supercheckout_temp_address_invoice = $invoice_address->id;
                }
            }
        }
        return true;
    }

    protected function addCartRule()
    {
        $discountarr = array();
        if (CartRule::isFeatureActive()) {
            if (!($code = trim(Tools::getValue('discount_name')))) {
                $discountarr['error'] = $this->module->l('You must enter a voucher code');
            } elseif (!Validate::isCleanHtml($code)) {
                $discountarr['error'] = $this->module->l('The voucher code is invalid');
            } else {
                if (
                    ($cart_rule = new CartRule(CartRule::getIdByCode($code)))
                    && Validate::isLoadedObject($cart_rule)
                ) {
                    if ($error = $cart_rule->checkValidity($this->context, false, true)) {
                        if (is_array($error)) {
                            $discountarr['error'] = implode('<br>', $error);
                        } else {
                            $discountarr['error'] = $error;
                        }
                    } else {
                        $this->context->cart->addCartRule($cart_rule->id);
                        $discountarr['success'] = $this->module->l('Voucher successfully applied');
                    }
                } else {
                    $discountarr['error'] = $this->module->l('The voucher code is invalid');
                }
            }
        } else {
            $discountarr['error'] = $this->module->l('This feature is not active for this voucher');
        }
        return $discountarr;
    }

    protected function removeDiscount()
    {
        $discountarr = array();
        if (CartRule::isFeatureActive()) {
            if (($id_cart_rule = (int) Tools::getValue('deleteDiscount')) && Validate::isUnsignedId($id_cart_rule)) {
                $this->context->cart->removeCartRule($id_cart_rule);
                $discountarr['success'] = $this->module->l('Voucher successfully removed');
            } else {
                $discountarr['error'] = $this->module->l('Error occured while removing voucher');
            }
        } else {
            $discountarr['error'] = $this->module->l('This feature is not active for this voucher');
        }

        return $discountarr;
    }

    private function loggedInCustomer($customer_from_ocial)
    {
        /**
         * If email is empty, then return
         * @modifier Himanshu Vishwakarma
         * @date 25-09-2025
         */
        if (empty($customer_from_ocial['email'])) {
            echo '<script>
                alert("' . $this->module->l('Please try logging in with a valid email address.') . '");
                window.opener.location.reload(true);
                window.close();
            </script>';

            die;
        }

        $customer_obj = new Customer();
        $customer_tmp = $customer_obj->getByEmail($customer_from_ocial['email']);
        if (isset($customer_tmp->id) && $customer_tmp->id > 0) {
            $customer = new Customer($customer_tmp->id);

            $_POST['email'] = trim($customer_from_ocial['email']); // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.
            $_POST['password'] = $customer->passwd; // Message for Addons Team: Use of the $_POST is required for working of the module as needed to pass override POST data to Prestashop core.

            Hook::exec('actionAuthenticationBefore');

            $update_product_delivery = true;
            if (
                Configuration::get('PS_CART_FOLLOWING')
                && (empty($this->context->cookie->id_cart)
                    || Cart::getNbProducts($this->context->cookie->id_cart) == 0)
                && (int) Cart::lastNoneOrderedCart($customer->id)
            ) {
                $update_product_delivery = false;
            } else {
                $update_product_delivery = true;
            }

            $this->context->updateCustomer($customer);
            if ($update_product_delivery) {
                $updated_id_address_delivery = (int) Address::getFirstCustomerAddressId((int) ($customer->id));
                $old_id_address_delivery = 0;
                if (
                    isset($this->context->cookie->supercheckout_temp_address_delivery)
                    && (int) $this->context->cookie->supercheckout_temp_address_delivery > 0
                ) {
                    $old_id_address_delivery = (int) $this->context->cookie->supercheckout_temp_address_delivery;
                }
                $this->updateCartDeliveryAddress($old_id_address_delivery, $updated_id_address_delivery);
            }

            Hook::exec('actionAuthentication', array('customer' => $this->context->customer));
        } else {
            $original_passd = $this->generateRandomPassword();
            $passd = $original_passd; // Removed Tools::encrypt() for PS9
            $secure_key = md5(uniqid((string) rand(), true));
            $gender = Db::getInstance()->getRow(
                'select id_gender from ' . _DB_PREFIX_ . 'gender where type = '
                . pSQL($customer_from_ocial['gender'])
            );
            if (empty($gender)) {
                $gender['id_gender'] = 0;
            }

            $customer = new Customer();
            $customer->firstname = $customer_from_ocial['first_name'];
            $customer->lastname = $customer_from_ocial['last_name'];
            /*
             * Updated: Replaced deprecated Tools::encrypt with plain_password for PrestaShop 9 compatibility
             * @modifier Himanshu Vishwakarma
             * @date 04-07-2025
             */
            $customer->plain_password = $passd;
            $customer->passwd = password_hash($passwd, PASSWORD_DEFAULT);
            $customer->email = $customer_from_ocial['email'];
            $customer->secure_key = $secure_key;
            $customer->birthday = '';
            $customer->is_guest = 0;
            $customer->active = 1;
            $customer->logged = 1;
            $customer->id_shop_group = (int) $this->context->shop->id_shop_group;
            $customer->id_shop = (int) $this->context->shop->id;
            $customer->id_gender = (int) $gender['id_gender'];
            $customer->id_default_group = (int) Configuration::get('PS_CUSTOMER_GROUP');
            $customer->id_lang = (int) $this->context->language->id;
            $customer->id_risk = 0;
            $customer->max_payment_days = 0;

            $customer->save(true);
            $customer->cleanGroups();
            $customer->addGroups(array((int) Configuration::get('PS_CUSTOMER_GROUP')));

            $this->sendConfirmationMail($customer, $original_passd);

            $update_product_delivery = true;
            if (
                Configuration::get('PS_CART_FOLLOWING')
                && (empty($this->context->cookie->id_cart)
                    || Cart::getNbProducts($this->context->cookie->id_cart) == 0)
                && (int) Cart::lastNoneOrderedCart($customer->id)
            ) {
                $update_product_delivery = false;
            } else {
                $update_product_delivery = true;
            }

            $this->context->updateCustomer($customer);
            if ($update_product_delivery) {
                $updated_id_address_delivery = (int) Address::getFirstCustomerAddressId((int) ($customer->id));
                $old_id_address_delivery = 0;
                if (
                    isset($this->context->cookie->supercheckout_temp_address_delivery)
                    && (int) $this->context->cookie->supercheckout_temp_address_delivery > 0
                ) {
                    $old_id_address_delivery = (int) $this->context->cookie->supercheckout_temp_address_delivery;
                }
                $this->updateCartDeliveryAddress($old_id_address_delivery, $updated_id_address_delivery);
            }

            $this->context->cart->update();

            Hook::exec(
                'actionCustomerAccountAdd',
                array('newCustomer' => $customer)
            );
        }

        $this->context->smarty->assign('confirmation', 1);

        return true;
    }

    private function getOrderExtraParams()
    {
        $checkoutDeliveryStep = new CheckoutDeliveryStep(
            $this->context,
            $this->getTranslator()
        );

        $checkoutDeliveryStep
            ->setRecyclablePackAllowed((bool) Configuration::get('PS_RECYCLABLE_PACK'))
            ->setGiftAllowed((bool) Configuration::get('PS_GIFT_WRAPPING'))
            ->setIncludeTaxes(
                !Product::getTaxCalculationMethod((int) $this->context->cart->id_customer)
                && (int) Configuration::get('PS_TAX')
            )
            ->setDisplayTaxesLabel(
                (Configuration::get('PS_TAX') && !Configuration::get('AEUC_LABEL_TAX_INC_EXC'))
            )
            ->setGiftCost(
                $this->context->cart->getGiftWrappingPrice(
                    $checkoutDeliveryStep->getIncludeTaxes()
                )
            );

        $conditions_to_approve = new ConditionsToApproveFinder($this->context, $this->getTranslator());

        $gift = $this->checkout_session->getGift();
        $gift_wrap_msg = $this->module->l('I would like my order to be gift wrapped');
        // changes by rishabh jain
        $sender = '';
        $receiver = '';
        $kb_gift_message = '';
        $is_kb_gift_msg_already_added = 0;
        if (!$this->context->cart->isVirtualCart()) {
            $id_cart = $this->context->cookie->id_cart;
            $sql = 'Select * From ' . _DB_PREFIX_ . 'kb_supercheckout_gift_message where id_cart= ' . (int) $id_cart;
            $message_data = DB::getInstance(_PS_USE_SQL_SLAVE_)->getRow($sql);
            if (is_array($message_data) && count($message_data) > 0) {
                $sender = $message_data['kb_sender'];
                $receiver = $message_data['kb_receiver'];
                $kb_gift_message = $message_data['kb_message'];
                $is_kb_gift_msg_already_added = 1;
            }
        }
        // changes over
        $data = array(
            // chnages by rishabh jain
            'sender' => $sender,
            'is_kb_gift_msg_already_added' => $is_kb_gift_msg_already_added,
            'receiver' => $receiver,
            'kb_gift_msg' => $kb_gift_message,
            // changes over
            'is_virtual_cart' => $this->context->cart->isVirtualCart(),
            'recyclable' => $this->checkout_session->isRecyclable(),
            'recyclablePackAllowed' => $checkoutDeliveryStep->isRecyclablePackAllowed(),
            'gift' => array(
                'allowed' => $checkoutDeliveryStep->isGiftAllowed(),
                'isGift' => $gift['isGift'],
                'label' => $this->getTranslator()->trans(
                    $gift_wrap_msg . $checkoutDeliveryStep->getGiftCostForLabel(),
                    array(),
                    'supercheckout'
                ),
                'message' => $gift['message'],
            ),
            'show_TOS' => $this->supercheckout_settings['confirm']['term_condition'][($this->is_logged)
                ? 'logged' : 'guest']['display'],
            'checkedTOS' => $this->supercheckout_settings['confirm']['term_condition'][($this->is_logged)
                ? 'logged' : 'guest']['checked'],
            'mandatoryTOS' => $this->supercheckout_settings['confirm']['term_condition'][($this->is_logged)
                ? 'logged' : 'guest']['require'],
            'conditions_to_approve' => $conditions_to_approve->getConditionsToApproveForTemplate(),
        );
        return $data;
    }
    /** Start Changes to add the Payment Fee on Checkout
     * Below function returns the Payment Fee based on the Admin settings
     * @date 15-10-2024
     * NAOct2024 payment_fee
     * @modifier Nikhil Aggarwal 
     */
    public function getPaymentFee($option)
    {
        $fee = 0;
        $fee_type = $option['type'];

        $tax_type = true;
        if ($option['paymenttax_method'] == 'inc_tax') {
            $fee_tax = true;
        } else {
            $fee_tax = false;
        }

        if ($fee_type == 'fixed') {
            $fee = (float) $option['fixed_fee'];
        } else if ($fee_type == 'percentage') {
            $fee = $this->context->cart->getOrderTotal($fee_tax, $option['paymentfee_method']) * $option['percentage_fee'] / 100;
        } else {
            $fee = (float) $option['fixed_fee'] + ($this->context->cart->getOrderTotal($fee_tax, $option['paymentfee_method']) * (float) $option['percentage_fee'] / 100);
        }

        if (isset($option['minimum_fee']) && $option['minimum_fee'] > 0 && $fee < $option['minimum_fee']) {
            $fee = $option['minimum_fee'];
        }
        if ($option['maximum_fee'] && $option['maximum_fee'] > 0 && $fee > $option['maximum_fee']) {
            $fee = $option['maximum_fee'];
        }

        if (is_array($option['countries']) && count($option['countries']) > 0) {
            $address = new Address($this->context->cart->id_address_delivery);
            $country = $address->id_country;
            if (!in_array($country, $option['countries'])) {
                $fee = 0;
            }
        }
        /**
         * Start Changes to fix additional fee showing for wrong customer groups
         * Fixed misplaced bracket in is_array() condition causing group filter to be skipped
         * Added guest/visitor group fallback using PS_GUEST_GROUP and PS_UNIDENTIFIED_GROUP
         * @date 19-04-2026
         * @modifier Manish
         * MPAPR2026 FeeGroupFilter
         */
        if (is_array($option['customer_group']) && count($option['customer_group']) > 0) {
            if ($this->context->cart->id_customer) {
                $customer = new Customer($this->context->cart->id_customer);
                $customer_group = $customer->id_default_group;
            } elseif ($this->context->cookie->is_guest) {
                $customer_group = (int) Configuration::get('PS_GUEST_GROUP');
            } else {
                $customer_group = (int) Configuration::get('PS_UNIDENTIFIED_GROUP');
            }
            if (!in_array($customer_group, $option['customer_group'])) {
                $fee = 0;
            }
        }

        return Tools::ps_round($fee, 2);
    }
    // Changes end by Nikhil

    protected function loadPaymentMethods($selected_payment_method = 0)
    {
        //$this->context->smarty->assign('urls', array('base_url' => _PS_BASE_URL_SSL_."/"));

        // ── Reset stored payment fee before building the payment method list ──
    // Prevents a stale DB fee from inflating getOrderTotal during CartPresenter
    // calls that happen inside this request or the next loadCart call.
    $sql = 'UPDATE `' . _DB_PREFIX_ . 'kb_supercheckout_payment_fee`
            SET `paymentfee_applicable` = 0
            WHERE `id_cart` = ' . (int) $this->context->cart->id;
    Db::getInstance()->execute($sql);
    // ── End reset ──

        $payment_methods = array();
        $available_payments = array();
        $total = $this->context->cart->getOrderTotal(true);

        // false means container wasn't ready yet — treat as normal cart with value,
        // so payment methods are still displayed
        if ($total === false) {
            // Container not available during this call — proceed to show payment methods
            // The correct total will be computed once container is fully bootstrapped
            $finder = new PaymentOptionsFinder();
            $available_payments = $finder->present();
        } elseif ($total === null) {
            // Do nothing (legacy guard, should not normally happen)
        } elseif ($total == 0) {
            $payment_methods['payment_method_not_required'] = true;
        } else {
            $finder = new PaymentOptionsFinder();
            $available_payments = $finder->present();
        }
        /**
         * Start Changes to fix the issue of payment_methods index not being set
         * Defining it before using it in TPL
         * NAOct2023 payment_methods
         * @date 06-10-2023
         * @modifier Nikhil Aggarwal
         */
        $payment_methods['payment_methods'] = array();
        // Changes end by Nikhil
        if ($available_payments) {
            $payment_settings_data = json_decode(Configuration::get('VELOCITY_SUPERCHECKOUT_DATA'), true);
            if (!is_array($payment_settings_data)) {
                $payment_settings_data = array();
            }

            /** Start Changes to add the Payment Fee on Checkout
             * Passing the Admin Payment Fee settings to the checkout
             * @date 08-10-2024
             * NAOct2024 payment_fee
             * @modifier Nikhil Aggarwal 
             */
            if (isset($payment_settings_data['paymentfee_title']) && count($payment_settings_data['paymentfee_title']) > 0 && isset($payment_settings_data['paymentfee_title'][Context::getContext()->language->id])) {
                $payment_methods['paymentfee_title'] = $payment_settings_data['paymentfee_title'][Context::getContext()->language->id];
            } else {
                $payment_methods['paymentfee_title'] = $this->module->l('Additional Payment Fee');
            }

            if (isset($payment_settings_data['paymentfee_method'])) {
                $payment_methods['paymentfee_method'] = $payment_settings_data['paymentfee_method'];
            } else {
                $payment_methods['paymentfee_method'] = Cart::ONLY_PRODUCTS;
            }

            if (isset($payment_settings_data['paymenttax_method'])) {
                $payment_methods['paymenttax_method'] = $payment_settings_data['paymenttax_method'];
            } else {
                $payment_methods['paymenttax_method'] = 'inc_tax';
            }
            // Changes end by Nikhil

            $delivery_option = $this->getSelectedSupercheckoutDeliveryOption();

            $custom_ssl_var = 0;
            if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on') {
                $custom_ssl_var = 1;
            }

            foreach ($available_payments as $module_name => $module_options) {
                $module_instance = Module::getInstanceByName($module_name);
                //BOC - Check for Ship to Pay
                $not_include_count = 0;

                /* Start - Code Added by Raghu on 21-Aug-2017 for fixing 'Same payment method is coming more than once' issue */
                $flag = true;
                if (count($module_options) > 1) {
                    $flag = false;
                }
                /* End - Code Added by Raghu on 21-Aug-2017 for fixing 'Same payment method is coming more than once' issue */

                /* Start Code modified by Priyanshu on 3-June-2020 to fix the Ship2Pay issue in case of virtual Product */

                if (!$this->context->cart->isVirtualCart()) {
                    if (
                        isset($this->supercheckout_settings['ship_to_pay']) && !empty($this->supercheckout_settings['ship_to_pay'])
                    ) {
                        $tmp = rtrim($delivery_option, ',');
                        if (isset($this->supercheckout_settings['ship_to_pay'][$tmp][$module_instance->id])) {
                            $not_include_count++;
                        }
                    }
                }

                /* End of Code modified by Priyanshu on 3-June-2020 to fix the Ship2Pay issue in case of virtual Product */

                if ($not_include_count > 0) {
                    continue;
                }
                //EOC - Check for Ship to Pay
                foreach ($module_options as &$option) {
                    $option['id_module'] = $module_instance->id;
                    /** Start Changes to add the Payment Fee on Checkout
                     * Passing the fee data for each payment method to the Supercheckout front
                     * @date 15-10-2024
                     * NAOct2024 payment_fee
                     * @modifier Nikhil Aggarwal 
                     */
                    if (isset($payment_settings_data['payment_method'][$module_instance->id]['paymentfee'])) {
                        $option['paymentfee']['status'] = isset($payment_settings_data['payment_method'][$module_instance->id]['paymentfee']['status']) ? $payment_settings_data['payment_method'][$module_instance->id]['paymentfee']['status'] : 0;
                        $option['paymentfee']['minimum_fee'] = isset($payment_settings_data['payment_method'][$module_instance->id]['paymentfee']['minimum_fee']) ? $payment_settings_data['payment_method'][$module_instance->id]['paymentfee']['minimum_fee'] : 0;
                        $option['paymentfee']['maximum_fee'] = isset($payment_settings_data['payment_method'][$module_instance->id]['paymentfee']['maximum_fee']) ? $payment_settings_data['payment_method'][$module_instance->id]['paymentfee']['maximum_fee'] : 0;
                        $option['paymentfee']['type'] = isset($payment_settings_data['payment_method'][$module_instance->id]['paymentfee']['type']) ? $payment_settings_data['payment_method'][$module_instance->id]['paymentfee']['type'] : 'fixed';
                        $option['paymentfee']['fixed_fee'] = isset($payment_settings_data['payment_method'][$module_instance->id]['paymentfee']['fixed_fee']) ? $payment_settings_data['payment_method'][$module_instance->id]['paymentfee']['fixed_fee'] : 0;
                        $option['paymentfee']['percentage_fee'] = isset($payment_settings_data['payment_method'][$module_instance->id]['paymentfee']['percentage_fee']) ? $payment_settings_data['payment_method'][$module_instance->id]['paymentfee']['percentage_fee'] : 0;
                        $option['paymentfee']['customer_group'] = isset($payment_settings_data['payment_method'][$module_instance->id]['paymentfee']['customer_group']) ? $payment_settings_data['payment_method'][$module_instance->id]['paymentfee']['customer_group'] : array();
                        $option['paymentfee']['countries'] = isset($payment_settings_data['payment_method'][$module_instance->id]['paymentfee']['countries']) ? $payment_settings_data['payment_method'][$module_instance->id]['paymentfee']['countries'] : array();
                    } else {
                        $option['paymentfee']['status'] = 0;
                        $option['paymentfee']['minimum_fee'] = 0;
                        $option['paymentfee']['maximum_fee'] = 0;
                        $option['paymentfee']['type'] = 'fixed';
                        $option['paymentfee']['fixed_fee'] = 0;
                        $option['paymentfee']['percentage_fee'] = 0;
                        $option['paymentfee']['customer_group'] = array();
                        $option['paymentfee']['countries'] = array();
                    }
                    $option['paymentfee']['paymentfee_method'] = $payment_methods['paymentfee_method'];
                    $option['paymentfee']['paymenttax_method'] = $payment_methods['paymenttax_method'];
                    $option['paymentfee']['paymentfee_title'] = $payment_methods['paymentfee_title'];

                    if ($option['paymentfee']['status'] == 1) {
                        $option['paymentfee']['applicable_fee'] = $this->getPaymentFee($option['paymentfee']);
                    } else {
                        $option['paymentfee']['applicable_fee'] = 0;
                    }


                    //$option['paymentfee']['paymentfee_total'] = $this->context->currency->sign . ((float) Context::getContext()->cart->getOrderTotal() + (float) $option['paymentfee']['applicable_fee']);
                    $option['paymentfee']['paymentfee_total'] = (float) Context::getContext()->cart->getOrderTotal(true, Cart::BOTH, null, null, false, true);
                    $option['paymentfee']['paymentfee_applicable'] = $option['paymentfee']['applicable_fee'];
                    $option['paymentfee']['applicable_fee'] = $this->context->currency->sign . $option['paymentfee']['applicable_fee'];
                    // Changes end by Nikhil
                    //Get Image
                    $payment_image_url = '';
                    if ($this->supercheckout_settings['payment_method']['display_style']) {
                        /**
                         * Start Changes to fix the issue with payment method shaim_thepay which is responsible to show multiple payment options
                         * The logo of the payment options was displayed incorrectly 
                         * Using the image provided by the payment method by adding the if condition
                         * NASep2023 shaim_thepay
                         * @date 26-09-2023
                         * @modifier Nikhil Aggarwal
                         */
                        if ($option['logo'] != '') {
                            $payment_image_url = $option['logo'];
                        } else {
                            foreach ($this->image_extensions as $img_ext) {
                                $tmp_file_path = _PS_MODULE_DIR_ . $module_instance->name
                                    . '/' . $module_instance->name . $img_ext;
                                if (file_exists($tmp_file_path)) {
                                    if ((bool) Configuration::get('PS_SSL_ENABLED') && $custom_ssl_var == 1) {
                                        $payment_image_url = _PS_BASE_URL_SSL_ . _MODULE_DIR_
                                            . $module_instance->name . '/' . $module_instance->name . $img_ext;
                                    } else {
                                        $payment_image_url = _PS_BASE_URL_ . _MODULE_DIR_
                                            . $module_instance->name . '/' . $module_instance->name . $img_ext;
                                    }
                                    break;
                                }
                            }
                        }
                        // Changes end by Nikhil
                    }
                    $option['payment_image_url'] = $payment_image_url;

                    $paymentMethodRows = isset($payment_settings_data['payment_method']) && is_array($payment_settings_data['payment_method'])
                        ? $payment_settings_data['payment_method'] : array();
                    foreach ($paymentMethodRows as $id_module => $payid) {
                        if ($option['id_module'] == $id_module) {
                            if (!empty($payid['logo']['title'])) {
                                $pay_path = _PS_MODULE_DIR_ . $this->module->name . '/views/img/admin/uploads/'
                                    . $payid['logo']['title'];
                                if (file_exists($pay_path)) {
                                    if ((bool) Configuration::get('PS_SSL_ENABLED') && $custom_ssl_var == 1) {
                                        $logo_path = _PS_BASE_URL_SSL_ . __PS_BASE_URI__ . 'modules/'
                                            . $this->module->name . '/views/img/admin/uploads/'
                                            . $payid['logo']['title'];
                                    } else {
                                        $logo_path = _PS_BASE_URL_ . __PS_BASE_URI__ . 'modules/'
                                            . $this->module->name . '/views/img/admin/uploads/'
                                            . $payid['logo']['title'];
                                    }
                                    $option['payment_image_url'] = $logo_path;
                                    $option['width'] = $payid['logo']['resolution']['width'];
                                    $option['height'] = $payid['logo']['resolution']['height'];
                                }
                            }
                            $lang_id = $this->context->language->id;
                            /* Start - Code Modified by Raghu on 21-Aug-2017 for fixing 'Same payment method is coming more than once' issue */
                            if ($flag) {
                                if (isset($payid['title'][$lang_id]) && !empty($payid['title'][$lang_id])) {
                                    $option['call_to_action_text'] = $payid['title'][$lang_id];
                                }
                            }
                            /* Start - Code Modified by Raghu on 21-Aug-2017 for fixing 'Same payment method is coming more than once' issue */
                        }
                    }

                    $payment_methods['payment_methods'][] = $option;
                }
            }
        }

        $payment_methods['kb_payment_fee_currency'] = $this->context->currency->sign;
        $payment_methods['selected_payment_method'] = $selected_payment_method;
        $payment_methods['display_payment_style'] = $this->supercheckout_settings['payment_method']['display_style'];

        $this->context->smarty->assign($payment_methods);
        $this->context->smarty->assign('settings', $this->supercheckout_settings);
        $this->context->smarty->assign('address_selector', $this->context->cookie->address_selector);
        $temp_vars = array(
            'html' => $this->context->smarty->fetch(
                _PS_MODULE_DIR_ . $this->module->name . '/views/templates/front/payment_methods.tpl'
            )
        );

        if (Module::isInstalled('stripe_official') && Module::isEnabled('stripe_official')) {
            include_once(_PS_MODULE_DIR_ . 'stripe_official/stripe_official.php');
            include_once(_PS_MODULE_DIR_ . 'stripe_official/vendor/autoload.php');
            $currency = $this->context->currency->iso_code;
            $amount = $this->context->cart->getOrderTotal();
            $amount = Tools::ps_round($amount, 2);
            $amount = $this->isZeroDecimalCurrency($currency) ? $amount : $amount * 100;

            $intent = $this->retrievePaymentIntent($amount, $currency);

            if (!$intent) {
            } else {
                $temp_vars['stripe_amount'] = $amount;
                $temp_vars['stripe_payment_id'] = $intent->id;
                $temp_vars['stripe_client_secret'] = $intent->client_secret;
            }
            $temp_vars['stripe_amount'] = $amount;
        }

        return $temp_vars;
    }


    /**
     * Retrieve the current payment intent or create a new one
     */
    protected function retrievePaymentIntent($amount, $currency)
    {
        if (isset($this->context->cookie->stripe_payment_intent) && !empty($this->context->cookie->stripe_payment_intent)) {
            try {
                $intent = \Stripe\PaymentIntent::retrieve($this->context->cookie->stripe_payment_intent); /*This function \Stripe\PaymentIntent::retrieve
                    **  is used to make our module compatible with
                    **  Stripe Official v2.0.4. The function will
                    **  be included from Stripe if Stripe Official
                    **  is Installed & enabled.*/

                // Check that the amount is still correct
                if ($intent->amount != $amount) {
                    $intent->update(
                        $this->context->cookie->stripe_payment_intent,
                        array(
                            "amount" => $amount
                        )
                    );
                }

                return $intent;
            } catch (Exception $e) {
                unset($this->context->cookie->stripe_payment_intent);
            }
        }

        $address = new Address($this->context->cart->id_address_invoice);
        $country = Country::getIsoById($address->id_country);
        $currency = Tools::strtolower($this->context->currency->iso_code);

        $options = array();
        foreach (Stripe_official::$paymentMethods as $name => $paymentMethod) {
            // Check if the payment method is enabled
            if ($paymentMethod['enable'] !== true && Configuration::get($paymentMethod['enable']) != 'on') {
                continue;
            }

            // Check for country support
            if (isset($paymentMethod['countries']) && !in_array($country, $paymentMethod['countries'])) {
                continue;
            }

            // Check for currency support
            if (isset($paymentMethod['currencies']) && !in_array($currency, $paymentMethod['currencies'])) {
                continue;
            }

            $options[] = $name;
        }

        try {
            /*
             *  This function \Stripe\PaymentIntent::create is used to make our module compatible with Stripe Official v2.0.4. The function will be included from Stripe if Stripe Official is Installed & enabled.
             */
            $intent = \Stripe\PaymentIntent::create(
                array(
                    "amount" => $amount,
                    "currency" => $currency,
                    "payment_method_types" => array($options),
                )
            );

            // Keep the payment intent ID in session
            $this->context->cookie->stripe_payment_intent = $intent->id;

            $paymentIntent = new StripePaymentIntent();
            $paymentIntent->setIdPaymentIntent($intent->id);
            $paymentIntent->setStatus($intent->status);
            $paymentIntent->setAmount($intent->amount);
            $paymentIntent->setCurrency($intent->currency);
            $paymentIntent->setDateAdd(date("Y-m-d H:i:s", $intent->created));
            $paymentIntent->setDateUpd(date("Y-m-d H:i:s", $intent->created));
            $paymentIntent->save(false, false);

            return $intent;
        } catch (Exception $e) {
            // @todo change with stripe logger
            error_log($e->getMessage());
        }
    }

    public function isZeroDecimalCurrency($currency)
    {
        // @see: https://support.stripe.com/questions/which-zero-decimal-currencies-does-stripe-support
        $zeroDecimalCurrencies = array(
            'BIF',
            'CLP',
            'DJF',
            'GNF',
            'JPY',
            'KMF',
            'KRW',
            'MGA',
            'PYG',
            'RWF',
            'UGX',
            'VND',
            'VUV',
            'XAF',
            'XOF',
            'XPF'
        );
        return in_array($currency, $zeroDecimalCurrencies);
    }

    public function loadPaymentAdditionalInfo()
    {
        $selected_payment_method = $this->default_payment_selected;
        if (!Tools::getIsset('selected_payment_method_id')) {
            return array('html' => '');
        } else {
            $selected_payment_method = Tools::getValue('selected_payment_method_id', 0);
        }

        /**
         * To set the cookie for the selected payment method
         * @modifier Ashish Kumar
         * @date 06-05-2024
         * AKMay2024 stripe-checkout-compatible
         */
        $this->context->cookie->selected_payment_method = $selected_payment_method;
        /** Start Changes to add the Payment Fee on Checkout
         * Updating the fee in the DB based on the selected payment method
         * @date 15-10-2024
         * NAOct2024 payment_fee
         * @modifier Nikhil Aggarwal 
         */
        $sql = 'SELECT * FROM ' . _DB_PREFIX_ . 'kb_supercheckout_payment_fee WHERE id_cart = ' . (int) $this->context->cookie->id_cart;

        $payment_fee = Db::getInstance(_PS_USE_SQL_SLAVE_)->getRow($sql);

        if ($payment_fee) {
            if (Tools::getValue('kbselectedPaymentMethodStatus') == '0') {
                $sql = 'UPDATE ' . _DB_PREFIX_ . 'kb_supercheckout_payment_fee SET paymentfee_applicable = 0 WHERE id_cart = ' . (int) $this->context->cookie->id_cart;
                Db::getInstance(_PS_USE_SQL_SLAVE_)->execute($sql);
            } else {
                $sql = 'UPDATE ' . _DB_PREFIX_ . 'kb_supercheckout_payment_fee SET paymentfee_applicable = ' . (float) Tools::getValue('kbselectedPaymentMethodApplicableFee') . ' WHERE id_cart = ' . (int) $this->context->cookie->id_cart;
                Db::getInstance(_PS_USE_SQL_SLAVE_)->execute($sql);
            }
        }
        // Changes end by Nikhil

        $content = '';
        $finder = new PaymentOptionsFinder();
        $available_payments = $finder->present();
        $is_meet = false;
        foreach ($available_payments as $module_name => $module_options) {
            foreach ($module_options as &$option) {
                $module_instance = Module::getInstanceByName($module_name);
                if (!Validate::isLoadedObject($module_instance)) {
                    continue;
                }

                if ($option['id'] == $selected_payment_method) {
                    $this->context->smarty->assign(array('payment_method_content' => $option));
                    $content = $this->context->smarty->fetch(
                        _PS_MODULE_DIR_ . $this->module->name . '/views/templates/front/payment_method_content.tpl'
                    );
                    $is_meet = true;
                    break;
                }
            }
            if ($is_meet) {
                break;
            }
        }
        return array('html' => $content);
    }

    private function updateDeliveryExtra()
    {
        $error = array();
        $this->context->cart->recyclable = (int) Tools::getValue('recycle');
        $this->context->cart->gift = (int) Tools::getValue('gift');
        $gift_message = Tools::getValue('gift_message', '');
        if ($this->context->cart->gift && !empty($gift_message)) {
            $gift_message = Tools::getValue('gift_message');
            if (!Validate::isMessage($gift_message)) {
                $error[] = $this->module->l('An error occurred while updating your cart');
            } else {
                $this->context->cart->gift_message = strip_tags($gift_message);
            }
        } elseif (!$this->context->cart->gift) {
            $this->context->cart->gift_message = '';
        } else {
            $this->context->cart->gift_message = '';
        }

        if (!$this->context->cart->update()) {
            $error[] = $this->module->l('An error occurred while updating your cart');
        }

        // Carrier has changed, so we check if the cart rules still apply
        CartRule::autoRemoveFromCart($this->context);
        CartRule::autoAddToCart($this->context);

        return array('hasError' => !empty($this->errors), 'errors' => $this->errors);
    }

    /**
     * Start Changes to fix the issue of Order Comment not being saved
     * Below function is used to update the Order Comment
     * @date 04-03-2025
     * NAMar2025 order_comment
     * @modifier Nikhil Aggarwal
     */
    private function updateKBOrderComment()
    {
        $message_content = Tools::getValue('kborder_comment', '');
        if ($message_content) {
            if (!Validate::isMessage($message_content)) {
            } elseif ($old_message = Message::getMessageByCartId((int) $this->context->cart->id)) {
                $message = new Message((int) $old_message['id_message']);
                $message->message = $message_content;
                $message->update();
            } else {
                $message = new Message();
                $message->message = $message_content;
                $message->id_cart = (int) $this->context->cart->id;
                $message->id_customer = (int) $this->context->cart->id_customer;
                $message->add();
            }
        } else {
            if ($old_message = Message::getMessageByCartId($this->context->cart->id)) {
                $message = new Message($old_message['id_message']);
                $message->delete();
            }
        }
        return array('hasError' => 0, 'message' => '');
    }
    // Changes end by Nikhil

    /* function added by rishabh jain */
    private function updateGiftCardMessage()
    {
        $error = array();
        $sender = Tools::getValue('msg_sender');
        $receiver = Tools::getValue('msg_receiver');
        $message = Tools::getValue('kb_gift_msg');
        $id_cart = $this->context->cookie->id_cart;
        $sql = 'Select id_gift_message From ' . _DB_PREFIX_ . 'kb_supercheckout_gift_message where id_cart= ' . (int) $id_cart;
        $exists = DB::getInstance(_PS_USE_SQL_SLAVE_)->getValue($sql);
        if ($exists) {
            $sql = 'update ' . _DB_PREFIX_ . 'kb_supercheckout_gift_message set 
                    kb_sender="' . pSQL($sender) . '" , kb_receiver = "' . psql($receiver) . '", kb_message = "' . psql($message) . '", time_updated = "' . pSQL(date('Y-m-d H:i:s')) . '" where id_cart=' . (int) $id_cart;
            if (Db::getInstance(_PS_USE_SQL_SLAVE_)->execute($sql)) {
                $success_msg = $this->module->l('Gift message Updated successfully');
                return array('hasError' => 0, 'message' => $success_msg);
            }
        } else {
            $sql = 'insert into ' . _DB_PREFIX_ . 'kb_supercheckout_gift_message
                        (`kb_sender`,
                        `kb_receiver` ,
                        `kb_message` ,
                        `id_cart`,
                        `time_updated`,
                        `time_added`
                        ) values(
                        "' . psql($sender) . '","' . psql($receiver) . '","' . psql($message) . '", ' . (int) $id_cart . ',"' . pSQL(date('Y-m-d H:i:s')) . '","' . pSQL(date('Y-m-d H:i:s')) . '")';

            if (Db::getInstance()->execute($sql)) {
                $result = Db::getInstance(_PS_USE_SQL_SLAVE_)->Insert_ID();
                $success_msg = $this->module->l('Gift message Added successfully');
                return array('hasError' => 0, 'message' => $success_msg);
            }
        }
        return array('hasError' => 1);
    }

    /*
     * This function is used just to include all the month texts to translations files.
     * Start - Code Modified by Raghu on 22-Aug-2017 for fixing 'Months Translations on SuperCheckout Page' issue
     */

    private function moduleMonthsIncludeFunction()
    {
        $this->module->l('January');
        $this->module->l('February');
        $this->module->l('March');
        $this->module->l('April');
        $this->module->l('May');
        $this->module->l('June');
        $this->module->l('July');
        $this->module->l('August');
        $this->module->l('September');
        $this->module->l('October');
        $this->module->l('November');
        $this->module->l('December');
    }

    /**
     * Get the delivery option selected, or if no delivery option was selected,
     * the cheapest option for each address
     *
     * @param Country|null $default_country
     * @param bool         $dontAutoSelectOptions
     * @param bool         $use_cache
     *
     * @return array|bool|mixed Delivery option
     */
    protected function superCheckoutGetDeliveryOption($default_country = null, $dontAutoSelectOptions = false, $use_cache = false)
    {
        static $cache = array();
        $cache_id = (int) (is_object($default_country) ? $default_country->id : 0) . '-' . (int) $dontAutoSelectOptions;
        if (isset($cache[$cache_id]) && $use_cache) {
            return $cache[$cache_id];
        }
        // changes
        $delivery_option = array();
        $delivery_option_list = $this->context->cart->getDeliveryOptionList($default_country);

        // The delivery option was selected
        if (isset($this->context->cart->delivery_option) && $this->context->cart->delivery_option != '') {
            if (is_object(json_decode($this->context->cart->delivery_option)) || is_array(json_decode($this->context->cart->delivery_option))) {
                $delivery_option = json_decode($this->context->cart->delivery_option, true);
            } else {
                $delivery_option = json_decode($this->context->cart->delivery_option, true);
            }

            $validated = true;
            if (isset($delivery_option) && $delivery_option != '' && !empty($delivery_option)) {
                if (is_array($delivery_option) && count($delivery_option) > 0) {
                    foreach ($delivery_option as $id_address => $key) {
                        if (!isset($delivery_option_list[$id_address][$key])) {
                            $validated = false;
                            break;
                        }
                    }
                }
            } else {
                $delivery_option = array();
            }
            if ($validated) {
                $cache[$cache_id] = $delivery_option;
                return $delivery_option;
            }
        }

        if ($dontAutoSelectOptions) {
            return false;
        }

        if (isset($this->supercheckout_settings['enable']) && $this->supercheckout_settings['enable'] == 1) {
            foreach ($delivery_option_list as $id_address => $options) {
                if ($this->supercheckout_settings['shipping_method']['default']) {
                    $delivery_option[$id_address] = $this->supercheckout_settings['shipping_method']['default'] . ",";
                    break;
                }
            }
        }
        $cache[$cache_id] = $delivery_option;
        return $delivery_option;
    }

    public function getSelectedSupercheckoutDeliveryOption()
    {
        $devliveryOptions = $this->superCheckoutGetDeliveryOption(null, false, false);
        if (is_array($devliveryOptions)) {
            return current($devliveryOptions);
        }
        return false;
    }
    // <editor-fold defaultstate="collapsed" desc="Below code added by Harish on 23 Nov 2018 for Google AutoComplete Feature">
    public function getUserIP()
    {
        //Function to get IP Address of visitor
        $ip = '';
        if (isset($_SERVER['HTTP_X_FORWARDED_FOR']) && !empty($_SERVER['HTTP_X_FORWARDED_FOR']) && filter_var($_SERVER['HTTP_X_FORWARDED_FOR'], FILTER_VALIDATE_IP) == true) {
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } elseif (isset($_SERVER['HTTP_CLIENT_IP']) && !empty($_SERVER['HTTP_CLIENT_IP']) && filter_var($_SERVER['HTTP_CLIENT_IP'], FILTER_VALIDATE_IP) == true) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (isset($_SERVER['REMOTE_ADDR']) && !empty($_SERVER['REMOTE_ADDR']) && filter_var($_SERVER['REMOTE_ADDR'], FILTER_VALIDATE_IP) == true) {
            $ip = $_SERVER['REMOTE_ADDR'];
        }
        return $ip;
    }
    public function curlGetContents($url)
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_URL, $url);
        $data = curl_exec($ch);
        curl_close($ch);
        return $data;
    }

    public function getIpArray()
    {
        $ip = $this->getUserIp();
        $file_path = _PS_MODULE_DIR_ . 'supercheckout/vendor/maxmind/GeoLite2-Country.mmdb';
        $reader = new Reader($file_path);
        $results = array();

        try {
            $results = $reader->country($ip);
        } catch (Exception $ex) {
        }
        if (!empty($results)) {
            $country_code = $results->country->isoCode;
        }
        if (!empty($results)) {
            return $country_code;
        } else {
            $results_unknown = 'Unknown Country';
            return $results_unknown;
        }
    }
}
