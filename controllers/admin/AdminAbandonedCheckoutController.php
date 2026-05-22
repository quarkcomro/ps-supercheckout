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
 * This file is added by Anshul to show the Abandoned cart checkout data. It basically shows the number of abandoned carts, number of ordered carts, abandoned revenues,
 * checkout conversion & ordered revenues day/week/month/year wise. It also shows the graph for the same.
 * Feature:Abcart Stats (Jan 2020)
 */
if (!defined('_PS_VERSION_')) {
    exit;
}
class AdminAbandonedCheckoutController extends ModuleAdminController
{

    public $no_link = true;
    public function __construct()
    {
        $this->bootstrap = true;
        $this->table = 'cart';
        $this->className = 'Cart';
        $this->lang = false;
        $this->explicitSelect = true;

        parent::__construct();

        $this->allow_export = true;

        $this->fields_list = array(
            'period' => array(
                'title' => $this->module->l('Period', 'AdminAbandonedCheckoutController'),
                'search' => false,
                'class' => 'text-center',
                'remove_onclick' => true
            ),
            'ordered_checkouts' => array(
                'title' => $this->module->l('Number of orders', 'AdminAbandonedCheckoutController'),
                'align' => 'text-center',
                'search' => false,
                'remove_onclick' => true
            ),
            'abandoned_checkouts' => array(
                'title' => $this->module->l('Abandoned Checkouts', 'AdminAbandonedCheckoutController'),
                'align' => 'text-center',
                'search' => false,
                'remove_onclick' => true
            ),

            'ordered_revenues' => array(
                'title' => $this->module->l('Ordered Revenues', 'AdminAbandonedCheckoutController'),
                'align' => 'text-center',
                'search' => false,
                'remove_onclick' => true,
                'callback' => 'displayFormattedPrice'
            ),
            'abandoned_revenues' => array(
                'title' => $this->module->l('Abandoned Revenues', 'AdminAbandonedCheckoutController'),
                'align' => 'text-center',
                'search' => false,
                'remove_onclick' => true,
                'callback' => 'displayFormattedPrice'
            ),
            'checkout_conversion' => array(
                'title' => $this->module->l('Checkout Conversion', 'AdminAbandonedCheckoutController'),
                'align' => 'text-center',
                'search' => false,
                'remove_onclick' => true,
                'callback' => 'calculateCheckoutConversion'
            ),

            'date_add' => array(
                'title' => $this->module->l('Date', 'AdminAbandonedCheckoutController'),
                'align' => 'text-left',
                'type' => 'datetime',
                'search' => false,
                'class' => 'hidden',
                'filter_key' => 'a!date_add',
            ),
        );

        $str = '';
        if (Tools::isSubmit('abandoned_data_filter')) {
            //assign custom filter data
            $start_date = date('Y-m-d H:i:s', strtotime(Tools::getValue('abandoned_data_track_from_date')));
            $end_date = date('Y-m-d 23:59:59', strtotime(Tools::getValue('abandoned_data_track_to_date')));
            $ac_filter_format = Tools::getValue('ac_filter_format');
            //Function called to create a query to format date according to filter type (day/month/week/year)
            $this->formatQueryDate($ac_filter_format, $str);
        } else {
            //default filter data
            $start_date = date('Y-m-d 23:59:59', strtotime('-3 months'));
            $end_date = date('Y-m-d 23:59:59', time());
            $ac_filter_format = 'month';
            $str = 'CONCAT(MONTHNAME(a.date_add), " ", YEAR(a.date_add))';
        }
        //calculate abandoned cart amount and insert the same in separate table
        $this->updateAbandonedCartTable($start_date, $end_date);
        $ac_filter_format = Tools::strtoupper($ac_filter_format);
        //this query is written to list down the number of abandoned carts, number of ordered carts, abandoned revenues, checkout conversion & ordered revenues day/week/month/year wise
        $this->_select = ' a.id_cart, o.id_order, ' . $str . ' as period, '
            . ' SUM(IF(IF (IFNULL(o.id_order, "Non ordered") = "Non ordered", IF(TIME_TO_SEC(TIMEDIFF(\'' . pSQL(date('Y-m-d H:i:00', time())) . '\', a.`date_add`)) > 86400, "Abandoned cart", "Non ordered"), o.id_order) = "Abandoned cart", 1, 0)) AS abandoned_checkouts, '
            . ' SUM(IF(IF (IFNULL(o.id_order, "Non ordered") = "Non ordered", IF(TIME_TO_SEC(TIMEDIFF(\'' . pSQL(date('Y-m-d H:i:00', time())) . '\', a.`date_add`)) > 86400, "Abandoned cart", "Non ordered"), o.id_order) > 0 , 1, 0)) AS ordered_checkouts, '
            . ' SUM(IF(IF (IFNULL(o.id_order, "Non ordered") = "Non ordered", IF(TIME_TO_SEC(TIMEDIFF(\'' . pSQL(date('Y-m-d H:i:00', time())) . '\', a.`date_add`)) > 86400, "Abandoned cart", "Non ordered"), o.id_order) > 0 , (cu.conversion_rate * o.total_paid), 0)) AS ordered_revenues, '
            . ' SUM(IF(IF (IFNULL(o.id_order, "Non ordered") = "Non ordered", IF(TIME_TO_SEC(TIMEDIFF(\'' . pSQL(date('Y-m-d H:i:00', time())) . '\', a.`date_add`)) > 86400, "Abandoned cart", "Non ordered"), o.id_order) = "Abandoned cart" , aca.total_amount , 0)) AS abandoned_revenues, "1" as checkout_conversion';

        $this->_join = 'LEFT JOIN ' . _DB_PREFIX_ . 'customer c ON (c.id_customer = a.id_customer)
		LEFT JOIN ' . _DB_PREFIX_ . 'currency cu ON (cu.id_currency = a.id_currency)
		LEFT JOIN ' . _DB_PREFIX_ . 'carrier ca ON (ca.id_carrier = a.id_carrier)
		LEFT JOIN ' . _DB_PREFIX_ . 'orders o ON (o.id_cart = a.id_cart)
		LEFT JOIN ' . _DB_PREFIX_ . 'abandoned_cart_amount aca ON (aca.id_cart = a.id_cart)
		LEFT JOIN (
                SELECT `id_guest`
                FROM `' . _DB_PREFIX_ . 'connections`
                WHERE
                    TIME_TO_SEC(TIMEDIFF(\'' . pSQL(date('Y-m-d H:i:00', time())) . '\', `date_add`)) < 1800
                LIMIT 1
                ) AS co ON co.`id_guest` = a.`id_guest`';
        $this->_where = ' AND a.date_add BETWEEN "' . $start_date . '" AND "' . $end_date . '"';  //get the data of selected date difference
        /*
         * Restrict abandoned cart stats to selected store(s) in multi-store; avoid showing all stores' data
         * @modifier Himanshu Vishwakarma
         * @date 23-02-2025
         */
        if (Shop::isFeatureActive()) {
            $this->_where .= ' AND a.id_shop IN (' . implode(',', array_map('intval', Shop::getContextListShopID())) . ')';
        }
        $this->_group = ' GROUP BY ' . $ac_filter_format . '(a.date_add) '; //filter according to day/month/week/year wise
        $this->_orderBy = 'a.date_add';
        $this->_orderWay = 'DESC';
        $this->no_link = true;

    }

    /*
     * Function defined to remove the ADD NEW button
     */
    public function initToolbar()
    {
        parent::initToolbar();
        unset($this->toolbar_btn['new']);
        unset($this->toolbar_btn['export']);
        unset($this->toolbar_btn['terminal']);
    }

    /*
     * Function defined to render checkout conversion in %
     */
    public function calculateCheckoutConversion($param, $tr)
    {
        if ($tr['ordered_checkouts'] == 0 && $tr['abandoned_checkouts'] == 0) {
            $checkout_conversion = 0;
        } else {
            $checkout_conversion = $tr['ordered_checkouts'] / ($tr['ordered_checkouts'] + $tr['abandoned_checkouts']);
        }
        unset($param);
        return number_format($checkout_conversion * 100, 2) . '%';
    }

    /*
     * Function defined to format the price
     */
    /**
     * Updated the function to add the currency symbol to the price, PS9 compatibility
     * @modifier Himanshu Vishwakarma
     * @date 23-06-2025
     */
    public static function displayFormattedPrice($value)
    {
        return Context::getContext()->currentLocale->formatPrice($value, Context::getContext()->currency->iso_code);
    }

    /*
     * Function defined to calculate the total cart amount of abandoned cart as there is no record for this in core tables so created a new one and uodated the data according to filter
     */
    public function updateAbandonedCartTable($start_date, $end_date)
    {
        $sql = 'TRUNCATE TABLE ' . _DB_PREFIX_ . 'abandoned_cart_amount';
        Db::getInstance()->execute($sql);
        $sql = 'SELECT id_cart, id_address_delivery FROM ' . _DB_PREFIX_ . 'cart WHERE date_add BETWEEN "' . $start_date . '" AND "' . $end_date . '"';

        if (Shop::isFeatureActive()) {
            $sql .= ' AND id_shop IN (' . implode(',', array_map('intval', Shop::getContextListShopID())) . ')';
        }
        $abandoned_cart_data = Db::getInstance()->executeS($sql);
        foreach ($abandoned_cart_data as $data) {
            $data_r = Db::getInstance()->getRow('SELECT count(*) as total FROM ' . _DB_PREFIX_ . 'address WHERE id_address =' . (int) $data['id_address_delivery']);
            if ($data_r['total'] == 1) {
                $cart_amount = self::getOrderTotalUsingTaxCalculationMethod($data['id_cart']);
                $cart_amount = filter_var($cart_amount, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
                $sql = 'INSERT INTO ' . _DB_PREFIX_ . 'abandoned_cart_amount VALUES (' . (int) $data['id_cart'] . ', ' . (float) $cart_amount . ')';
                Db::getInstance()->execute($sql);
            }
        }
    }

    /*
     * Function defined to calculate the total amount of abandoned carts
     */
    public static function getOrderTotalUsingTaxCalculationMethod($id_cart)
    {
        $context = Context::getContext();
        $context->cart = new Cart($id_cart);
        $context->currency = new Currency((int) $context->cart->id_currency);
        $context->customer = new Customer((int) $context->cart->id_customer);

        return self::getTotalCart($id_cart, true, Cart::BOTH_WITHOUT_SHIPPING);
    }

    public static function getTotalCart($id_cart, $use_tax_display = false, $type = Cart::BOTH)
    {
        $cart = new Cart($id_cart);
        if (!Validate::isLoadedObject($cart)) {
            die(Tools::displayError());
        }
        $default_currency = (int) Configuration::get('PS_CURRENCY_DEFAULT');
        $currency = new Currency($default_currency);
        return Tools::convertPriceFull($cart->getOrderTotal($use_tax_display, $type), new Currency((int) $cart->id_currency), $currency);
    }


    /* 
     */
    protected function getKbModuleDir()
    {
        return _PS_MODULE_DIR_ . $this->module->name . '/';
    }

    public function setMedia($isnewtheme = false)
    {
        parent::setMedia($isnewtheme);
        $this->addJS($this->getKbModuleDir() . 'views/js/admin/abandoned_data.js');
        $this->addJqueryPlugin('flot');
    }

    /**
     * Function defined to create a query to format date according to filter type (day/month/week/year)
     * @param string $ac_filter_format
     * @param string $str
     */
    public function formatQueryDate($ac_filter_format, &$str)
    {
        if ($ac_filter_format == 'day') {
            $str = 'DATE_FORMAT(DATE(a.date_add), "%d %b %Y")';
        }
        if ($ac_filter_format == 'week') {
            $str = 'CONCAT(DATE_FORMAT(DATE(a.date_add), "%d %b %Y"), " - ", DATE_FORMAT(DATE(DATE_ADD(a.date_add, INTERVAL 7 DAY)), "%d %b %Y"))';
        }
        if ($ac_filter_format == 'month') {
            $str = 'CONCAT(MONTHNAME(a.date_add), " ", YEAR(a.date_add))';
        }
        if ($ac_filter_format == 'year') {
            $str = 'YEAR(a.date_add)';
        }
    }

    public function initContent()
    {
        $str = '';
        if (Tools::isSubmit('abandoned_data_filter')) {
            //assign custom filter data
            $start_date = strtotime(Tools::getValue('abandoned_data_track_from_date'));
            $end_date = strtotime(Tools::getValue('abandoned_data_track_to_date'));
            $ac_filter_format = Tools::getValue('ac_filter_format');
            $this->formatQueryDate($ac_filter_format, $str);
        } else {
            //default filter data
            $start_date = strtotime('-3 months');
            $end_date = time();
            $ac_filter_format = 'month';
            $str = 'CONCAT(MONTHNAME(a.date_add), " ", YEAR(a.date_add))';
        }
        $this->context->smarty->assign('start_date', $start_date);
        $this->context->smarty->assign('end_date', $end_date);
        $this->context->smarty->assign('ac_filter_format', $ac_filter_format);
        $this->context->smarty->assign('current_url', $this->context->link->getAdminLink('AdminAbandonedCheckout'));

        //query to fetch abandoned cart amount, ordered cart amount, number of abandoned cart & number of ordered cart day/month/week/year wise
        $sql = "SELECT SQL_CALC_FOUND_ROWS a.`date_add` AS `date_add`, a.id_cart, o.id_order, 
            " . $str . " as period,  SUM(IF(IF (IFNULL(o.id_order, 'Non ordered') = 'Non ordered',
            IF(TIME_TO_SEC(TIMEDIFF('" . pSQL(date('Y-m-d H:i:00', time())) . "', a.`date_add`)) > 86400, 'Abandoned cart', 'Non ordered'), o.id_order) = 'Abandoned cart', 1, 0)) AS abandoned_checkouts,
            SUM(IF(IF (IFNULL(o.id_order, 'Non ordered') = 'Non ordered', IF(TIME_TO_SEC(TIMEDIFF('" . pSQL(date('Y-m-d H:i:00', time())) . "', a.`date_add`)) > 86400, 'Abandoned cart', 'Non ordered'),
            o.id_order) > 0 , 1, 0)) AS ordered_checkouts,
            SUM(IF(IF (IFNULL(o.id_order, 'Non ordered') = 'Non ordered', IF(TIME_TO_SEC(TIMEDIFF('" . pSQL(date('Y-m-d H:i:00', time())) . "', a.`date_add`)) > 86400, 'Abandoned cart', 'Non ordered'),
            o.id_order) > 0 , (cu.conversion_rate * o.total_paid), 0)) AS ordered_revenues,
            SUM(IF(IF (IFNULL(o.id_order, 'Non ordered') = 'Non ordered', IF(TIME_TO_SEC(TIMEDIFF('" . pSQL(date('Y-m-d H:i:00', time())) . "', a.`date_add`)) > 86400, 'Abandoned cart', 'Non ordered'),
            o.id_order) = 'Abandoned cart' , aca.total_amount , 0)) AS abandoned_revenues 
            FROM `" . _DB_PREFIX_ . "cart` a 
            LEFT JOIN " . _DB_PREFIX_ . "customer c ON (c.id_customer = a.id_customer)
            LEFT JOIN " . _DB_PREFIX_ . "currency cu ON (cu.id_currency = a.id_currency)
            LEFT JOIN " . _DB_PREFIX_ . "carrier ca ON (ca.id_carrier = a.id_carrier)
            LEFT JOIN " . _DB_PREFIX_ . "orders o ON (o.id_cart = a.id_cart)
            LEFT JOIN " . _DB_PREFIX_ . "abandoned_cart_amount aca ON (aca.id_cart = a.id_cart)
            LEFT JOIN (
            SELECT `id_guest`
            FROM `" . _DB_PREFIX_ . "connections`
            WHERE
            TIME_TO_SEC(TIMEDIFF('" . pSQL(date('Y-m-d H:i:00', time())) . "', `date_add`)) < 1800
            LIMIT 1
            ) AS co ON co.`id_guest` = a.`id_guest`";

        $ac_filter_format = Tools::strtoupper($ac_filter_format);
        $sql .= ' WHERE a.date_add BETWEEN "' . date('Y-m-d H:i:s', $start_date) . '" AND "' . date('Y-m-d 23:59:59', $end_date) . '"'; //get the data of selected date difference

        if (Shop::isFeatureActive()) {
            $sql .= ' AND a.id_shop IN (' . implode(',', array_map('intval', Shop::getContextListShopID())) . ')';
        }
        $sql .= ' GROUP BY ' . $ac_filter_format . '(a.date_add)';   //filter according to day/month/week/year wise
        $sql .= ' ORDER BY a.date_add';
        $KPIdata = Db::getInstance()->executeS($sql);
        $conversion_data_graph = array();
        $ac_complete_data_graph = array();
        //get conversion graph data
        $this->getGraphData($KPIdata, $conversion_data_graph);
        //get revenue & number data of abandoned & ordered cart
        $this->getCompleteAcGraphData($KPIdata, $ac_complete_data_graph);
        $this->context->smarty->assign('ac_complete_data_graph', '');
        $this->context->smarty->assign('conversion_data_graph', '');
        $this->context->smarty->assign('current_currency_sign', $this->context->currency->sign);
        if (!empty($conversion_data_graph)) {
            $this->context->smarty->assign('conversion_data_graph', json_encode($conversion_data_graph));
        }
        if (!empty($ac_complete_data_graph)) {
            $this->context->smarty->assign('ac_complete_data_graph', json_encode($ac_complete_data_graph));
        }

        //calculate total data for ordered cart amount, number of ordered carts, abandoned cart amount & number of abandoned carts
        $ordered_checkouts = 0;
        $abandoned_checkouts = 0;
        $abandoned_revenues = 0;
        $ordered_revenues = 0;
        foreach ($KPIdata as $key => $value) {
            $ordered_checkouts += (int) $value['ordered_checkouts'];
            $abandoned_checkouts += (int) $value['abandoned_checkouts'];
            $abandoned_revenues += (float) $value['abandoned_revenues'];
            $ordered_revenues += (float) $value['ordered_revenues'];
        }

        $checkout_conversion = 0;
        if ($ordered_checkouts != 0 || $abandoned_checkouts != 0) {
            $checkout_conversion = ($ordered_checkouts) / ($ordered_checkouts + $abandoned_checkouts);
        }

        //render kpi
        $helper_kpi = new HelperKpi();
        $helper_kpi->id = 'total_generated';
        $helper_kpi->icon = 'icon-sort-by-attributes-alt';
        $helper_kpi->color = 'color3';
        $helper_kpi->title = $this->module->l('Checkout Conversion', 'AdminAbandonedCheckoutController');
        $helper_kpi->value = number_format($checkout_conversion * 100, 2) . '%';
        $kpis1 = $helper_kpi->generate();
        $helper_kpi->id = 'total_used';
        $helper_kpi->icon = 'icon-shopping-cart';
        $helper_kpi->color = 'color2';
        $helper_kpi->title = $this->module->l('Abandoned Checkouts', 'AdminAbandonedCheckoutController');
        $helper_kpi->value = $abandoned_checkouts;
        $kpis2 = $helper_kpi->generate();
        $helper_kpi->id = 'total_unused';
        $helper_kpi->icon = 'icon-money';
        $helper_kpi->color = 'color2';
        $helper_kpi->title = $this->module->l('Abandoned Revenues', 'AdminAbandonedCheckoutController');
        $helper_kpi->value = self::displayFormattedPrice($abandoned_revenues);
        $kpis3 = $helper_kpi->generate();
        $helper_kpi->id = 'total_unused';
        $helper_kpi->icon = 'icon-user';
        $helper_kpi->color = 'color4';
        $helper_kpi->title = $this->module->l('Number of orders', 'AdminAbandonedCheckoutController');
        $helper_kpi->value = $ordered_checkouts;
        $kpis4 = $helper_kpi->generate();
        $helper_kpi->id = 'total_unused';
        $helper_kpi->icon = 'icon-money';
        $helper_kpi->color = 'color4';
        $helper_kpi->title = $this->module->l('Orders Revenue', 'AdminAbandonedCheckoutController');
        $helper_kpi->value = self::displayFormattedPrice($ordered_revenues);
        $kpis5 = $helper_kpi->generate();
        $this->context->smarty->assign('kpis1', $kpis1);
        $this->context->smarty->assign('kpis2', $kpis2);
        $this->context->smarty->assign('kpis3', $kpis3);
        $this->context->smarty->assign('kpis4', $kpis4);
        $this->context->smarty->assign('kpis5', $kpis5);
        $template_html = $this->context->smarty->fetch(_PS_MODULE_DIR_ . 'supercheckout/views/templates/admin/abandoned_checkout_data.tpl');
        $this->content .= $template_html;
        parent::initContent();
    }

    /*
     * Function defined to calculate the graph data for revenue of abandoned cart & ordered cart in defined time period
     * @params array $KPIdata
     * @params array $ac_complete_data_graph
     */
    private function getCompleteAcGraphData($KPIdata, &$ac_complete_data_graph)
    {
        $i = 0;
        foreach ($KPIdata as $key => $value) {
            $ac_complete_data_graph[$i][] = $value['period'];
            $ac_complete_data_graph[$i][] = $value['abandoned_checkouts'];
            $ac_complete_data_graph[$i][] = $value['abandoned_revenues'];
            $ac_complete_data_graph[$i][] = $value['ordered_checkouts'];
            $ac_complete_data_graph[$i][] = $value['ordered_revenues'];
            $i++;
        }
    }

    /*
     * Function defined to calculate the graph data for conversion rate of abandoned cart & ordered cart in defined time period
     * @params array $KPIdata
     * @params array $conversion_data_graph
     */
    private function getGraphData($KPIdata, &$conversion_data_graph)
    {
        $i = 0;
        foreach ($KPIdata as $key => $value) {
            if ($value['ordered_checkouts'] == 0 && $value['abandoned_checkouts'] == 0) {
                continue;
            }
            $conversion_data_graph[$i][] = $value['period'];
            $check_conv = ($value['ordered_checkouts']) / ($value['ordered_checkouts'] + $value['abandoned_checkouts']);
            $conversion_data_graph[$i][] = number_format($check_conv * 100, 2);
            $i++;
        }
    }
}
