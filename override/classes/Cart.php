<?php
if (!defined('_PS_VERSION_')) {
    exit;
}

class Cart extends CartCore
{
    public function getOrderTotal(
        $withTaxes = true,
        $type = Cart::BOTH,
        $products = null,
        $id_carrier = null,
        $use_cache = false,
        bool $keepOrderPrices = false
    ) {

        /**
         * Added try catch to catch the error regading the kernal container not avilable and return false.
         * @modifier Manish
         * @date 24-04-2026
         * MPARR2026 kernel_contianer_not_available_issue
         */
        try {
            $total = parent::getOrderTotal(
                $withTaxes, $type, $products, $id_carrier, $use_cache, $keepOrderPrices
            );
        } catch (\Throwable $e) {
            if (
                stripos($e->getMessage(), 'Container') !== false
                || stripos($e->getMessage(), 'kernel') !== false
            ) {
                return false;
            }
            throw $e;
        }

        if ($total === false || $total === null) {
            return $total;
        }

        // ONLY add the fee when recording the order (keepOrderPrices = true).
        if ($keepOrderPrices === true && $type === Cart::BOTH) {
            $module = Module::getInstanceByName('supercheckout');
            if ($module && $module->active) {
                $sql = 'SELECT `paymentfee_applicable`
                        FROM `' . _DB_PREFIX_ . 'kb_supercheckout_payment_fee`
                        WHERE `id_cart` = ' . (int) $this->id;
                $row = Db::getInstance()->getRow($sql);
                if (!empty($row) && isset($row['paymentfee_applicable'])) {
                    $fee = (float) $row['paymentfee_applicable'];
                    if ($fee > 0) {
                        $total += $fee;
                    }
                }
            }
        }

        return $total;
    }
}