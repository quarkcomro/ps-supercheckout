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
 * @copyright 2020 Knowband
 * @license   see file: LICENSE.txt
 * @category  PrestaShop Module
 *
 * Description
 * This file is added by Anshul to show the Checkout behavior data. It basically captures the fields which are filled before leaving the cart abandoned
 * and show the same in Checkout Behavior tab field wise. It shows the data of Email, Shipping Method, Payment Method, Shipping Address & Invoice Address.
 * Feature: Checkout Behavior (Jan 2020)
 *
 */
if (!defined('_PS_VERSION_')) {
    exit;
}
class AdminCheckoutBehaviorController extends ModuleAdminController
{
    public function __construct()
    {
        $this->bootstrap = true;
        $this->lang = false;
        $this->explicitSelect = true;
        parent::__construct();
    }

    /**
     * Function defined to set JS & CSS for statistics page
     * @param Bool $isnewtheme
     */
    public function setMedia($isnewtheme = false)
    {
        parent::setMedia($isnewtheme);
        $this->addCSS($this->getKbModuleDir() . 'views/css/checkoutbehavekb.css');
        $this->addJS($this->getKbModuleDir() . 'views/js/admin/abandoned_data.js');
    }

    /**
     * Function to get current module directory
     * @return string
     */
    protected function getKbModuleDir(): string
    {
        return _PS_MODULE_DIR_ . $this->module->name . '/';
    }

    /**
     * Function executed whenever the checkout behavior controller is accessed through parent class
     */
    public function initContent()
    {
        if (Tools::isSubmit('abandoned_data_filter')) {
            //assign custom filter value
            $start_date = strtotime(Tools::getValue('abandoned_data_track_from_date'));
            $end_date = strtotime(Tools::getValue('abandoned_data_track_to_date'));
        } else {
            //if not set then default it would be 3 months
            $start_date = strtotime('-3 months');
            $end_date = time();
        }
        $this->context->smarty->assign('start_date', $start_date);
        $this->context->smarty->assign('end_date', $end_date);
        $this->context->smarty->assign('current_url', $this->context->link->getAdminLink('AdminCheckoutBehavior'));

        //query to fetch abandoned cart amount, ordered cart amount, number of abandoned cart & number of ordered cart day/month/week/year wise
        $sql = "SELECT SQL_CALC_FOUND_ROWS a.`date_add` AS `date_add`, GROUP_CONCAT(a.id_cart) AS carts, o.id_order, 
            SUM(IF(IF (IFNULL(o.id_order, 'Non ordered') = 'Non ordered',
            IF(TIME_TO_SEC(TIMEDIFF('" . pSQL(date('Y-m-d H:i:00', time())) . "', a.`date_add`)) > 86400, 'Abandoned cart', 'Non ordered'), o.id_order) = 'Abandoned cart', 1, 0)) AS abandoned_checkouts,
            SUM(IF(IF (IFNULL(o.id_order, 'Non ordered') = 'Non ordered', IF(TIME_TO_SEC(TIMEDIFF('" . pSQL(date('Y-m-d H:i:00', time())) . "', a.`date_add`)) > 86400, 'Abandoned cart', 'Non ordered'),
            o.id_order) > 0 , 1, 0)) AS ordered_checkouts
            FROM `" . _DB_PREFIX_ . "cart` a 
            LEFT JOIN " . _DB_PREFIX_ . "customer c ON (c.id_customer = a.id_customer)
            LEFT JOIN " . _DB_PREFIX_ . "currency cu ON (cu.id_currency = a.id_currency)
            LEFT JOIN " . _DB_PREFIX_ . "carrier ca ON (ca.id_carrier = a.id_carrier)
            LEFT JOIN " . _DB_PREFIX_ . "orders o ON (o.id_cart = a.id_cart)
            INNER JOIN " . _DB_PREFIX_ . "kb_checkout_behaviour_stats bs ON (bs.id_cart = a.id_cart)
            LEFT JOIN (
            SELECT `id_guest`
            FROM `" . _DB_PREFIX_ . "connections`
            WHERE
            TIME_TO_SEC(TIMEDIFF('" . pSQL(date('Y-m-d H:i:00', time())) . "', `date_add`)) < 1800
            LIMIT 1
            ) AS co ON co.`id_guest` = a.`id_guest`";

        $sql .= ' WHERE a.date_add BETWEEN "' . date('Y-m-d H:i:s', $start_date) . '" AND "' . date('Y-m-d 23:59:59', $end_date) . '"';
        $sql .= ' ORDER BY a.date_add DESC';
        $KPIdata = Db::getInstance()->executeS($sql);
        //get checkout carts behaviour data
        $check_behaviour_data = $this->calculateCheckoutBehaviour(
            date('Y-m-d', $start_date),
            date('Y-m-d', $end_date)
        );
        $this->context->smarty->assign('check_behaviour_data', $check_behaviour_data);
        $ordered_checkouts = 0;
        $abandoned_checkouts = 0;
        foreach ($KPIdata as $key => $value) {
            $ordered_checkouts += (int) $value['ordered_checkouts'];
            $abandoned_checkouts += (int) $value['abandoned_checkouts'];
        }

        $checkout_conversion = 0;
        if ($ordered_checkouts != 0 || $abandoned_checkouts != 0) {
            $checkout_conversion = ($ordered_checkouts) / ($ordered_checkouts + $abandoned_checkouts);
        }

        //render total data
        $helper_kpi = new HelperKpi();
        $helper_kpi->id = 'total_generated';
        $helper_kpi->icon = 'icon-sort-by-attributes-alt';
        $helper_kpi->color = 'color3';
        $helper_kpi->title = $this->module->l('Checkout Conversion', 'AdminCheckoutBehaviorController');
        $helper_kpi->value = number_format($checkout_conversion * 100, 2) . '%';
        $kpis1 = $helper_kpi->generate();
        $helper_kpi->id = 'total_used';
        $helper_kpi->icon = 'icon-shopping-cart';
        $helper_kpi->color = 'color2';
        $helper_kpi->title = $this->module->l('Abandoned Checkouts', 'AdminCheckoutBehaviorController');
        $helper_kpi->value = $abandoned_checkouts;
        $kpis2 = $helper_kpi->generate();
        $helper_kpi->id = 'total_unused';
        $helper_kpi->icon = 'icon-user';
        $helper_kpi->color = 'color4';
        $helper_kpi->title = $this->module->l('Number of orders', 'AdminCheckoutBehaviorController');
        $helper_kpi->value = $ordered_checkouts;
        $kpis5 = $helper_kpi->generate();
        $this->context->smarty->assign('kpis1', $kpis1);
        $this->context->smarty->assign('kpis2', $kpis2);
        $this->context->smarty->assign('kpis5', $kpis5);
        $warning = $this->module->l('Records will be shown here from the date of module installation (Also, the module should be enabled). Each field of the report shows how many times a field has been completed for abandoned checkouts for a selected period.', 'AdminCheckoutBehaviorController');
        $this->warnings[] = $warning;
        $settings = json_decode(Configuration::get('VELOCITY_SUPERCHECKOUT'), true);
        $this->context->smarty->assign('settings', $settings);
        $template_html = $this->context->smarty->fetch(_PS_MODULE_DIR_ . 'supercheckout/views/templates/admin/checkout_behaviour_data.tpl');
        $this->content .= $template_html;
        parent::initContent();
    }

    /**
     * Function defined to calculate the fields data which is filled on abandoning the cart
     * @param string $start_date
     * @param string $end_date
     * @return bool
     */
    protected function calculateCheckoutBehaviour($start_date, $end_date)
    {
        //query to fetch data (total count of a field which is filled and % of total carts) of all shipping & payment address field for the abandoned cart
        $sql = "SELECT SUM(email) as email, "
            . "(SUM(email)*100)/COUNT(*) as email_percent, "
            . "SUM(firstname) as firstname, (SUM(firstname)*100)/COUNT(*) as firstname_percent, "
            . "SUM(lastname) as lastname, (SUM(lastname)*100)/COUNT(*) as lastname_percent,  "
            . "SUM(company) as company, (SUM(company)*100)/COUNT(*) as company_percent, "
            . "SUM(address1) as address1, (SUM(address1)*100)/COUNT(*) as address1_percent, "
            . "SUM(address2) as address2, (SUM(address2)*100)/COUNT(*) as address2_percent, "
            . "SUM(city) as city, (SUM(city)*100)/COUNT(*) as city_percent,"
            . "SUM(id_country) as id_country, (SUM(id_country)*100)/COUNT(*) as id_country_percent, "
            . "SUM(id_state) as id_state, (SUM(id_state)*100)/COUNT(*) as id_state_percent, "
            . "SUM(postcode) as postcode, (SUM(postcode)*100)/COUNT(*) as postcode_percent, "
            . "SUM(phone) as phone, (SUM(phone)*100)/COUNT(*) as phone_percent, "
            . "SUM(phone_mobile) as phone_mobile, (SUM(phone_mobile)*100)/COUNT(*) as phone_mobile_percent, "
            . "SUM(vat_number) as vat_number, (SUM(vat_number)*100)/COUNT(*) as vat_number_percent, "
            . "SUM(dni) as dni, (SUM(dni)*100)/COUNT(*) as dni_percent, SUM(other) as other, "
            . "(SUM(other)*100)/COUNT(*) as other_percent, "
            . "SUM(alias) as alias, (SUM(alias)*100)/COUNT(*) as alias_percent, SUM(shipping_method) as shipping_method, "
            . "(SUM(shipping_method)*100)/COUNT(*) as shipping_method_percent, SUM(payment_method) as payment_method, "
            . "(SUM(payment_method)*100)/COUNT(*) as payment_method_percent, "
            . "SUM(use_for_invoice) as use_for_invoice, (SUM(use_for_invoice)*100)/COUNT(*) as use_for_invoice_percent, "
            . "SUM(firstname_invoice) as firstname_invoice, (SUM(firstname_invoice)*100)/COUNT(*) as firstname_invoice_percent, "
            . "SUM(lastname_invoice) as lastname_invoice, (SUM(lastname_invoice)*100)/COUNT(*) as lastname_invoice_percent, "
            . "SUM(company_invoice) as company_invoice, (SUM(company_invoice)*100)/COUNT(*) as company_invoice_percent, "
            . "SUM(address1_invoice) as address1_invoice, (SUM(address1_invoice)*100)/COUNT(*) as address1_invoice_percent, "
            . "SUM(address2_invoice) as address2_invoice, (SUM(address2_invoice)*100)/COUNT(*) as address2_invoice_percent, "
            . "SUM(city_invoice) as city_invoice, (SUM(city_invoice)*100)/COUNT(*) as city_invoice_percent, "
            . "SUM(id_country_invoice) as id_country_invoice, (SUM(id_country_invoice)*100)/COUNT(*) as id_country_invoice_percent, "
            . "SUM(id_state_invoice) as id_state_invoice, (SUM(id_state_invoice)*100)/COUNT(*) as id_state_invoice_percent, "
            . "SUM(postcode_invoice) as postcode_invoice, (SUM(postcode_invoice)*100)/COUNT(*) as postcode_invoice_percent, "
            . "SUM(phone_invoice) as phone_invoice, (SUM(phone_invoice)*100)/COUNT(*) as phone_invoice_percent, "
            . "SUM(phone_mobile_invoice) as phone_mobile_invoice, (SUM(phone_mobile_invoice)*100)/COUNT(*) as phone_mobile_invoice_percent, "
            . "SUM(vat_number_invoice) as vat_number_invoice, (SUM(vat_number_invoice)*100)/COUNT(*) as vat_number_invoice_percent, "
            . "SUM(dni_invoice) as dni_invoice, (SUM(dni_invoice)*100)/COUNT(*) as dni_invoice_percent, "
            . "SUM(other_invoice) as other_invoice, (SUM(other_invoice)*100)/COUNT(*) as other_invoice_percent, "
            . "SUM(alias_invoice) as alias_invoice, (SUM(alias_invoice)*100)/COUNT(*) as alias_invoice_percent"
            . " FROM " . _DB_PREFIX_ . "kb_checkout_behaviour_stats bs INNER JOIN " . _DB_PREFIX_ . "cart c ON bs.id_cart = c.id_cart "
            . 'WHERE TIME_TO_SEC(TIMEDIFF(\'' . pSQL(date('Y-m-d H:i:00')) . '\', c.`date_add`)) > 86400 AND (c.date_add BETWEEN "' . date('Y-m-d H:i:s', strtotime($start_date)) . '" AND "' . date('Y-m-d 23:59:59', strtotime($end_date)) . '") AND NOT EXISTS (SELECT 1 FROM ' . _DB_PREFIX_ . 'orders o WHERE o.`id_cart` = c.`id_cart`)'
            . '  ORDER BY c.`date_add` desc';
        $result = Db::getInstance()->executeS($sql);
        return $result[0];
    }
}
