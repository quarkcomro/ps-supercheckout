/**
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future.If you wish to customize PrestaShop for your
 * needs please refer to http://www.prestashop.com for more information.
 * We offer the best and most useful modules PrestaShop and modifications for your online store.
 *
 * @category  PrestaShop Module
 * @author    knowband.com <support@nowband.com>
 * @copyright 2016 Knowband
 * @license   see file: LICENSE.txt
 */
// changes by rishabh jain

var check_guest_checkout = "";

/**
 * Declaring a variable to check further if the stripe's js has been loaded or not
 * @modifier Ashish Kumar
 * @date 06-05-2024
 * AKMay2024 stripe-checkout-compatible
 */

var stripe_loaded_flag = 0;

/*
 * Added to ensure the paypal payment method button remain disable untill all the mandatory policy are marked as checked.
 * @date 28-04-2026
 * @modifier Manish
 * MPAPR2026
 */
$(document).ready(function () {
  function checkSuperPolicy() {
    var allChecked = true;

    $('input[type="checkbox"][id^="kb_super_policy"][data-required="1"]').each(
      function () {
        if (!$(this).is(":checked")) {
          allChecked = false;
          return false;
        }
      },
    );

    if (
      !$('input[name="conditions_to_approve[terms-and-conditions]"]').is(
        ":checked",
      )
    ) {
      allChecked = false;
    }

    if (!allChecked) {
      $(".js-payment-ps_checkout").addClass("disabled");
      $('div[id^="ps_checkout"]')
        .not('[id*="card"]')
        .css("pointer-events", "none");
      $("#ps_checkout-paypal-buttons-container").css("pointer-events", "none");
      $("#ps_checkout-paylater-buttons-container").css(
        "pointer-events",
        "none",
      );
      $(".ps_checkout-button").css("pointer-events", "none");
    } else {
      $(".js-payment-ps_checkout").removeClass("disabled");
      $('div[id^="ps_checkout"]')
        .not('[id*="card"]')
        .css("pointer-events", "auto");
      $("#ps_checkout-paypal-buttons-container").css("pointer-events", "auto");
      $("#ps_checkout-paylater-buttons-container").css(
        "pointer-events",
        "auto",
      );
      $(".ps_checkout-button").css("pointer-events", "auto");
    }
  }

  checkSuperPolicy();
  setTimeout(checkSuperPolicy, 4000);

  $(document).on(
    "change",
    'input[type="checkbox"][id^="kb_super_policy"][data-required="1"], input[name="conditions_to_approve[terms-and-conditions]"]',
    function () {
      checkSuperPolicy();
    },
  );
});

/*
 * Merged All Window Load Functions in one as it only executes once and added the code for the same
 * @date 31-01-2023
 * @commenter Prvind Panday
 */
$(document).ready(function () {
  /*
   * Modified Datepicker daynames and monthnames translation for Custom Field
   * @date 02-02-2023
   * @author Prvind Panday
   * @commenter Prvind Panday
   */

  $(".kb_sc_custom_field_date").on(function () {
    $(this).focus(function () {
      $(this).datepicker("destroy");
      $(this).datepicker("option", "dateFormat", "yy-m-d");
      $(this).datepicker({
        /*
         * @author - Vishal
         * DOC - 17/02/20
         * For all version calenders
         */
        monthNames: date_trans_data[current_iso].monthNames,
        monthNamesShort: date_trans_data[current_iso].monthNamesShort,
        dayNames: date_trans_data[current_iso].dayNames,
        dayNamesShort: date_trans_data[current_iso].dayNamesShort,
        dayNamesMin: date_trans_data[current_iso].dayNamesMin,
      });
    });
  });

  $("div.paypal-buttons-context-iframe").eq(1).remove();
  /*
   * Changes done by kanishla to resolve error with the variable kb_profiles_mapping which is not defined
   * @date 13-02-2023
   * @commentor Kanishka Kannoujia
   */
  if (
    $('select[name="shipping_address_id"]').length &&
    typeof kb_profiles_mapping != "undefined"
  ) {
    for (var i in kb_profiles_mapping) {
      if (
        kb_profiles_mapping[i]["id_address"] ==
        $('select[name="shipping_address_id"]').val()
      ) {
        if ($('select[name="profile_customers"]').length) {
          $('[name="profile_customers"]').val(
            kb_profiles_mapping[i]["id_profile"],
          );
          setFieldsAcctToCustomerProfile(kb_profiles_mapping[i]["id_profile"]);
        } else {
          $(
            "#profile_customers_" + kb_profiles_mapping[i]["id_profile"],
          ).click();
        }
        break;
      }
    }
  }

  if ($('input[name="profile_customers"]').length) {
    setTimeout(function () {
      $('[name="profile_customers"]').first().click();
    }, 3000);
  }

  if ($('select[name="profile_customers"]').length) {
    setFieldsAcctToCustomerProfile($('[name="profile_customers"]').val());
  }

  $('input[name="conditions_to_approve[terms-and-conditions]"]').on(
    "click",
    function () {
      var payment_module_name = $(
        'input:radio[name="payment-option"]:checked',
      ).attr("data-module-name");
      var is_ps_checkout_payment = payment_module_name.includes("ps_checkout");

      if (is_ps_checkout_payment) {
        if (
          $(
            'input[name="conditions_to_approve[terms-and-conditions]"]:checked',
          ).val() == 1
        ) {
          $(".js-payment-" + payment_module_name).removeClass("disabled");
          $("#" + payment_module_name + "-buttons-container").removeAttr(
            "style",
          );
          $(".js-payment-" + payment_module_name).show();
          $(".js-payment-" + payment_module_name + " .accept-cgv").hide();
        } else {
          $(".js-payment-" + payment_module_name).addClass("disabled");
          $("#" + payment_module_name + "-buttons-container").css(
            "pointer-events",
            "none",
          );
          $(".js-payment-" + payment_module_name + " .accept-cgv").show();
        }
      }
    },
  );

  window.addEventListener("resize", function () {
    if (window.matchMedia("screen and (max-width: 768px)").matches) {
      $(".kb_mobile_sc_respo").addClass("kb_mobile_sc_respo_new");
    } else {
      $(".kb_mobile_sc_respo").removeClass("kb_mobile_sc_respo_new");
    }
  });

  //Start:Changes done by Anshul Mittal on 09/01/2020 for adding event so that the data could be updated on DB on filling the fields on checkout page  (Feature: Checkout Behavior (Jan 2020))
  $(
    "form#velsof_supercheckout_form select, form#velsof_supercheckout_form input, form#velsof_supercheckout_form textarea",
  ).on("blur", function () {
    var field_name = $(this).attr("name");
    var use_for_invoice_val = $("#use_for_invoice").is(":checked");
    if (typeof field_name != "undefined" && field_name != "") {
      var filled = true;
      if (field_name.indexOf("email") >= 0) {
        field_name = "email";
      }
      if (field_name.indexOf("shipping_address") >= 0) {
        field_name = field_name.substr(16).replace(/[\[\]]/g, "");
      }
      if (field_name.indexOf("payment_address") >= 0) {
        field_name = field_name.substr(15).replace(/[\[\]]/g, "");
        field_name += "_invoice";
      }
      if ($(this).val().trim() == "") {
        filled = false;
      }
      if (
        field_name == "use_for_invoice" &&
        $("#use_for_invoice").is(":checked")
      ) {
        filled = false;
      }
      updateCheckoutBehaviour(field_name, filled, use_for_invoice_val);
      updateaddress();
    }
  });

  checkDniandVatNumber("delivery");
  //End:Changes done by Anshul Mittal on 09/01/2020 for adding event so that the data could be updated on DB on filling the fields on checkout page  (Feature: Checkout Behavior (Jan 2020))

  //clear cart after removing the products from block cart.
  document.addEventListener("click", function (event) {
    if (event.target.matches(".ajax_cart_block_remove_link")) {
      setTimeout(function () {
        location.reload();
      }, 1000);
    }
  });

  var script = document.createElement("script");
  script.src = "https://code.jquery.com/ui/1.12.1/jquery-ui.min.js";
  script.onload = function () {
    console.log("jQuery UI loaded:", typeof jQuery.fn.datepicker);
    // Initialize datepicker after jQuery UI is loaded
    if ($(".kb_sc_custom_field_date").length) {
      // Datepicker initialization is now handled in the jQuery UI script.onload callback
    }
  };
  document.head.appendChild(script);
  /* Start: Changes done by Anshul for adding datepicker*/
  // Datepicker initialization moved to script.onload callback

  $(".kbfiletype").addClass("form-control");
  /* End: Changes done by Anshul for adding datepicker*/

  $('input[name="profile_customers"]').on("click", function () {
    setFieldsAcctToCustomerProfile(
      $('[name="profile_customers"]:checked').val(),
    );
  });

  $('select[name="profile_customers"]').on("change", function () {
    setFieldsAcctToCustomerProfile($('[name="profile_customers"]').val());
  });

  if ($("#divkbmobilelogin").length == 1) {
    $("#divkbmobilelogin").dialog({
      autoOpen: false,
      show: "slide",
      resizable: false,
      position: "center",
      stack: true,
      height: "auto",
      width: "auto",
      modal: true,
    });
    $('input[name="mobile_option"]').on("click", function () {
      mobile_option(this);
    });
    $('input[name="password_option"]').on("click", function () {
      password_option(this);
    });
    $(
      'input[name="supercheckout_mobile_number"], select[name="mobile_country"]',
    ).on("change", function () {
      checkMobileNumberExist();
    });
  }
  // changes started by rishabh jain

  // changes by rishabh jain
  if (typeof cart_empty != "undefined" && cart_empty == true) {
    return;
  }
  checkCustomFieldBlocks();
  var hash_error = document.location.hash;
  if (hash_error.indexOf("#stripe_error") > -1) {
    $("#supercheckout-empty-page-content").append(
      '<div class="permanent-warning">There was a problem with your payment</div>',
    );
  }

  if (typeof supercheckout_subscribe_mailchimp != "undefined") {
    $("#email").blur(function () {
      var email = $("#email").val();
      subscribeCustomer(email, "mailchimp");
    });
  }
  if (typeof supercheckout_subscribe_sendinblue != "undefined") {
    $("#email").blur(function () {
      var email = $("#email").val();
      subscribeCustomer(email, "SendinBlue");
    });
  }
  if (typeof supercheckout_subscribe_klaviyo != "undefined") {
    $("#email").blur(function () {
      var email = $("#email").val();
      subscribeCustomer(email, "klaviyo");
    });
  }
  $("#" + page_lang_code + "_content").show();

  checkout_option("input:radio[name=checkout_option]:checked");

  //Display password field, based on checkout option
  $('input[name="checkout_option"]').on("click", function () {
    checkout_option(this);
  });

  //to hide social login block when by default guest checkout is selected
  if ($("input:radio[name=checkout_option]:checked").val() == 1) {
    $("#social_login_block").hide();
    // changes by rishabh jain for google recaptcha
    if ($("#supercheckout-new-customer-form").length) {
      if ($("#html_element_login").length) {
        $("#supercheckout-new-customer-form").append($("#html_element_login"));
        $("#html_element_login").show();
      }
    }
  }

  //To hide Delivery address block when by default login checkout is selected
  if ($("input:radio[name=checkout_option]:checked").val() == 0) {
    $("#checkoutShippingAddress").hide();
    $("#checkoutBillingAddress").hide();
    // changes by rishabh jain for google recaptcha integration
    if ($("#forgotpasswordlink").length) {
      if ($("#html_element_login").length) {
        // changes by rishabh jain for google recaptcha
        $("#supercheckout-login-box").append($("#html_element_login"));
        $("#html_element_login").show();
      }
    }
    // changes over
    /*
     * Hide registration custom fields when Login option is selected on initial load
     * 27-02-2026
     */
    $("#registration_custom_fields_block").hide();
  } else {
    /*
     * Show registration custom fields when Guest or Register option is selected on initial load
     * 27-02-2026
     */
    $("#registration_custom_fields_block").show();
  }

  // Login Action
  $("#checkoutLogin").on("click", "#button-login", function () {
    supercheckoutlogin();
  });

  // Create State list
  /* Start - Code Added by Raghu on 21-Aug-2017 for fixing 'Unable to save data when l'Aquila state is selected. After this, if we refresh the page the js error is persisting' issue */
  if (
    typeof guest_information != "undefined" &&
    typeof guest_information["id_state"] != "undefined"
  ) {
    statelist(
      guest_information["id_country"],
      guest_information["id_state"],
      'select[name="shipping_address[id_state]"]',
    );
  } else {
    statelist(default_country, 0, 'select[name="shipping_address[id_state]"]');
  }
  if (
    typeof guest_information != "undefined" &&
    typeof guest_information["invoice_id_state"] != "undefined"
  ) {
    statelist(
      guest_information["invoice_id_country"],
      guest_information["invoice_id_state"],
      'select[name="payment_address[id_state]"]',
    );
  } else {
    statelist(default_country, 0, 'select[name="payment_address[id_state]"]');
  }
  /* End - Code Added by Raghu on 21-Aug-2017 for fixing 'Unable to save data when l'Aquila state is selected. After this, if we refresh the page the js error is persisting' issue */

  /**
   * Start Changes to fix the issue of delivery form being shown in the login tab of supercheckout in case of virtual product
   * Adding condition to check if checkout option is selected and the option is not blank
   * NASep2023 virtual_login_form
   * @date 25-09-2023
   * @modifier Nikhil Aggarwal
   */
  if (
    show_delivery_add_for_virtualcart == true &&
    ($('input[name="checkout_option"]:checked').val() == "undefined" ||
      $('input[name="checkout_option"]:checked').val() != 0)
  ) {
    // Changes end by Nikhil
    $("#use_for_invoice").prop("checked", false);
    $("#checkoutBillingAddress").slideDown();
    updateInvoiceAddress();
  }

  if ($("#use_for_invoice").is(":checked")) {
    updateInvoiceAddress();
  }

  // BOC - Handling Delivery Address Event
  if ($('input[name="shipping_address_value"]:checked').val() == 1) {
    shipping_address_value($('input[name="shipping_address_value"]:checked'));
  }

  $("#checkoutShippingAddress").on(
    "change",
    'input[name="shipping_address_value"]',
    function () {
      shipping_address_value(this);
    },
  );

  $("#checkoutShippingAddress").on(
    "change",
    'select[name="shipping_address_id"]',
    function (e) {
      buildAddressBlock($(this).val(), "delivery");
      if ($("#use_for_invoice").is(":checked")) {
        updateInvoiceAddress();
      }
      loadCarriers();
      /*
       * Added by Anshul
       */
      $(".shipping_update_form").remove();
      $("#supercheckout_update_address_button").remove();
      /*
       * Added by Anshul
       */

      for (var i in kb_profiles_mapping) {
        if (kb_profiles_mapping[i]["id_address"] == $(this).val()) {
          if ($('select[name="profile_customers"]').length) {
            $('[name="profile_customers"]').val(
              kb_profiles_mapping[i]["id_profile"],
            );
            setFieldsAcctToCustomerProfile(
              kb_profiles_mapping[i]["id_profile"],
            );
          } else {
            $(
              "#profile_customers_" + kb_profiles_mapping[i]["id_profile"],
            ).click();
          }
          break;
        }
      }
    },
  );

  $("#checkoutShippingAddress").on("click", "#use_for_invoice", function () {
    updateInvoiceAddress();
    if ($(this).is(":checked")) {
      $("#checkoutBillingAddress").slideUp();
    } else {
      $("#checkoutBillingAddress").slideDown();
      checkDniandVatNumber("invoice");
    }
    updateInvoiceStatus(this);
    if (
      $('input[name="shipping_address_value"]:checked').val() == 0 &&
      $('input[name="payment_address_value"]:checked').val() == 0
    ) {
      $("#supercheckout_save_address_button").hide();
    } else {
      $("#supercheckout_save_address_button").show();
    }
  });

  //Create shipping state list based on selected shipping country
  $('select[name="shipping_address[id_country]"]').change(function () {
    var selected_country = $(this).find("option:selected").attr("value");
    var selected_state = 0;
    statelist(
      selected_country,
      selected_state,
      'select[name="shipping_address[id_state]"]',
    );
    checkDniandVatNumber("delivery");
    if (
      $('input[name="shipping_address[postcode]"]').length &&
      $('input[name="shipping_address[postcode]"]').val() != ""
    ) {
      checkZipCode(this, true);
    } else {
      loadCarriers(true);
    }
  });

  //Change shipping state list, if shipping address is same as payment address
  $("#shipping-new").on(
    "change",
    'select[name="shipping_address[id_state]"]',
    function () {
      if ($("#use_for_invoice").is(":checked")) {
        var selected_state = $(this).find("option:selected").attr("value");
        $('select[name="payment_address[id_state]"] option').removeAttr(
          "selected",
        );
        $('select[name="payment_address[id_state]"] option').each(function () {
          if ($(this).val() == selected_state) {
            $(this).prop("selected", true);
          }
        });
      }
      loadCarriers(true);
    },
  );

  $('input[name="shipping_address[dni]"]').on("blur", function () {
    isValidDni("delivery");
  });

  $('input[name="shipping_address[vat_number]"]').on("blur", function () {
    isValidVatNumber("delivery");
  });

  $('input[name="shipping_address[postcode]"]').on("blur", function () {
    checkZipCode(this, true);
  });
  // EOC - Handling Delivery Address Event

  // BOC - Handling Payment Address Event
  $("#payment-existing").on(
    "change",
    'select[name="payment_address_id"]',
    function (e) {
      buildAddressBlock($(this).val(), "invoice");
      _loadInvoiceAddress();
      checkDniandVatNumber("invoice");
      /*
       * Added by Anshul
       */
      $(".payment_update_form").remove();
      $("#supercheckout_update_address_button_payment").remove();
      /*
       * Added by Anshul
       */
    },
  );

  $('input[name="payment_address_value"]').on("click", function () {
    if ($(this).val() == 0) {
      $("#payment-new").slideUp();
    } else if ($(this).val() == 1) {
      /* Code added by Anshul to show the new address form again if update form is cancelled. */
      if (!$("#checkoutBillingAddress #payment-new").length) {
        $("#payment-new").insertAfter(
          $("#uniform-payment-address-new").closest(
            ".supercheckout-extra-wrap",
          ),
        );
        $("#payment-new").show();
      }
      /* Code added by Anshul to show the new address form again if update form is cancelled. */
      $("#payment-new").slideDown();
      checkDniandVatNumber("invoice");
      checkZipCode(this, false);
    }
    if (
      $('input[name="shipping_address_value"]:checked').val() == 0 &&
      $('input[name="payment_address_value"]:checked').val() == 0
    ) {
      $("#supercheckout_save_address_button").hide();
    } else {
      $("#supercheckout_save_address_button").show();
    }
    _loadInvoiceAddress();
  });

  $("#payment-new").on(
    "change",
    'select[name="payment_address[id_country]"]',
    function () {
      var selected_country = $(this).find("option:selected").attr("value");
      var selected_state = 0;
      statelist(
        selected_country,
        selected_state,
        'select[name="payment_address[id_state]"]',
      );
      _loadInvoiceAddress();
      checkDniandVatNumber("invoice");
      checkZipCode(this, false);
    },
  );

  $("#payment-new").on(
    "change",
    'select[name="payment_address[id_state]"]',
    function () {
      _loadInvoiceAddress();
    },
  );

  $('input[name="payment_address[dni]"]').on("blur", function () {
    isValidDni("invoice");
  });

  $('input[name="payment_address[vat_number]"]').on("blur", function () {
    isValidVatNumber("invoice");
  });

  $('input[name="payment_address[postcode]"]').on("blur", function () {
    checkZipCode(this, false);
  });
  // EOC - Handling Payment Address Event

  //Display Selected Address detail
  buildAddressBlock(
    $('select[name="shipping_address_id"] option:selected').val(),
    "delivery",
  );
  buildAddressBlock(
    $('select[name="payment_address_id"] option:selected').val(),
    "invoice",
  );

  loadCarriers();

  //BOC - Cart Detail Handling Event
  if (update_qty_button == 1) {
    //quantitty change on blur
    $("#confirmCheckout").on("blur", ".quantitybox", function () {
      var element = $(this).attr("name");
      var hidden_qty = parseInt(
        $("#confirmCheckout input[name=" + element + "_hidden]").val(),
      );
      var user_qty = parseInt(
        $("#confirmCheckout  input[name=" + element + "]").val(),
      );
      if (isNaN(user_qty) || Number(user_qty) < 0) {
        $("#cart_update_warning .permanent-warning").remove();
        $("#cart_update_warning").html(
          '<div class="permanent-warning">' + nanvalidqty + "</div>",
        );
        return;
      }
      // chnages by rishabh jain for min quantity
      var min_qty = parseInt(
        $("#confirmCheckout input[name=" + element + "_minqty]").val(),
      );
      if (min_qty > 1 && user_qty < min_qty) {
        var id = $(this).attr("name").replace("quantity_", "");
        deleteProductFromCart(id);
      }
      user_qty = parseInt(user_qty);
      $("#confirmCheckout  input[name=" + element + "]").val(user_qty);
      // changes over
      if (hidden_qty > user_qty) {
        updateQty(element, "down", hidden_qty - user_qty, false);
      } else if (hidden_qty < user_qty) {
        updateQty(element, "up", user_qty - hidden_qty, false);
      } else {
        $("#cart_update_warning").html(
          '<div class="permanent-warning">' + updateSameQty + "</div>",
        );
      }
    });
  }
  //EOC - Cart Detail Handling Event

  //BOC - Show or hide gift comment
  $("#supercheckout-gift_container").on("click", "#gift", function () {
    if ($(this).is(":checked")) {
      $("#supercheckout-gift-comments").slideDown();
      // changes by rishabh jain
      $("#supercheckout-gift_kb_message_container").slideDown();
      // changes over
    } else {
      $("#supercheckout-gift-comments").slideUp();
      // changes by rishabh jain
      $("#supercheckout-gift_kb_message_container").slideUp();
      // changes over
    }
    updateDeliveryExtraChange();
  });
  if ($("#gift").is(":checked")) {
    $("#supercheckout-gift-comments").show();
  }
  //EOC - Show or hide gift comment

  //boc by rishabh jain
  $("#supercheckout-gift_kb_message_container").on(
    "click",
    "#kb_message_gift",
    function () {
      if ($(this).is(":checked")) {
        $("#edit_kb_gift_message").show();
        showGiftMessagePopup();
      } else {
        $("#edit_kb_gift_message").hide();
      }
    },
  );
  //eoc by rishabh jain

  /**
   * Start Changes to fix the issue of Order Comment not being saved
   * Below function is used to update the Order Comment
   * @date 04-03-2025
   * NAMar2025 order_comment
   * @modifier Nikhil Aggarwal
   */
  $("#supercheckout-comment_order").on("blur", function () {
    kbupdateOrderComment();
  });
  // Changes end by Nikhil

  //BOC - Update cart on Delivery change
  $("#shipping-method").on(
    "change",
    ".supercheckout_shipping_option",
    function () {
      $("#shipping-method").find("li").removeClass("alert-info");
      $(".delivery_option_radio:checked").closest("li").addClass("alert-info");
      updateCarrierOnDeliveryChange();
    },
  );
  //BOC - Update cart on Delivery change

  $("#payment-method").on(
    "change",
    'input:radio[name="payment-option"]',
    function () {
      $("#payment-method")
        .find(".payment-option-item")
        .removeClass("alert-info");
      $('input[name="payment-option"]:checked')
        .closest(".payment-option-item")
        .addClass("alert-info");

      /**
       * Start Changes to fix the issue of showing default payment method to be shown as selected on page reload
       * Marking the payment method checked by using the payment_method cookie
       * NASep2023 payment_method_cookie
       * @date 26-09-2023
       * @modifier Nikhil Aggarwal
       */
      setCookie(
        "payment_method",
        $('input:radio[name="payment-option"]:checked').val(),
      );
      // Changes end by Nikhil
      loadPaymentAddtionalInfo();
    },
  );

  $("#supercheckout_confirm_order").click(function () {
    if ($('input:text[name="supercheckout_email"]').length != 0) {
      var email_field_value = $('input:text[name="supercheckout_email"]').val();
      if (email_field_value == "") {
        $('input:text[name="supercheckout_email"]')
          .parent()
          .find("span.errorsmall")
          .remove();
        $('input:text[name="supercheckout_email"]').removeClass("error-form");
        $('input:text[name="supercheckout_email"]').removeClass("ok-form");
        $('input:text[name="supercheckout_email"]').addClass("error-form");
        $('input[name="supercheckout_email"]')
          .parent()
          .append('<span class="errorsmall">' + required_error + "</span>");
        displayGeneralError(display_general_error_msg);
        $("html, body").animate(
          {
            scrollTop: 0,
          },
          "fast",
        );
        return false;
      } else if (!validateEmail(email_field_value)) {
        $('input:text[name="supercheckout_email"]')
          .parent()
          .find("span.errorsmall")
          .remove();
        $('input:text[name="supercheckout_email"]').removeClass("error-form");
        $('input:text[name="supercheckout_email"]').removeClass("ok-form");
        $('input:text[name="supercheckout_email"]').addClass("error-form");
        $('input[name="supercheckout_email"]')
          .parent()
          .append('<span class="errorsmall">' + invalid_email + "</span>");
        displayGeneralError(display_general_error_msg);
        $("html, body").animate(
          {
            scrollTop: 0,
          },
          "fast",
        );
        return false;
      }
    }
    placeOrder();
  });

  //BOC - Remove Field Errors on active input of addresses
  $("#checkoutBillingAddress input, #checkoutShippingAddress input").on(
    "focus",
    function () {
      $(this).parent().find("span.errorsmall").remove();
    },
  );
  //EOC - Remove Field Errors on active input of addresses

  //BOC -Remove Field Errors on active input of checkout options
  $(
    'input[name="supercheckout_email"], input[name="supercheckout_password"], input[name="customer_personal[password]"]',
  ).on("focus", function () {
    $(this).parent().find("span.errorsmall").remove();
  });
  $(".supercheckout_personal_dob select").on("focus", function () {
    $(".supercheckout_personal_dob").find("span.errorsmall").remove();
  });
  $(".supercheckout_personal_id_gender input").on("focus", function () {
    $(".supercheckout_personal_id_gender").find("span.errorsmall").remove();
  });
  $(".supercheckout_offers_option input").on("click", function () {
    $(".supercheckout_personal_id_gender")
      .parent()
      .parent()
      .parent()
      .parent()
      .find("span.errorsmall")
      .remove();
  });
  $(
    'textarea[name="payment_address[other]"], textarea[name="shipping_address[other]"]',
  ).on("focus", function () {
    $(this).parent().find("span.errorsmall").remove();
  });
  //EOC -Remove Field Errors on active input of checkout options

  //BOC - Place Orde Button Background Color
  $("#supercheckout-fieldset .orangebutton").mouseover(function () {
    if (button_background != "F77219")
      $(this).css("background", "#" + ColorLuminance(button_background, -0.2));
  });
  $("#supercheckout-fieldset .orangebuttonsmall").mouseover(function () {
    if (button_background != "F77219")
      $(this).css("background", "#" + ColorLuminance(button_background, -0.2));
  });
  $("#supercheckout-fieldset .orangebuttonapply").mouseover(function () {
    if (button_background != "F77219")
      $(this).css("background", "#" + ColorLuminance(button_background, -0.2));
  });
  $("#supercheckout-fieldset .orangebutton").mouseout(function () {
    if (button_background != "F77219")
      $(this).css("background", "#" + button_background);
  });
  $("#supercheckout-fieldset .orangebuttonsmall").mouseout(function () {
    if (button_background != "F77219")
      $(this).css("background", "#" + button_background);
  });
  $("#supercheckout-fieldset .orangebuttonapply").mouseout(function () {
    if (button_background != "F77219")
      $(this).css("background", "#" + button_background);
  });
  //EOC - Place Orde Button Background Color

  //on blur validation
  applyInlineValidation();

  //Added for showing Social Loginizer buttons on SuperCheckout page
  if (typeof loginizer_html != "undefined") {
    $("#ivss_socialloginizer_buttons").after(loginizer_html);
  } else {
    $(".vss_socialloginizer_buttons").remove();
  }

  check_guest_checkout = location.search.split("checkout_option=")[1];
  if (check_guest_checkout == "guest")
    $("#guest_checkout").attr("checked", "checked");

  $("#supercheckout_save_address").click(function () {
    if ($('input:text[name="supercheckout_email"]').length != 0) {
      var email_field_value = $('input:text[name="supercheckout_email"]').val();
      if (email_field_value == "") {
        $('input:text[name="supercheckout_email"]')
          .parent()
          .find("span.errorsmall")
          .remove();
        $('input:text[name="supercheckout_email"]').removeClass("error-form");
        $('input:text[name="supercheckout_email"]').removeClass("ok-form");
        $('input:text[name="supercheckout_email"]').addClass("error-form");
        $('input[name="supercheckout_email"]')
          .parent()
          .append('<span class="errorsmall">' + required_error + "</span>");
        displayGeneralError(display_general_error_msg);
        $("html, body").animate(
          {
            scrollTop: 0,
          },
          "fast",
        );
        return false;
      } else if (!validateEmail(email_field_value)) {
        $('input:text[name="supercheckout_email"]')
          .parent()
          .find("span.errorsmall")
          .remove();
        $('input:text[name="supercheckout_email"]').removeClass("error-form");
        $('input:text[name="supercheckout_email"]').removeClass("ok-form");
        $('input:text[name="supercheckout_email"]').addClass("error-form");
        $('input[name="supercheckout_email"]')
          .parent()
          .append('<span class="errorsmall">' + invalid_email + "</span>");
        displayGeneralError(display_general_error_msg);
        $("html, body").animate(
          {
            scrollTop: 0,
          },
          "fast",
        );
        return false;
      }
    }
    saveAddress();
  });

  if (
    typeof show_on_supercheckout != "undefined" &&
    show_on_supercheckout == "small_buttons"
  ) {
    $("#ivss_socialloginizer_buttons").after(loginizer_small);
  } else if (
    typeof show_on_supercheckout != "undefined" &&
    show_on_supercheckout == "large_buttons"
  ) {
    $("#ivss_socialloginizer_buttons").after(loginizer_large);
  } else {
    $(".vss_socialloginizer_buttons").remove();
  }

  if (
    typeof enable_save_address_front != "undefined" &&
    enable_save_address_front == 1
  ) {
    if (
      $('input[name="shipping_address_value"]:checked').val() == 0 &&
      $('input[name="payment_address_value"]:checked').val() == 0
    ) {
      $("#supercheckout_save_address_button").hide();
    } else {
      if ($('input[name="checkout_option"]:checked').val() == 0) {
        $("#supercheckout_save_address_button").hide();
      } else {
        $("#supercheckout_save_address_button").show();
      }
    }
  }
});

//Function created by Anshul to apply inline validation so that it can be called anywhere after AJAX success in order to re-bind the events
function applyInlineValidation() {
  if (inline_validation == 1) {
    $(
      'input[name="supercheckout_password"], input[name="customer_personal[password]"]',
    ).on("blur", function () {
      if ($(this).val() == "") {
        $(this).removeClass("error-form");
        $(this).removeClass("ok-form");
        $(this).addClass("error-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + required_error + "</span>");
      } else if (!validatePasswd($(this).val())) {
        $(this).removeClass("error-form");
        $(this).removeClass("ok-form");
        $(this).addClass("error-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + pwd_error + "</span>");
      } else {
        $(this).removeClass("error-form");
        $(this).removeClass("ok-form");
        $(this).addClass("ok-form");
      }
    });
    $('input[name="supercheckout_email"]').on("blur", function () {
      if ($(this).val() == "") {
        $(this).removeClass("error-form");
        $(this).removeClass("ok-form");
        $(this).addClass("error-form");
        $('input[name="supercheckout_email"]')
          .parent()
          .append('<span class="errorsmall">' + required_error + "</span>");
      } else if (!validateEmail($(this).val())) {
        $(this).removeClass("error-form");
        $(this).removeClass("ok-form");
        $(this).addClass("error-form");
        $('input[name="supercheckout_email"]')
          .parent()
          .append('<span class="errorsmall">' + invalid_email + "</span>");
      } else {
        $(this).removeClass("error-form");
        $(this).removeClass("ok-form");
        $(this).addClass("ok-form");
      }
    });
    $(
      'input[name="shipping_address[firstname]"], input[name="shipping_address[lastname]"], input[name="payment_address[firstname]"], input[name="payment_address[lastname]"] ',
    ).on("blur", function () {
      /**
       * Added below line to fix issue of multiple occurrence of error message
       * remove already added error class
       * TGMAR2023 Remove-ErrorClass
       * @date 10-03-2023
       * @author Tanisha Gupta
       */
      $(this).parent().find("span.errorsmall").remove();
      if (
        $(this).parent().find(".supercheckout-required").css("display") ==
          "none" &&
        $(this).val() == ""
      ) {
        $(this).removeClass("ok-form error-form");
      } else if ($(this).val() == "") {
        $(this).removeClass("ok-form").addClass("error-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + required_error + "</span>");
      } else if (!validateName($(this).val())) {
        $(this).removeClass("ok-form").addClass("error-form");
        if (validateOnlyNumber($(this).val())) {
          $(this)
            .parent()
            .append('<span class="errorsmall">' + number_error + "</span>");
        } else {
          $(this)
            .parent()
            .append('<span class="errorsmall">' + splchar_error + "</span>");
        }
      } else if (validateName($(this).val())) {
        $(this).removeClass("error-form").addClass("ok-form");
      }
    });
    $(
      'input[name="shipping_address[address1]"], input[name="payment_address[address1]"]',
    ).on("blur", function () {
      /**
       * Added below line to fix issue of multiple occurrence of error message
       * remove already added error class
       * TGMAR2023 Remove-ErrorClass
       * @date 10-03-2023
       * @author Tanisha Gupta
       */
      $(this).parent().find("span.errorsmall").remove();
      $(this).removeClass("ok-form error-form");
      if (
        $(this).parent().find(".supercheckout-required").css("display") ==
          "none" &&
        $(this).val() == ""
      ) {
        $(this).removeClass("ok-form error-form");
      } else if ($(this).val() == "") {
        $(this).removeClass("ok-form").addClass("error-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + required_error + "</span>");
      } else if (!validateAddress($(this).val())) {
        $(this).removeClass("ok-form").addClass("error-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + invalid_address + "</span>");
      } else if (validateAddress($(this).val())) {
        if (!$(this).val().match(/\d+/)) {
          if (!$(this).parent().find(".warningsmall").length)
            $(this)
              .parent()
              .append(
                '<span class="warningsmall">' +
                  street_number_warning +
                  "</span>",
              );
        } else {
          $(this).parent().find(".warningsmall").remove();
        }
        $(this).removeClass("error-form").addClass("ok-form");
      }
    });

    $(
      'input[name="shipping_address[address2]"], input[name="payment_address[address2]"]',
    ).on("blur", function () {
      /**
       * Added below line to fix issue of multiple occurrence of error message
       * remove already added error class
       * TGMAR2023 Remove-ErrorClass
       * @date 10-03-2023
       * @author Tanisha Gupta
       */
      $(this).parent().find("span.errorsmall").remove();
      if (
        $(this).parent().find(".supercheckout-required").css("display") ==
          "none" &&
        $(this).val() == ""
      ) {
        $(this).removeClass("ok-form error-form");
      } else if ($(this).val() == "") {
        $(this).removeClass("ok-form").addClass("error-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + required_error + "</span>");
      } else if (!validateAddress($(this).val())) {
        $(this).removeClass("ok-form").addClass("error-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + invalid_address + "</span>");
      } else if (validateAddress($(this).val())) {
        $(this).removeClass("error-form").addClass("ok-form");
      }
    });

    $(
      'input[name="shipping_address[city]"], input[name="payment_address[city]"]',
    ).on("blur", function () {
      /**
       * Added below line to fix issue of multiple occurrence of error message
       * remove already added error class
       * TGMAR2023 Remove-ErrorClass
       * @date 10-03-2023
       * @author Tanisha Gupta
       */
      $(this).parent().find("span.errorsmall").remove();
      if (
        $(this).parent().find(".supercheckout-required").css("display") ==
          "none" &&
        $(this).val() == ""
      ) {
        $(this).removeClass("ok-form error-form");
      } else if ($(this).val() == "") {
        $(this).removeClass("ok-form").addClass("error-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + required_error + "</span>");
      } else if (!validateCityName($(this).val())) {
        $(this).removeClass("ok-form").addClass("error-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + invalid_city + "</span>");
      } else if (validateCityName($(this).val())) {
        $(this).removeClass("error-form").addClass("ok-form");
      }
    });
    $(
      'input[name="payment_address[alias]"], input[name="shipping_address[alias]"]',
    ).on("blur", function () {
      /**
       * Added below line to fix issue of multiple occurrence of error message
       * remove already added error class
       * TGMAR2023 Remove-ErrorClass
       * @date 10-03-2023
       * @author Tanisha Gupta
       */
      $(this).parent().find("span.errorsmall").remove();
      if (
        $(this).parent().find(".supercheckout-required").css("display") ==
          "none" &&
        $(this).val() == ""
      ) {
        $(this).removeClass("ok-form error-form");
      } else if ($(this).val() == "") {
        $(this).removeClass("ok-form").addClass("error-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + required_error + "</span>");
      } else if (!validateAddressTitle($(this).val())) {
        $(this).removeClass("ok-form").addClass("error-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + invalid_title + "</span>");
      } else if (validateAddressTitle($(this).val())) {
        $(this).removeClass("error-form").addClass("ok-form");
      }
    });
    $(
      'input[name="shipping_address[company]"], input[name="payment_address[company]"], input[name="shipping_address[dni]"], input[name="payment_address[dni]"]',
    ).on("blur", function () {
      /**
       * Added below line to fix issue of multiple occurrence of error message
       * remove already added error class
       * TGMAR2023 Remove-ErrorClass
       * @date 10-03-2023
       * @author Tanisha Gupta
       */
      $(this).parent().find("span.errorsmall").remove();
      if (
        $(this).parent().find(".supercheckout-required").css("display") ==
          "none" &&
        $(this).val() == ""
      ) {
        $(this).removeClass("ok-form error-form");
      } else if (
        $(this).parent().find(".supercheckout-required").css("display") !=
          "none" &&
        $(this).val() == ""
      ) {
        $(this).removeClass("ok-form").addClass("error-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + required_error + "</span>");
      } else if ($(this).val() != "") {
        $(this).removeClass("error-form").addClass("ok-form");
      }
    });

    $(
      'input[name="shipping_address[phone]"], input[name="shipping_address[phone_mobile]"], input[name="payment_address[phone]"], input[name="payment_address[phone_mobile]"]',
    ).on("blur", function () {
      /**
       * Added below line to fix issue of multiple occurrence of error message
       * remove already added error class
       * TGMAR2023 Remove-ErrorClass
       * @date 10-03-2023
       * @author Tanisha Gupta
       */
      $(this).parent().find("span.errorsmall").remove();
      if (
        $(this).parent().find(".supercheckout-required").css("display") ==
          "none" &&
        $(this).val() == ""
      ) {
        $(this).removeClass("ok-form error-form");
      } else if ($(this).val() == "") {
        $(this).removeClass("ok-form").addClass("error-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + required_error + "</span>");
      } else if (!validatePhoneNumber($(this).val())) {
        $(this).removeClass("ok-form").addClass("error-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + invalid_number + "</span>");
      } else if (validatePhoneNumber($(this).val())) {
        $(this).removeClass("error-form").addClass("ok-form");
      }
    });
    $(
      'textarea[name="payment_address[other]"], textarea[name="shipping_address[other]"]',
    ).on("blur", function () {
      /**
       * Added below line to fix issue of multiple occurrence of error message
       * remove already added error class
       * TGMAR2023 Remove-ErrorClass
       * @date 10-03-2023
       * @author Tanisha Gupta
       */
      $(this).parent().find("span.errorsmall").remove();
      if (
        $(this).parent().find(".supercheckout-required").css("display") ==
          "none" &&
        $(this).val() == ""
      ) {
        $(this).removeClass("ok-form error-form");
      } else if ($(this).val() == "") {
        $(this).removeClass("ok-form").addClass("error-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + required_error + "</span>");
      } else if (!validateMessage($(this).val())) {
        $(this).removeClass("ok-form").addClass("error-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + invalid_other_info + "</span>");
      } else if (validateMessage($(this).val())) {
        $(this).removeClass("error-form").addClass("ok-form");
      }
    });
    $(".supercheckout_personal_dob > div > select").on("change", function () {
      /**
       * Added below line to fix issue of multiple occurrence of error message
       * remove already added error class
       * TGMAR2023 Remove-ErrorClass
       * @date 10-03-2023
       * @author Tanisha Gupta
       */
      $(this).parent().find("span.errorsmall").remove();
      var flag = 0;
      $(".supercheckout_personal_dob > div > select").each(function () {
        if (this.value == "") {
          $(this).addClass("dob-error-form").removeClass("dob-ok-form");
          flag = 1;
        } else {
          $(this).addClass("dob-ok-form").removeClass("dob-error-form");
        }
      });
      if (flag == 1) {
        $(".supercheckout_personal_dob > div")
          .css("width", "240px")
          .addClass("dob-div-error-form")
          .removeClass("dob-div-ok-form");
        $(".supercheckout_personal_dob").append(
          '<span class="errorsmall">' + invalid_dob + "</span>",
        );
      } else {
        $(".supercheckout_personal_dob > div")
          .css("width", "240px")
          .addClass("dob-div-ok-form")
          .removeClass("dob-div-error-form");
      }
    });

    $(
      'select[name="shipping_address[id_country]"], select[name="payment_address[id_country]"]',
    ).on("change", function () {
      /**
       * Added below line to fix issue of multiple occurrence of error message
       * remove already added error class
       * TGMAR2023 Remove-ErrorClass
       * @date 10-03-2023
       * @author Tanisha Gupta
       */
      $(this).parent().find("span.errorsmall").remove();
      var flag = 0;
      $(this).parent().find(".errorsmall").remove();
      $(this).each(function () {
        if (this.value == 0) {
          $(this).addClass("dob-error-form").removeClass("dob-ok-form");
          flag = 1;
        } else {
          $(this).addClass("dob-ok-form").removeClass("dob-error-form");
        }
      });
      if (flag == 1) {
        $(this).addClass("dob-div-error-form").removeClass("dob-div-ok-form");
        $(this)
          .parent()
          .append(
            '<span class="errorsmall">' + invalid_country_msg + "</span>",
          );
      } else {
        $(this).addClass("dob-div-ok-form").removeClass("dob-div-error-form");
      }
    });

    $(
      'select[name="shipping_address[id_state]"], select[name="payment_address[id_state]"]',
    ).on("change", function () {
      /**
       * Added below line to fix issue of multiple occurrence of error message
       * remove already added error class
       * TGMAR2023 Remove-ErrorClass
       * @date 10-03-2023
       * @author Tanisha Gupta
       */
      $(this).parent().find("span.errorsmall").remove();
      var flag = 0;
      $(this).parent().find(".errorsmall").remove();
      $(this).each(function () {
        if (this.value == 0) {
          $(this).addClass("dob-error-form").removeClass("dob-ok-form");
          flag = 1;
        } else {
          $(this).addClass("dob-ok-form").removeClass("dob-error-form");
        }
      });
      if (flag == 1) {
        $(this).addClass("dob-div-error-form").removeClass("dob-div-ok-form");
        $(this)
          .parent()
          .append('<span class="errorsmall">' + invalid_state_msg + "</span>");
      } else {
        $(this).addClass("dob-div-ok-form").removeClass("dob-div-error-form");
      }
    });
  }
}

function checkValidation() {
  flag = 0;

  $("form#velsof_supercheckout_form #checkoutShippingAddress input").each(
    function () {
      if (
        $(this).attr("name") !== undefined &&
        $(this).parent().find(".supercheckout-required").css("display") !=
          "none"
      ) {
        if (
          $(this).val() == "" &&
          $(this).attr("name").includes("shipping_address")
        ) {
          flag = 1;
        }
      }
    },
  );

  $("form#velsof_supercheckout_form #checkoutShippingAddress select").each(
    function () {
      if (
        $(this).attr("name") !== undefined &&
        $(this).parent().css("display") != "none"
      ) {
        if (
          $(this).find(":selected").val() == 0 &&
          $(this).attr("name").includes("shipping_address")
        ) {
          flag = 1;
        }
      }
    },
  );

  if (!$("input[name=use_for_invoice]").is(":checked")) {
    $("form#velsof_supercheckout_form #checkoutBillingAddress input").each(
      function () {
        if (
          $(this).attr("name") !== undefined &&
          $(this).parent().find(".supercheckout-required").css("display") !=
            "none"
        ) {
          if (
            $(this).val() == "" &&
            $(this).attr("name").includes("shipping_address")
          ) {
            flag = 1;
          }
        }
      },
    );

    $("form#velsof_supercheckout_form #checkoutBillingAddress select").each(
      function () {
        if (
          $(this).attr("name") !== undefined &&
          $(this).parent().css("display") != "none"
        ) {
          if (
            $(this).find(":selected").val() == 0 &&
            $(this).attr("name").includes("shipping_address")
          ) {
            flag = 1;
          }
        }
      },
    );
  }

  return flag;
}

/*
 * Added an check for the url whether it is defined or not
 * @author Kanishka Kannaujia
 * @date 31-01-2023
 * @commenter Prvind Panday
 */
function getURLwithTime(url) {
  if (typeof url != "undefined") {
    return (
      url + (url.indexOf("?") < 0 ? "?" : "&") + "rand=" + new Date().getTime()
    );
  }
}
// changes by rishabh jain to limit the address searching by counry selected

function restrictAutofillbyCountry(a) {
  var id_country_selected = $(a).val();
  allowed_countries = [];
  for (var country in countries) {
    if (country == id_country_selected) {
      allowed_countries.push(countries[country].iso_code);
    }
  }
  if (typeof initAutocomplete === "function") {
    initAutocomplete();
  }
}
/* chnages over */
function checkout_option(e) {
  if (typeof guest_information != "undefined") {
    $("#guest_checkout").attr("checked", "checked");
    setGuestInformation();
  }
  if (show_delivery_add_for_virtualcart != true) {
    if ($(e).val() == 0) {
      $("#supercheckout-login-box").show();
      $("#supercheckout-new-customer-form").hide();
      $("#social_login_block").show();
      $("#new_customer_password").hide();
      $("#checkoutShippingAddress").hide();
      $("#checkoutBillingAddress").hide();
      $("#supercheckout_save_address_button").hide();
      // changes by rishabh jain for google recaptcha
      if ($("#forgotpasswordlink").length) {
        if ($("#html_element_login").length) {
          $("#supercheckout-login-box").append($("#html_element_login"));
          $("#html_element_login").show();
        }
      }
      $("#profile_customers_div").hide();
      /*
       * Hide registration custom fields when Login option is selected
       * 27-02-2026
       */
      $("#registration_custom_fields_block").hide();
    } else if ($(e).val() == 1) {
      if (!$("#use_for_invoice").is(":checked")) {
        $("#checkoutBillingAddress").show();
      }
      $("#supercheckout-login-box").hide();
      $("#new_customer_password").hide();
      $("#social_login_block").hide();
      $("#supercheckout-new-customer-form").show();
      $("#checkoutShippingAddress").show();
      $("#supercheckout_save_address_button").show();
      // changes by rishabh jain for google recaptcha
      if ($("#supercheckout-new-customer-form").length) {
        if ($("#html_element_login").length) {
          $("#supercheckout-new-customer-form").append(
            $("#html_element_login"),
          );
          $("#html_element_login").show();
        }
      }
      $("#profile_customers_div").show();
      /*
       * Show registration custom fields when Guest checkout is selected
       * 27-02-2026
       */
      $("#registration_custom_fields_block").show();
    } else {
      if (!$("#use_for_invoice").is(":checked")) {
        $("#checkoutBillingAddress").show();
      }
      $("#supercheckout-login-box").hide();
      $("#new_customer_password").show();
      $("#social_login_block").show();
      $("#supercheckout-new-customer-form").show();
      $("#checkoutShippingAddress").show();
      if (typeof $(e).val() == "undefined") {
        $("#supercheckout_save_address_button").hide();
      } else {
        $("#supercheckout_save_address_button").show();
      }
      // changes by rishabh jain for google recaptcha
      if ($("#supercheckout-new-customer-form").length) {
        if ($("#html_element_login").length) {
          $("#supercheckout-new-customer-form").append(
            $("#html_element_login"),
          );
          $("#html_element_login").show();
        }
      }
      $("#profile_customers_div").show();
      /*
       * Show registration custom fields when Register checkout is selected
       * 27-02-2026
       */
      $("#registration_custom_fields_block").show();
    }
  } // because in case of virtual cart we need to hide delivery address block
  /**
   * Start Changes to fix the issue of delivery form being shown in the login tab of supercheckout in case of virtual product
   * Adding condition to check if checkout option is selected and the option is not blank
   * NASep2023 virtual_login_form
   * @date 25-09-2023
   * @modifier Nikhil Aggarwal
   */
  else if (
    show_delivery_add_for_virtualcart == true &&
    ($('input[name="checkout_option"]:checked').val() == "undefined" ||
      $('input[name="checkout_option"]:checked').val() != 0)
  ) {
    // Changes end by Nikhil
    if ($(e).val() == 0) {
      $("#supercheckout-login-box").show();
      $("#supercheckout-new-customer-form").hide();
      $("#social_login_block").show();
      $("#new_customer_password").hide();
      $("#checkoutShippingAddress").hide();
      $("#checkoutBillingAddress").hide();
      $("#supercheckout_save_address_button").hide();
      // changes by rishabh jain for google recaptcha
      if ($("#supercheckout-new-customer-form").length) {
        if ($("#html_element_login").length) {
          $("#supercheckout-new-customer-form").append(
            $("#html_element_login"),
          );
          $("#html_element_login").show();
        }
      }
      $("#profile_customers_div").hide();
    } else if ($(e).val() == 1) {
      $("#supercheckout-login-box").hide();
      $("#new_customer_password").hide();
      $("#social_login_block").hide();
      $("#supercheckout-new-customer-form").show();
      $("#checkoutShippingAddress").hide();
      $("#use_for_invoice").prop("checked", false);
      $("#checkoutBillingAddress").slideDown();
      $("#supercheckout_save_address_button").show();
      // changes by rishabh jain for google recaptcha
      if ($("#forgotpasswordlink").length) {
        if ($("#html_element_login").length) {
          $("#forgotpasswordlink").append($("#html_element_login"));
          $("#html_element_login").show();
        }
      }
      $("#profile_customers_div").show();
    } else {
      $("#supercheckout-login-box").hide();
      $("#new_customer_password").show();
      $("#social_login_block").show();
      $("#supercheckout-new-customer-form").show();
      $("#checkoutShippingAddress").hide();
      $("#use_for_invoice").prop("checked", false);
      $("#checkoutBillingAddress").slideDown();
      if (typeof $(e).val() == "undefined") {
        $("#supercheckout_save_address_button").hide();
      } else {
        $("#supercheckout_save_address_button").show();
      }
      // changes by rishabh jain for google recaptcha
      if ($("#supercheckout-new-customer-form").length) {
        if ($("#html_element_login").length) {
          $("#supercheckout-new-customer-form").append(
            $("#html_element_login"),
          );
          $("#html_element_login").show();
        }
      }
      $("#profile_customers_div").show();
    }
  }
}

function shipping_address_value(e) {
  var loadcarriers = false;
  if ($(e).val() == 0) {
    loadcarriers = true;
    $("#shipping-new").slideUp();
  } else if ($(e).val() == 1) {
    /* Code added by Anshul to show the new address form again if update form is cancelled. */
    if (!$("#checkoutShippingAddress #shipping-new").length) {
      $("#shipping-new").insertAfter(
        $("#uniform-shipping-address-new").closest(".supercheckout-extra-wrap"),
      );
      $("#shipping-new").show();
    }
    /* Code added by Anshul to show the new address form again if update form is cancelled. */
    $("#shipping-new").slideDown();
    checkDniandVatNumber("delivery");
    if (
      $('input[name="shipping_address[postcode]"]').length &&
      $('input[name="shipping_address[postcode]"]').val() != ""
    ) {
      checkZipCode(this, true);
    } else {
      loadcarriers = true;
    }
  }
  if (
    $('input[name="shipping_address_value"]:checked').val() == 0 &&
    $('input[name="payment_address_value"]:checked').val() == 0
  ) {
    $("#supercheckout_save_address_button").hide();
  } else {
    $("#supercheckout_save_address_button").show();
  }
  if (loadcarriers) {
    loadCarriers();
  }
}

function buildAddressBlock(id_address, type) {
  var html = "";
  if (
    prestashop.customer.addresses != undefined &&
    Object.keys(prestashop.customer.addresses).length
  ) {
    for (var i in prestashop.customer.addresses) {
      if (prestashop.customer.addresses[i].id == id_address) {
        html = prestashop.customer.addresses[i].formatted;
        $("#" + type + "_address_detail").html(html);
        break;
      }
    }
  }
}

function updateInvoiceAddress() {
  $('select[name="payment_address_id"] option').removeAttr("selected");
  $('select[name="payment_address_id"] option').each(function () {
    if (
      $(this).val() ==
      $('select[name="shipping_address_id"]')
        .find("option:selected")
        .attr("value")
    ) {
      $(this).prop("selected", true);
    }
  });
  buildAddressBlock(
    $('select[name="payment_address_id"] option:selected').val(),
    "invoice",
  );
  $('input[name="payment_address_value"]').removeAttr("checked");
  $('input[name="payment_address_value"]').parent().removeClass("checked");
  $('input[name="payment_address_value"]').each(function () {
    if (
      $(this).val() == $('input[name="shipping_address_value"]:checked').val()
    ) {
      $(this).prop("checked", true);
      $(this).parent().addClass("checked");
    }
  });
  if ($('input[name="payment_address_value"]:checked').val() == 0) {
    $("#payment-new").slideUp();
  }

  $('select[name="payment_address[id_country]"] option').removeAttr("selected");
  $('select[name="payment_address[id_country]"] option').each(function () {
    if (
      $(this).val() ==
      $('select[name="shipping_address[id_country]"]')
        .find("option:selected")
        .attr("value")
    ) {
      $(this).prop("selected", true);
    }
  });

  var selected_country = $('select[name="shipping_address[id_country]"]')
    .find("option:selected")
    .attr("value");
  var selected_state = 0;
  statelist(
    selected_country,
    selected_state,
    'select[name="payment_address[id_state]"]',
  );

  $('select[name="payment_address[id_state]"] option').removeAttr("selected");
  $('select[name="payment_address[id_state]"] option').each(function () {
    if (
      $(this).val() ==
      $('select[name="shipping_address[id_state]"]')
        .find("option:selected")
        .attr("value")
    ) {
      $(this).prop("selected", true);
    }
  });
}
// changes by rishabh jain
function updateKbGiftMessage() {
  $("#kb_gift_msg_error").hide();
  $("#kb_gift_receiver_error").hide();
  $("#kb_gift_sender_error").hide();
  var msg_sender = $.trim($("#supercheckout_gift_sender").val());
  var msg_reciever = $.trim($("#supercheckout_gift_receiver").val());
  var gift_message = $.trim($("#supercheckout_gift_message").val());
  if (msg_sender != "" && msg_reciever != "" && gift_message != "") {
    $.ajax({
      type: "POST",
      headers: {
        "cache-control": "no-cache",
      },
      url: getURLwithTime($("#module_url").val()),
      async: true,
      cache: false,
      dataType: "json",
      data:
        "ajax=true" +
        "&msg_sender=" +
        msg_sender +
        "&msg_receiver=" +
        msg_reciever +
        "&kb_gift_msg=" +
        gift_message +
        "&method=updateGiftCardMessage&token=" +
        prestashop.static_token,
      beforeSend: function () {
        $(".kb_velsof_sc_overlay").show();
        $(".pay-loader").show();
        $("#kb_gift_message_submit").attr("disabled", true);
      },
      complete: function () {
        $(".kb_velsof_sc_overlay").hide();
        $(".pay-loader").hide();
        /**
         * Start Changes to fix the issue with the dialog() because of jQuery
         * Commenting out $.gritter.add and adding code of #popup1
         * NANov2023 dialog_jquery
         * @date 20-11-2023
         * @modifier Nikhil Aggarwal
         */
        // $("#divKbgiftMessage").dialog('close');
        $("#popup1").css("visibility", "hidden");
        $("#popup1").css("opacity", "0");
        $("#kb_gift_message_submit").attr("disabled", false);
        $("#kb_gift_message_submit").val(update_text);
      },
      success: function (jsonData) {
        $("#gift_message_update_warning").html("");
        // $.gritter.add({
        //     title: notification_title,
        //     text: jsonData['message'],
        //     class_name: 'gritter-success',
        //     sticky: false,
        //     time: '3000'
        // });
      },
      // Changes end by Nikhil
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
        $("#gift_message_update_warning").html(
          '<div class="permanent-warning">' + "issues" + "</div>",
        );
      },
    });
  } else {
    if (msg_sender == "") {
      $("#kb_gift_sender_error").show();
    }
    if (msg_reciever == "") {
      $("#kb_gift_receiver_error").show();
    }
    if (gift_message == "") {
      $("#kb_gift_msg_error").show();
    }

    $.gritter.add({
      title: notification_title,
      text: kb_input_error_msg,
      class_name: "gritter-warning",
      sticky: false,
      time: "3000",
    });
  }
}
// chnages over
function setGuestInformation() {
  $('input[name="supercheckout_email"]').val(guest_information["email"]);
  $('input[name="shipping_address[firstname]"]').val(
    guest_information["firstname"],
  );
  $('input[name="shipping_address[lastname]"]').val(
    guest_information["lastname"],
  );
  $('input[name="payment_address[firstname]"]').val(
    guest_information["invoice_firstname"],
  );
  $('input[name="payment_address[lastname]"]').val(
    guest_information["invoice_lastname"],
  );
  $('input[name="shipping_address[address1]"]').val(
    guest_information["address1"],
  );
  $('input[name="payment_address[address1]"]').val(
    guest_information["invoice_address1"],
  );
  $('input[name="shipping_address[address2]"]').val(
    guest_information["address2"],
  );
  $('input[name="payment_address[address2]"]').val(
    guest_information["invoice_address2"],
  );
  $('input[name="shipping_address[city]"]').val(guest_information["city"]);
  $('input[name="payment_address[city]"]').val(
    guest_information["invoice_city"],
  );
  $('input[name="payment_address[alias]"]').val(guest_information["alias"]);
  $('input[name="shipping_address[alias]"]').val(
    guest_information["invoice_alias"],
  );
  $('input[name="shipping_address[company]"]').val(
    guest_information["company"],
  );
  $('input[name="payment_address[company]"]').val(
    guest_information["invoice_company"],
  );
  $('input[name="shipping_address[phone]"]').val(guest_information["phone"]);
  $('input[name="shipping_address[phone_mobile]"]').val(
    guest_information["phone_mobile"],
  );
  $('input[name="payment_address[phone]"]').val(
    guest_information["invoice_phone"],
  );
  $('input[name="payment_address[phone_mobile]"]').val(
    guest_information["invoice_phone_mobile"],
  );
  $('input[name="payment_address[dni]"]').val(guest_information["invoice_dni"]);
  $('input[name="shipping_address[dni]"]').val(guest_information["dni"]);
  $('input[name="shipping_address[vat_number]"]').val(
    guest_information["vat_number"],
  );
  $('input[name="payment_address[vat_number]"]').val(
    guest_information["invoice_vat_number"],
  );
  $('input[name="shipping_address[postcode]"]').val(
    guest_information["postcode"],
  );
  $('input[name="payment_address[postcode]"]').val(
    guest_information["invoice_postcode"],
  );
  $('input[name="customer_personal[newsletter]"]').val(
    guest_information["newsletter"],
  );
  $('select[name="customer_personal[dob_days]"]').val(
    parseInt(guest_information["sl_day"]),
  );
  $('select[name="customer_personal[dob_months]"]').val(
    parseInt(guest_information["sl_month"]),
  );
  $('select[name="customer_personal[dob_years]"]').val(
    parseInt(guest_information["sl_year"]),
  );
  $('select[name="shipping_address[id_country]"]').val(
    parseInt(guest_information["id_country"]),
  );
  $('select[name="payment_address[id_country]"]').val(
    parseInt(guest_information["invoice_id_country"]),
  );
  $('select[name="shipping_address[id_state]"]').val(
    guest_information["id_state"],
  );
  $('select[name="payment_address[id_state]"]').val(
    guest_information["invoice_id_state"],
  );
  $(
    'input[name="payment_address[other]"], input[name="payment_address[other]"]',
  ).val(guest_information["invoice_other"]);
  $(
    'input[name="shipping_address[other]"], textarea[name="shipping_address[other]"]',
  ).val(guest_information["other"]);
  if (guest_information["id_gender"] == "1") {
    $("#customer_gender_1").attr("checked", "checked");
    $("#customer_gender_2").removeAttr("checked");
    $("#customer_gender_1").parent("span").addClass("checked");
    $("#customer_gender_2").parent("span").removeClass("checked");
  } else {
    $("#customer_gender_2").attr("checked", "checked");
    $("#customer_gender_1").removeAttr("checked");
    $("#customer_gender_2").parent("span").addClass("checked");
    $("#customer_gender_1").parent("span").removeClass("checked");
  }
  if (guest_information["newsletter"] == "1") {
    $("#customer_personal_newsletter").attr("checked", "checked");
    $("#customer_personal_newsletter").parent("span").addClass("checked");
  }
}

function statelist(selected_country, selected_state, element) {
  var state_html = "";
  var has_states = false;
  var show_state = false;
  for (var id_country in countries) {
    if (id_country == selected_country) {
      if (countries[id_country]["contains_states"] == 1) {
        has_states = true;
        state_html += '<option value="0">--</option>';
        for (var i in countries[id_country]["states"]) {
          if (
            countries[id_country]["states"][i]["id_state"] == selected_state
          ) {
            state_html +=
              '<option id="' +
              countries[id_country]["states"][i]["iso_code"] +
              '" value="' +
              countries[id_country]["states"][i]["id_state"] +
              '" selected="selected" >' +
              countries[id_country]["states"][i]["name"] +
              "</option>";
          } else {
            state_html +=
              '<option id="' +
              countries[id_country]["states"][i]["iso_code"] +
              '" value="' +
              countries[id_country]["states"][i]["id_state"] +
              '">' +
              countries[id_country]["states"][i]["name"] +
              "</option>";
          }
        }
      }
    }
  }
  if (element.indexOf("shipping") >= 0) {
    if (typeof show_shipping_state != "undefined") {
      if (show_shipping_state == 1) {
        show_state = true;
      }
    }
    /**
     * Start Changes to fix the issue of show_payment_state not defined
     * In else if condition we check that show_payment_state == 1 before checking that show_payment_state is defined or not
     * So, removing  && show_payment_state == 1 from the else if condition
     * NASep2023 show_payment_state
     * @date 26-09-2023
     * @modifier Nikhil Aggarwal
     */
  } else if (element.indexOf("payment") >= 0) {
    // Changes end by Nikhil
    if (typeof show_payment_state != "undefined") {
      if (show_payment_state == 1) {
        show_state = true;
      }
    }
  }

  if (has_states && show_state) {
    $(element).html(state_html);
    $(element).parent().show();
  } else if (!has_states && show_state) {
    $(element).html(state_html);
    $(element).parent().hide();
  } else if (!has_states && !show_state) {
    $(element).parent().hide();
    $('select[name="shipping_address[id_country]"]')
      .closest(".col-sm-6")
      .removeClass(".col-sm-6")
      .addClass("col-sm-12"); //added by Anshul Mittal
  }
}

function set_column_inside_height() {
  var col_1_inside = $("#column-1-inside .supercheckout-blocks").height();
  var col_2_inside = $("#column-2-inside .supercheckout-blocks").height();

  if (col_1_inside > col_2_inside) {
    $("#column-2-inside").css("height", $("#column-1-inside").height() + "px");
    $("#column-1-inside").css("height", "auto");
  } else if (col_1_inside < col_2_inside) {
    $("#column-1-inside").css("height", $("#column-2-inside").height() + "px");
    $("#column-2-inside").css("height", "auto");
  }
}

var shipping_error_found_on_load = false;
// changes done by kanishka to avoid loader when new address is creating
function loadCarriers(is_address_field_changed = false) {
  var requestParam = getCounrtryAndIdDelivery();
  var id_country = requestParam[0];
  var id_state = 0;
  if (
    checkStateVisibility(
      id_country,
      'select[name="shipping_address[id_state]"]',
    )
  ) {
    id_state = $('select[name="shipping_address[id_state]"]').val();
  }
  var postcode = $('input[name="shipping_address[postcode]"]').val();
  var id_address_delivery = requestParam[1];
  var vat_code = "";

  if (
    $('input[name="shipping_address[vat_number]"]').val() != "undefined" &&
    $('input[name="shipping_address[vat_number]"]').val() != "" &&
    $('input[name="shipping_address[vat_number]"]').val() != null
  ) {
    vat_code = $('input[name="shipping_address[vat_number]"]').val();
  }
  shipping_error_found_on_load = false;
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: getURLwithTime($("#module_url").val()),
    async: true,
    cache: false,
    dataType: "json",
    data:
      "ajax=true" +
      "&id_country=" +
      id_country +
      "&id_state=" +
      id_state +
      "&postcode=" +
      postcode +
      "&vat_number=" +
      vat_code +
      "&id_address_delivery=" +
      id_address_delivery +
      "&method=loadCarriers&token=" +
      prestashop.static_token,
    beforeSend: function () {
      // changes done by kanishka to avoid loader when new address is creating
      if (!is_address_field_changed) {
        $(".kb_velsof_sc_overlay").show();
        $(".pay-loader").show();
        $("#shippingMethodLoader").show();
      }
      // changes done by kanishka to avoid loader when new address is creating
      $("#shipping_method_update_warning .permanent-warning").remove();
    },
    success: function (jsonData) {
      if (jsonData["hasError"]) {
        $("#shipping-method").html("");
        $("#shipping_method_update_warning").html(
          '<div class="permanent-warning">' +
            jsonData["shipping_error"][0] +
            "</div>",
        );
      } else {
        $("#shipping-method").html(jsonData["html"]);
      }
      $(".delivery_option_radio:checked").closest("li").addClass("alert-info");
      set_column_inside_height();
      //loadCart();
      /* Start Code Added By Priyanshu on 11-Feb-2021 for the packetery ( Zasilkovna ) compatibility */
      if (typeof onShippingLoadedCallback !== "undefined") {
        onShippingLoadedCallback();
      }
      /* End Code Added By Priyanshu on 11-Feb-2021 for the packetery ( Zasilkovna ) compatibility */
      // changes done by kanishka to avoid loader when new address is creating
      if (!is_address_field_changed) {
        updateCarrierOnDeliveryChange();
      } else {
        updateCarrierOnDeliveryChange(true);
      }
      // changes done by kanishka to avoid loader when new address is creating
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      $("#shipping_method_update_warning").html(
        '<div class="permanent-warning">' + errors + "</div>",
      );
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
  });
}

/**
 * Start Changes to fix the issue of Order Comment not being saved
 * Below function is used to send an Ajax to OPC front controller to update the Order Comment
 * @date 04-03-2025
 * NAMar2025 order_comment
 * @modifier Nikhil Aggarwal
 */
function kbupdateOrderComment() {
  var order_comment = $("#supercheckout-comment_order").val();
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: getURLwithTime($("#module_url").val()),
    async: true,
    cache: false,
    dataType: "json",
    data:
      "ajax=true" +
      "&kborder_comment=" +
      order_comment +
      "&method=updateKBOrderComment&token=" +
      prestashop.static_token,
    success: function (jsonData) {
      if (jsonData["hasError"]) {
      } else {
      }
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      $("#order_comment_update_warning").html(
        '<div class="permanent-warning">' + errors + "</div>",
      );
    },
  });
}
// Changes end by Nikhil

// changes done by kanishka to avoid loader when new address is creating
function updateCarrierOnDeliveryChange(is_address_field_changed = false) {
  var delivery_option = $(".supercheckout_shipping_option").length
    ? "&" +
      $(".supercheckout_shipping_option:checked").attr("name") +
      "=" +
      $(".supercheckout_shipping_option:checked").attr("value")
    : "";
  var delivery_available = $(".supercheckout_shipping_option").length;

  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: getURLwithTime($("#module_url").val()),
    async: true,
    cache: false,
    dataType: "json",
    data:
      "ajax=true&delivery_available=" +
      delivery_available +
      delivery_option +
      "&method=updateCarrier&token=" +
      prestashop.static_token,
    beforeSend: function () {
      $("#shipping_method_update_warning .permanent-warning").remove();
    },
    success: function (jsonData) {
      if (jsonData["hasError"]) {
        if ($("#shipping-method .not-required-msg").length) {
        } else {
          $("#shipping_method_update_warning").html(
            '<div class="permanent-warning">' +
              jsonData["errors"][0] +
              "</div>",
          );
        }
        loadCart();
      } else {
        /*
         * Checked whether the function is defined or not with undefined condition
         * @date 31-01-2023
         * @commenter Prvind Panday
         */
        if (
          typeof kbstorelocatorpopup == "function" &&
          typeof kbstorelocatorpopup != "undefined"
        ) {
          kbstorelocatorpopup();
        }
        //Start:Changes done by Anshul Mittal on 09/01/2020 for updating shipping data (Feature: Checkout Behavior (Jan 2020))
        if ($(".delivery_option_radio:checked").val() != "") {
          updateCheckoutBehaviour("shipping_method", true);
        } else {
          updateCheckoutBehaviour("shipping_method", false);
        }
        //End:Changes done by Anshul Mittal on 09/01/2020 or updating shipping data (Feature: Checkout Behavior (Jan 2020))
        /*Start Code Added By Priyanshu on 11-Feb-2021 to fix the issue of Extra Content not displaying for delivery Methods*/
        var delivery_method_class = $(
          ".supercheckout_shipping_option:checked",
        ).attr("id");
        $(".kbshippingparceloption").each(function () {
          if ($(this).hasClass(delivery_method_class)) {
            $(this).show();
          } else {
            $(this).hide();
          }
        });
        /*End Code Added By Priyanshu on 11-Feb-2021 to fix the issue of Extra Content not displaying for delivery Methods*/
        // Start: Added by KanishKa for making it compatible with DHL
        if (typeof kbdhlassistantPop !== "undefined") {
          kbdhlassistantPop();
        }
        if (typeof kbdhlassistantPopCod !== "undefined") {
          kbdhlassistantPopCod();
        }
        // Start: Added by KanishKa for making it compatible with DHL
        // changes done by kanishka to avoid loader when new address is creating
        if (!is_address_field_changed) {
          loadCart();
        } else {
          loadCart(true);
        }
        // changes done by kanishka to avoid loader when new address is creating
      }
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      $("#shipping_method_update_warning").html(
        '<div class="permanent-warning">' + errors + "</div>",
      );
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
  });
}

$("#velsof_supercheckout_form").bind("keypress", function (e) {
  if (e.keyCode == 13) {
    return false; // ignore the default event
  }
});

function isPressedEnter(evt) {}

function updateDeliveryExtraChange() {
  var messagePattern = /[<>{}]/i;
  var gift_message = "";
  var extrasError = false;
  if ($("#gift").length && $("#gift").is(":checked")) {
    gift_message = $("#gift_message").val();
    if (messagePattern.test(gift_message)) {
      extrasError = true;
      $("#gift_message")
        .parent()
        .append('<span class="errorsmall">' + commentInvalid + "</span>");
    }
  }

  if (!extrasError) {
    var recycle =
      $("#recyclable").length && $("#recyclable").is(":checked") ? 1 : 0;
    var gift = $("#gift").length && $("#gift").is(":checked") ? 1 : 0;
    gift_message = $("#gift_message").val();
    $.ajax({
      type: "POST",
      headers: {
        "cache-control": "no-cache",
      },
      url: getURLwithTime($("#module_url").val()),
      async: true,
      cache: false,
      dataType: "json",
      data:
        "ajax=true" +
        "&recycle=" +
        recycle +
        "&gift=" +
        gift +
        "&gift_message=" +
        gift_message +
        "&method=updateDeliveryExtra&token=" +
        prestashop.static_token,
      success: function (jsonData) {
        if (jsonData["hasError"]) {
          var arr = jsonData["errors"];
          $("#supercheckout-empty-page-content").html(
            '<div class="permanent-warning">' + arr.join("<br>") + "</div>",
          );
          $("html, body").animate(
            {
              scrollTop: 0,
            },
            "fast",
          );
          return false;
        }
        loadCart();
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
        displayGeneralError(errors);
        $(".kb_velsof_sc_overlay").hide();
        $(".pay-loader").hide();
      },
    });
  }
}
// changes done by kanishka to avoid loader when new address is creating
function loadCart(is_address_field_changed = false) {
  if (
    document.getElementsByClassName("opc_shoppingcart")[0].offsetWidth >= 990
  ) {
    $(".opc_shoppingcart").eq(0).removeClass("smallViewSection");
    $(".opc_shoppingcart").eq(0).removeClass("largeSectionView");
    $(".opc_shoppingcart").eq(0).addClass("largeSectionView");
  } else {
    $(".opc_shoppingcart").eq(0).removeClass("smallViewSection");
    $(".opc_shoppingcart").eq(0).removeClass("largeSectionView");
    $(".opc_shoppingcart").eq(0).addClass("smallViewSection");
  }

  // Changes done by Kanishka Kannoujia to fetch id_country and id_address_delivery, to display free shipping banner according to the country
  var requestParam = getCounrtryAndIdDelivery();
  var id_country = requestParam[0];
  var id_address_delivery = requestParam[1];
  console.log(id_country);
  // Changes done by Kanishka Kannoujia to fetch id_country and id_address_delivery, to display free shipping banner according to the country
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: getURLwithTime($("#module_url").val()),
    async: true,
    cache: false,
    dataType: "json",
    //data: 'ajax=true' + '&method=loadCart&token=' + prestashop.static_token,
    data:
      "ajax=true" +
      "&method=loadCart&shippingId=" +
      $(".delivery_option_radio:checked").val() +
      "&id_country=" +
      id_country +
      "&id_address_delivery=" +
      id_address_delivery +
      "&token=" +
      prestashop.static_token,
    beforeSend: function () {
      $("#cart_update_warning .permanent-warning").remove();
      // changes done by kanishka to avoid loader when new address is creating
      if (!is_address_field_changed) {
        $(".kb_velsof_sc_overlay").show();
        $(".pay-loader").show();
        $("#confirmLoader").show();
      }
      // changes done by kanishka to avoid loader when new address is creating
    },
    success: function (jsonData) {
      if (jsonData["redirect"] == true) {
        location.reload();
      } else {
        $(".kb_velsof_sc_overlay").hide();
        $(".pay-loader").hide();
        $("#confirmLoader").hide();
        $("#complete_cart_summary").html(jsonData["html"]);
        if (update_qty_button == 1) {
          //quantitty change on blur
          $("#confirmCheckout").on("blur", ".quantitybox", function () {
            var element = $(this).attr("name");
            var hidden_qty = parseInt(
              $("#confirmCheckout input[name=" + element + "_hidden]").val(),
            );
            var user_qty = parseInt(
              $("#confirmCheckout  input[name=" + element + "]").val(),
            );
            if (isNaN(user_qty) || Number(user_qty) < 0) {
              $("#cart_update_warning .permanent-warning").remove();
              $("#cart_update_warning").html(
                '<div class="permanent-warning">' + nanvalidqty + "</div>",
              );
              return;
            }
            // chnages by rishabh jain for min quantity
            var min_qty = parseInt(
              $("#confirmCheckout input[name=" + element + "_minqty]").val(),
            );
            if (min_qty > 1 && user_qty < min_qty) {
              var id = $(this).attr("name").replace("quantity_", "");
              deleteProductFromCart(id);
            }
            user_qty = parseInt(user_qty);
            $("#confirmCheckout  input[name=" + element + "]").val(user_qty);
            // changes over
            if (hidden_qty > user_qty) {
              updateQty(element, "down", hidden_qty - user_qty, false);
            } else if (hidden_qty < user_qty) {
              updateQty(element, "up", user_qty - hidden_qty, false);
            } else {
              $("#cart_update_warning").html(
                '<div class="permanent-warning">' + updateSameQty + "</div>",
              );
            }
          });
        }
        // changes done by kanishka to avoid loader when new address is creating
        if (!is_address_field_changed) {
          loadPayments();
        } else {
          loadPayments(true);
        }
        // changes done by kanishka to avoid loader when new address is creating
      }
      checkCustomFieldBlocks();

      // Start: Added by Anshul
      $(".kbfiletype").addClass("form-control");
      if ($(".kb_sc_custom_field_date").length) {
        $(".kb_sc_custom_field_date").datepicker({ dateFormat: "yy-mm-dd" });
      }
      // End: Added by Anshul
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      $("#cart_update_warning").html(
        '<div class="permanent-warning">' + errors + "</div>",
      );
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
  });
  if (typeof KbSupercheckoutPC !== "undefined") {
    KbSupercheckoutPC();
  }
}

function checkDniandVatNumber(type) {
  var id_country = $(
    'select[name="shipping_address[id_country]"] option:selected',
  ).val();
  if (type == "invoice") {
    id_country = $(
      'select[name="payment_address[id_country]"] option:selected',
    ).val();
  }
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: getURLwithTime($("#module_url").val()),
    async: true,
    cache: false,
    dataType: "json",
    data:
      "ajax=true" +
      "&method=checkDniandVat" +
      "&id_country=" +
      id_country +
      "&token=" +
      prestashop.static_token,
    beforeSend: function () {
      hideGeneralError();
    },
    complete: function () {},
    success: function (jsonData) {
      if (type == "delivery") {
        /* Start - Code Added by Raghu on 22-Aug-2017 for fixing 'VAT Number Hiding on Country Change' issue */
        //                if (jsonData['is_need_vat']) {
        //                    $('input[name="shipping_address[vat_number]"]').parent().find('.supercheckout-required').show();
        //                } else {
        //                    $('input[name="shipping_address[vat_number]"]').attr('value', '');
        //                    $('input[name="shipping_address[vat_number]"]').parent().find('.supercheckout-required').hide();
        //                }
        /* End - Code Added by Raghu on 22-Aug-2017 for fixing 'VAT Number Hiding on Country Change' issue */
        if (jsonData["is_need_states"]) {
          if (typeof show_payment_state != "undefined") {
            if (show_payment_state == 1) {
              //$('select[name="shipping_address[id_state]"]').parent().parent().show();
              $('select[name="shipping_address[id_state]"]').parent().show();
            }
          }
        } else {
          //                    $('select[name="shipping_address[id_state]"]').removeAttr('selected');
          //$('select[name="shipping_address[id_state]"]').parent().parent().hide();
          //                    $('select[name="shipping_address[id_state]"]').parent().hide();
        }
        if (jsonData["is_need_zip_code"] != 0 && show_shipping_postcode == 1) {
          $('input[name="shipping_address[postcode]"]')
            .parent()
            .parent()
            .show();
        } else {
          $('input[name="shipping_address[postcode]"]').attr("value", "");
          $('input[name="shipping_address[postcode]"]')
            .parent()
            .parent()
            .hide();
        }
      }
      if (type == "invoice") {
        if (jsonData["is_applicable"]) {
          $('input[name="payment_address[vat_number]"]')
            .parent()
            .find(".supercheckout-required")
            .show();
        } else {
          $('input[name="payment_address[vat_number]"]').attr("value", "");
          $('input[name="payment_address[vat_number]"]')
            .parent()
            .find(".supercheckout-required")
            .hide();
        }
        /**
         * Start Changes to fix the issue of show_payment_state not defined
         * We check that show_payment_state == 1 before checking that show_payment_state is defined or not
         * So, adding condition of checking that show_payment_state is not undefined before checking show_payment_state == 1
         * NASep2023 show_payment_state
         * @date 26-09-2023
         * @modifier Nikhil Aggarwal
         */
        if (
          jsonData["is_need_states"] &&
          typeof show_payment_state != "undefined" &&
          show_payment_state == 1
        ) {
          //$('select[name="payment_address[id_state]"]').parent().parent().show();
          $('select[name="payment_address[id_state]"]').parent().show();
        } else {
          $('select[name="payment_address[id_state]"]').removeAttr("selected");
          //$('select[name="payment_address[id_state]"]').parent().parent().hide();
          $('select[name="payment_address[id_state]"]').parent().hide();
        }
        if (jsonData["is_need_zip_code"] != 0 && show_payment_postcode == 1) {
          $('input[name="payment_address[postcode]"]').parent().parent().show();
        } else {
          $('input[name="payment_address[postcode]"]').attr("value", "");
          $('input[name="payment_address[postcode]"]').parent().parent().hide();
        }
      }
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      $(
        "#checkoutShippingAddress .supercheckout-checkout-content .permanent-warning",
      ).html(errors);
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
  });
}

function isValidVatNumber(type) {
  var id_country = $(
    'select[name="shipping_address[id_country]"] option:selected',
  ).val();
  var vat_number = $('input[name="shipping_address[vat_number]"]').val();
  if (type == "invoice") {
    id_country = $(
      'select[name="payment_address[id_country]"] option:selected',
    ).val();
    vat_number = $('input[name="payment_address[vat_number]"]').val();
  }
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: getURLwithTime($("#module_url").val()),
    async: true,
    cache: false,
    dataType: "json",
    data:
      "ajax=true" +
      "&method=isValidVatNumber" +
      "&id_country=" +
      id_country +
      "&vat_number=" +
      vat_number +
      "&token=" +
      prestashop.static_token,
    beforeSend: function () {
      hideGeneralError();
      if (inline_validation == 1) {
        if (type == "delivery") {
          $('input[name="shipping_address[vat_number]"]').removeClass(
            "ok-form error-form",
          );
        }
        if (type == "invoice") {
          $('input[name="payment_address[vat_number]"]').removeClass(
            "ok-form error-form",
          );
        }
      }
    },
    complete: function () {},
    success: function (jsonData) {
      if (jsonData["error"] != undefined) {
        var errors = jsonData["error"].join("<br>");
        if (type == "delivery") {
          $('input[name="shipping_address[vat_number]"]')
            .parent()
            .append('<span class="errorsmall">' + errors + "</span>");
          if (inline_validation == 1)
            $('input[name="shipping_address[vat_number]"]').addClass(
              "error-form",
            );
        }
        if (type == "invoice") {
          $('input[name="payment_address[vat_number]"]')
            .parent()
            .append('<span class="errorsmall">' + errors + "</span>");
          if (inline_validation == 1)
            $('input[name="payment_address[vat_number]"]').addClass(
              "error-form",
            );
        }
      } else {
        loadCarriers();
        if (inline_validation == 1) {
          if (type == "delivery") {
            if (
              $('input[name="shipping_address[vat_number]"]')
                .parent()
                .find(".supercheckout-required")
                .css("display") == "none" &&
              $('input[name="shipping_address[vat_number]"]').val() == ""
            ) {
              $('input[name="shipping_address[vat_number]"]').removeClass(
                "ok-form error-form",
              );
            } else {
              $('input[name="shipping_address[vat_number]"]').addClass(
                "ok-form",
              );
            }
          }
          if (type == "invoice") {
            if (
              $('input[name="payment_address[vat_number]"]')
                .parent()
                .find(".supercheckout-required")
                .css("display") == "none" &&
              $('input[name="payment_address[vat_number]"]').val() == ""
            ) {
              $('input[name="payment_address[vat_number]"]').removeClass(
                "ok-form error-form",
              );
            } else {
              $('input[name="payment_address[vat_number]"]').addClass(
                "ok-form",
              );
            }
          }
        }
      }
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      displayGeneralError(errors);
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
  });
}

function checkZipCode(e, isCarrierLoad) {
  var checkZip = false;
  var address_type = $(e).attr("name").split("[");
  address_type = address_type[0];
  var container = "checkoutShippingAddress";
  if (address_type == "payment_address") {
    container = "checkoutBillingAddress";
  }

  if (
    $("#" + container + ' input[name="' + address_type + '[postcode]"]').length
  ) {
    checkZip = true;
  }
  if (checkZip) {
    var checkData = {
      ajax: true,
      method: "checkZipCode",
      id_country:
        $('select[name="' + address_type + '[id_country]"]').length > 0
          ? $(
              'select[name="' + address_type + '[id_country]"] option:selected',
            ).val()
          : "",
      postcode:
        $('input[name="' + address_type + '[postcode]"]').length > 0
          ? $('input[name="' + address_type + '[postcode]"]').val()
          : "",
    };
    $.ajax({
      type: "POST",
      headers: {
        "cache-control": "no-cache",
      },
      url: getURLwithTime($("#module_url").val()),
      async: true,
      cache: false,
      dataType: "json",
      data: checkData,
      beforeSend: function () {
        $("#" + container + ' input[name="' + address_type + '[postcode]"]')
          .parent()
          .find("span.errorsmall")
          .remove();
        if (inline_validation == 1) {
          $(
            "#" + container + ' input[name="' + address_type + '[postcode]"]',
          ).removeClass("error-form");
          $(
            "#" + container + ' input[name="' + address_type + '[postcode]"]',
          ).removeClass("ok-form");
        }
      },
      complete: function () {},
      success: function (jsonData) {
        if (jsonData["error"] != undefined) {
          $("#" + container + ' input[name="' + address_type + '[postcode]"]')
            .parent()
            .append(
              '<span class="errorsmall">' + jsonData["error"] + "</span>",
            );
          if (inline_validation == 1)
            $(
              "#" + container + ' input[name="' + address_type + '[postcode]"]',
            ).addClass("error-form");
        } else {
          if (inline_validation == 1)
            $(
              "#" + container + ' input[name="' + address_type + '[postcode]"]',
            ).addClass("ok-form");
        }
        if (isCarrierLoad) {
          loadCarriers(true);
        }
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
        $("#" + container + " .supercheckout-checkout-content").html(
          '<div class="permanent-warning">' + errors + "</div>",
        );
        $(".kb_velsof_sc_overlay").hide();
        $(".pay-loader").hide();
      },
    });
  }
}

function updateInvoiceStatus(element) {
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: getURLwithTime($("#module_url").val()),
    async: true,
    cache: false,
    dataType: "json",
    data:
      "ajax=true" +
      "&method=setSameInvoice" +
      "&use_for_invoice=" +
      ($(element).is(":checked") ? "1" : "0") +
      "&token=" +
      prestashop.static_token,
    beforeSend: function () {
      $(".input-different-shipping").parent().find(".errorsmall").remove();
    },
    complete: function () {},
    success: function (jsonData) {
      //_loadInvoiceAddress();
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      $(".input-different-shipping")
        .parent()
        .append('<div class="errorsmall">' + errors + "</div>");
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
  });
}

function _loadInvoiceAddress() {
  var id_country = 0;
  var id_address_invoice = 0;
  if ($('input[name="payment_address_value"]').length) {
    if ($('input[name="payment_address_value"]:checked').val() == 1) {
      id_country = $(
        'select[name="payment_address[id_country]"] option:selected',
      ).val();
    } else if ($('input[name="payment_address_value"]:checked').val() == 0) {
      id_address_invoice = $(
        'select[name="payment_address_id"] option:selected',
      ).val();
    }
  } else {
    id_country = $(
      'select[name="payment_address[id_country]"] option:selected',
    ).val();
  }
  var id_state = $('select[name="payment_address[id_state]"]').val();
  var postcode = $('input[name="payment_address[postcode]"]').val();
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: getURLwithTime($("#module_url").val()),
    async: true,
    cache: false,
    dataType: "json",
    data:
      "ajax=true" +
      "&method=loadInvoiceAddress" +
      "&id_country=" +
      id_country +
      "&id_state=" +
      id_state +
      "&postcode=" +
      postcode +
      "&id_address_invoice=" +
      id_address_invoice +
      "&token=" +
      prestashop.static_token,
    beforeSend: function () {
      hideGeneralError();
    },
    complete: function () {},
    success: function (jsonData) {},
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      displayGeneralError(errors);
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
  });
}

function callCoupon() {
  /**
   * Start Changes to fix the issue of wrong ajax url being created
   * Checking in the url that if it already contains & or not
   * NAMar2025 ajax_url
   * @date 04-03-2025
   * @modifier Nikhil Aggarwal
   */
  let kbajaxurl = getURLwithTime($("#module_url").val());
  kbajaxurl += (kbajaxurl.indexOf("?") !== -1 ? "&" : "?") + "ajax=true";
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: kbajaxurl,
    async: true,
    cache: false,
    data: $("#voucher-form input"),
    dataType: "json",
    beforeSend: function () {
      $("#cart_update_warning .permanent-warning").remove();
      $(".kb_velsof_sc_overlay").show();
      $(".pay-loader").show();
      $("#confirmLoader").show();
    },
    complete: function () {
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
      $("#confirmLoader").hide();
    },
    success: function (json) {
      if (json["refresh"] != undefined) location.reload();
      if (json["success"] != undefined) {
        $.gritter.add({
          title: notification,
          text: json["success"],
          //	image: '',
          class_name: "gritter-success",
          sticky: false,
          time: "3000",
        });
        $("#discount_name").attr("value", "");
        loadCarriers();
      } else if (json["error"] != undefined) {
        $("#cart_update_warning").html(
          '<div class="permanent-warning">' + json["error"] + "</div>",
        );
        $("html, body").animate(
          { scrollTop: $("#cart_update_warning").offset().top },
          "fast",
        );
      }
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var error = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      $("#cart_update_warning").html(
        '<div class="permanent-warning">' + error + "</div>",
      );
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
  });
}

function removeDiscount(id_cart_rule) {
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: getURLwithTime($("#module_url").val()),
    async: true,
    cache: false,
    data: "&ajax=true&deleteDiscount=" + id_cart_rule,
    dataType: "json",
    beforeSend: function () {
      $("#cart_update_warning .permanent-warning").remove();
      $(".kb_velsof_sc_overlay").show();
      $(".pay-loader").show();
      $("#confirmLoader").show();
    },
    complete: function () {
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
      $("#confirmLoader").hide();
    },
    success: function (json) {
      if (json["success"] != undefined) {
        $.gritter.add({
          title: notification,
          text: json["success"],
          //	image: '',
          class_name: "gritter-success",
          sticky: false,
          time: "3000",
        });
        $("#discount_name").attr("value", "");
        loadCarriers();
      } else if (json["error"] != undefined) {
        $("#cart_update_warning").html(
          '<div class="permanent-warning">' + json["error"] + "</div>",
        );
      }
      $("#highlighted_cart_rules").html(json["cart_rule"]);
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var error = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      $("#cart_update_warning").html(
        '<div class="permanent-warning">' + error + "</div>",
      );
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
  });
}

function upQty(element) {
  // chnages by rishabh jain for min quantity
  //    var min_qty = parseInt($('#confirmCheckout input[name=' + element + '_minqty]').val());
  updateQty(element, "up", 1, true);
}

function downQty(element) {
  var hidden = parseInt(
    $("#confirmCheckout input[name=" + element + "_hidden]").val(),
  );
  // chnages by rishabh jain for min quantity
  var user_qty = hidden - 1;
  var min_qty = parseInt(
    $("#confirmCheckout input[name=" + element + "_minqty]").val(),
  );
  if (min_qty > 1 && user_qty < min_qty) {
    var id = element.replace("quantity_", "");
    deleteProductFromCart(id);
  }

  if (hidden == 1) {
    var id = element.replace("quantity_", "");
    deleteProductFromCart(id);
  } else {
    updateQty(element, "down", hidden - user_qty, true);
  }
}

function updateQtyByBtn(element) {
  $("#cart_update_warning .permanent-warning").remove();
  var exp = new RegExp("^[0-9]+$");
  var hidden = $("#confirmCheckout input[name=" + element + "_hidden]").val();
  var input = $("#confirmCheckout  input[name=" + element + "]").val();

  if (exp.test(input) == true) {
    // // chnages by rishabh jain for min quantity
    var min_qty = parseInt(
      $("#confirmCheckout input[name=" + element + "_minqty]").val(),
    );
    if (min_qty > 1 && input < min_qty) {
      var id = element.replace("quantity_", "");
      deleteProductFromCart(id);
    }
    // changes over
    var QtyToUpDate = parseInt(input) - parseInt(hidden);
    var calculated_qty = parseInt(QtyToUpDate);
    if (calculated_qty == 0) {
      $("#cart_update_warning").html(
        '<div class="permanent-warning">No Change in Quantity</div>',
      );
    } else {
      var action = "up";
      if (calculated_qty < 0) {
        calculated_qty = parseInt(hidden) - parseInt(input);
        action = "down";
      }
      updateQty(element, action, calculated_qty, false);
    }
  } else {
    $("#cart_update_warning").html(
      '<div class="permanent-warning">' + scInvalidQty + "</div>",
    );
  }
}

function updateQty(element, action, qty, is_step_action) {
  $("#cart_update_warning .permanent-warning").remove();
  var exp = new RegExp("^[0-9]+$");
  if (exp.test(qty) == true) {
    var id_customization = 0;
    var id_product = 0;
    var id_product_attribute = 0;
    var id_address_delivery = 0;
    var ids = 0;
    var id = element.replace("quantity_", "");
    ids = id.split("_");
    id_product = parseInt(ids[0]);
    var errors = "";

    if (typeof ids[1] !== "undefined") {
      id_product_attribute = parseInt(ids[1]);
    }
    if (typeof ids[2] !== "undefined") {
      id_address_delivery = parseInt(ids[3]);
    }
    if (typeof ids[3] !== "undefined") {
      id_customization = parseInt(ids[3]);
    }
    $.ajax({
      type: "POST",
      headers: {
        "cache-control": "no-cache",
      },
      url: getURLwithTime(cart_update_url),
      data:
        "&ajax=true" +
        "&update=1" +
        "&action=update" +
        "&id_product=" +
        id_product +
        "&ipa=" +
        id_product_attribute +
        "&id_address_delivery=" +
        id_address_delivery +
        (id_customization !== 0
          ? "&id_customization=" + id_customization
          : "") +
        "&qty=" +
        qty +
        "&token=" +
        prestashop.static_token +
        "&op=" +
        action,
      async: true,
      cache: false,
      dataType: "json",
      beforeSend: function () {
        $("#cart_update_warning .permanent-warning").remove();
        $(".kb_velsof_sc_overlay").show();
        $(".pay-loader").show();
        $("#confirmLoader").show();
      },
      complete: function () {
        $(".kb_velsof_sc_overlay").hide();
        $(".pay-loader").hide();
        $("#confirmLoader").hide();
      },
      success: function (jsonData) {
        if (
          jsonData.hasError ||
          (typeof jsonData.errors !== "undefined" && jsonData.errors != "")
        ) {
          if (typeof jsonData.hasError == "undefined") {
            // soc by rishabh jain
            var new_qty = $("input[name=" + element + "]").val();
            if (is_step_action == true) {
              // chnages by rishabh jain for min quantity
              var min_qty = parseInt(
                $("#confirmCheckout input[name=" + element + "_minqty]").val(),
              );
              if (action == "up") {
                new_qty = parseInt(new_qty) + 1;
              } else if (action == "down") {
                new_qty = parseInt(new_qty) - 1;
              }
            }
            $("input[name=" + element + "]").val(new_qty);
            $("input[name=" + element + "_hidden]").val(new_qty);
            //$('#cart_update_warning').html('<div class="permanent-warning">' + jsonData.errors + '</div>');
            $.gritter.add({
              title: notification_title,
              text: jsonData.errors,
              class_name: "gritter-warning",
              sticky: false,
              time: "4000",
            });
            try {
              refresh();
            } catch (e) {}
            loadCarriers();
            // changes over
          } else {
            for (var error in jsonData.errors) {
              if (error !== "indexOf") {
                errors += jsonData.errors[error] + "<br>";
              }
            }
            $("#cart_update_warning").html(
              '<div class="permanent-warning">' + errors + "</div>",
            );
            /* Start - Code Added by Raghu on 21-Aug-2017 for fixing 'If we change quantity manually and set the quanity 1000 then we are getting an error that the products are not enough but the quantity is not getting set to the previous quantity which is a feature of supercheckout' issue */
            if (typeof jsonData.quantity != "undefined") {
              $("input[name=" + element + "]").val(jsonData.quantity);
            }
            /* End - Code Added by Raghu on 21-Aug-2017 for fixing 'If we change quantity manually and set the quanity 1000 then we are getting an error that the products are not enough but the quantity is not getting set to the previous quantity which is a feature of supercheckout' issue */
          }
        } else {
          var new_qty = $("input[name=" + element + "]").val();
          if (is_step_action == true) {
            // chnages by rishabh jain for min quantity
            var min_qty = parseInt(
              $("#confirmCheckout input[name=" + element + "_minqty]").val(),
            );
            if (action == "up") {
              new_qty = parseInt(new_qty) + 1;
            } else if (action == "down") {
              new_qty = parseInt(new_qty) - 1;
            }
          }
          $("input[name=" + element + "]").val(new_qty);
          $("input[name=" + element + "_hidden]").val(new_qty);
          $.gritter.add({
            title: notification_title,
            text: product_qty_update_success,
            class_name: "gritter-success",
            sticky: false,
            time: "3000",
          });
          try {
            refresh();
          } catch (e) {}
          loadCarriers();
        }
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
        $("#cart_update_warning").html(
          '<div class="permanent-warning">' + errors + "</div>",
        );
        $(".kb_velsof_sc_overlay").hide();
        $(".pay-loader").hide();
      },
    });
  } else {
    $("#cart_update_warning").html(
      '<div class="permanent-warning">' + scInvalidQty + "</div>",
    );
  }
}

function deleteProductFromCart(id) {
  var id_customization = 0;
  var id_product = 0;
  var id_product_attribute = 0;
  var id_address_delivery = 0;
  var ids = 0;
  ids = id.split("_");
  id_product = parseInt(ids[0]);
  var errors = "";

  if (typeof ids[1] !== "undefined") {
    id_product_attribute = parseInt(ids[1]);
  }
  if (typeof ids[2] !== "undefined") {
    id_address_delivery = parseInt(ids[2]);
  }
  if (typeof ids[3] !== "undefined") {
    id_customization = parseInt(ids[3]);
  }
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: getURLwithTime(cart_update_url),
    data:
      "&ajax=1" +
      "&delete=1" +
      "&action=update" +
      "&id_product=" +
      id_product +
      "&ipa=" +
      id_product_attribute +
      "&id_address_delivery=" +
      id_address_delivery +
      (id_customization !== 0 ? "&id_customization=" + id_customization : "") +
      "&token=" +
      prestashop.static_token,
    async: true,
    cache: false,
    dataType: "json",
    beforeSend: function () {
      $("#cart_update_warning .permanent-warning").remove();
    },
    success: function (jsonData) {
      if (jsonData.hasError) {
        for (var error in jsonData.errors) {
          if (error !== "indexOf") {
            errors += jsonData.errors[error] + "<br>";
          }
        }
        $("#cart_update_warning").html(
          '<div class="permanent-warning">' + errors + "</div>",
        );
      } else {
        $.gritter.add({
          title: notification,
          text: product_remove_success,
          class_name: "gritter-success",
          sticky: false,
          time: "3000",
        });
        $("#product_" + id).fadeOut("slow", function () {
          $(this).remove();
        });
        loadCarriers();
      }
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      $("#cart_update_warning").html(
        '<div class="permanent-warning">' + errors + "</div>",
      );
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
  });
}

function displayGeneralError(errors) {
  if ($("#supercheckout-empty-page-content .permanent-warning").length) {
    $("#supercheckout-empty-page-content .permanent-warning").html(errors);
  } else {
    $("#supercheckout-empty-page-content").html(
      '<div class="permanent-warning">' + errors + "</div>",
    );
  }
}

function hideGeneralError() {
  $("#supercheckout-empty-page-content .permanent-warning").remove();
}

function getCounrtryAndIdDelivery() {
  var id_country = 0;
  var id_address_delivery = "";
  if ($('input[name="shipping_address_value"]').length) {
    if ($('input[name="shipping_address_value"]:checked').val() == 1) {
      id_country = $(
        'select[name="shipping_address[id_country]"] option:selected',
      ).val();
    } else if ($('input[name="shipping_address_value"]:checked').val() == 0) {
      id_address_delivery = $(
        'select[name="shipping_address_id"] option:selected',
      ).val();
    }
  } else {
    id_country = $(
      'select[name="shipping_address[id_country]"] option:selected',
    ).val();
  }

  var arr = [];
  arr.push(id_country);
  arr.push(id_address_delivery);
  return arr;
}

function checkStateVisibility(selected_country, element) {
  var state_html = "";
  var has_states = false;
  var show_state = false;
  for (var id_country in countries) {
    if (id_country == selected_country) {
      if (countries[id_country]["contains_states"] == 1) {
        has_states = true;
      }
    }
  }
  if (element.indexOf("shipping") >= 0) {
    if (typeof show_shipping_state != "undefined") {
      if (show_shipping_state == 1) {
        show_state = true;
      }
    }
  } else if (element.indexOf("payment") >= 0) {
    if (typeof show_payment_state != "undefined") {
      if (show_payment_state == 1) {
        show_state = true;
      }
    }
  }

  if (has_states && show_state) {
    return true;
  } else {
    return false;
  }
}

function loadPayments(is_address_field_changed = false) {
  var params = "";
  if ($('input:radio[name="payment_method"]').length) {
    params =
      "&selected_payment_method_id=" +
      $('input:radio[name="payment-option"]:checked').val();
  }
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: getURLwithTime($("#module_url").val()),
    async: true,
    cache: false,
    dataType: "json",
    data:
      "ajax=true" +
      params +
      "&method=loadPayment&token=" +
      prestashop.static_token,
    beforeSend: function () {
      $("#payment_method_update_warning .permanent-warning").remove();
      if (!is_address_field_changed) {
        $(".kb_velsof_sc_overlay").show();
        $(".pay-loader").show();
        $("#paymentMethodLoader").show();
      }
    },
    complete: function () {
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
      $("#paymentMethodLoader").hide();
    },
    success: function (jsonData) {
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
      $("#paymentMethodLoader").hide();

      /**
       * If stripe payment method then dont reset the payment methods on page reload. On the page relaod if default payment method is stripe then stripe card details are being loaded.
       * @modifier Ashsish Kumar
       * @date 06-05-2024
       * AKMay2024 stripe-checkout-compatible
       */

      var payment_module_name = $(
        'input:radio[name="payment-option"]:checked',
      ).attr("data-module-name");

      /**
       * If Stripe is set to display the card methods on the page
       * @modifier Ashish Kumar
       * @date 06-05-2024
       * AKMay2024 stripe-checkout-compatible
       */
      if (
        payment_module_name == "stripe_official" &&
        stripe_payment_elements_enabled == 1
      ) {
      } else {
        /* *
         * If Stripe is set to display the card methods on the page
         * @modifier Ashsish Kumar
         * @date 06-05-2024
         * AKMay2024 stripe-checkout-compatible
         */
        if (stripe_loaded_flag == 0) {
          if (
            stripe_checkout_url !== "undefined" &&
            stripe_checkout_url != ""
          ) {
            $.getScript(stripe_checkout_url);
          }
        }

        $("#payment-method").html(jsonData["html"]);
      }

      /**
       * If the page is loaded then above condition will not be applicable. On any other events, the page will be behave normally.
       * @modifier Ashish Kumar
       * @date 06-05-2024
       * AKMay2024 stripe-checkout-compatible
       */
      stripe_loaded_flag = 1;

      $('input[name="payment-option"]:checked')
        .closest("li")
        .addClass("alert-info");
      set_column_inside_height();

      var paymentOptions = document.querySelectorAll(
        'input[name="payment-option"]',
      );

      if (null !== paymentOptions) {
        paymentOptions.forEach(function (paymentOption) {
          var paymentOptionContainer = document.getElementById(
            paymentOption.id + "-container",
          );
          var paymentOptionName =
            paymentOption.getAttribute("data-module-name");

          if (-1 !== paymentOptionName.search("ps_checkout")) {
            paymentOptionContainer.style.display = "none";
          }
        });
      }

      $(".opc_confirmcart #payment_methods_binaries").remove();
      if (ps_checkout_enable == 1) {
        $.getScript(js_url + "?version=2.3.0");
      }

      $("#payment_methods_binaries").insertAfter("#placeorderButton");
      loadPaymentAddtionalInfo();

      if (
        typeof stripe_amount != undefined &&
        jsonData["stripe_amount"] != undefined &&
        typeof stripe_payment_id != undefined &&
        jsonData["stripe_payment_id"] != undefined &&
        typeof stripe_client_secret != undefined &&
        jsonData["stripe_client_secret"] != undefined
      ) {
        stripe_amount = jsonData["stripe_amount"];
        stripe_payment_id = jsonData["stripe_payment_id"];
        stripe_client_secret = jsonData["stripe_client_secret"];
        callbackStripeToSc();
      }
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      $("#payment_method_update_warning").html(
        '<div class="permanent-warning">' + errors + "</div>",
      );
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
  });
}

function loadPaymentAddtionalInfo() {
  /**
   * To prevent the multipe paypal button on supercheckout page from paypal payment method
   * @modifier Ashsish Kumar
   * @date 06-05-2024
   * AKMay2024 stripe-checkout-compatible
   */
  //$('div.paypal-buttons-context-iframe').remove();
  $("div.paypal-marks").parent().parent().remove();

  if (!$('input:radio[name="payment-option"]').length) {
    return;
  }
  /**
   * Start Changes to fix the issue of showing default payment method to be shown as selected on page reload
   * Marking the payment method checked by using the payment_method cookie
   * NASep2023 payment_method_cookie
   * @date 26-09-2023
   * @modifier Nikhil Aggarwal
   */
  var selected_payment_method = getCookie("payment_method");
  if (
    typeof selected_payment_method !== "undefined" &&
    selected_payment_method !== false
  ) {
    $('input:radio[name="payment-option"]').each(function () {
      /**
       * Start Changes to fix the issue of payment methods not being selected in the iOS devices
       * Commented out below code to fix the issue
       * NADec2023 iOS_device_payment_method_issue
       * @date 22-12-2023
       * @modifier Nikhil Aggarwal
       */
      // Changes end by Nikhil
      if ($(this).val() == selected_payment_method) {
        $(this).prop("checked", true);
      }
    });
  }
  setCookie(
    "payment_method",
    $('input:radio[name="payment-option"]:checked').val(),
  );
  // Changes end by Nikhil
  //Start:Changes done by Anshul Mittal on 09/01/2020 for updating payment data (Feature: Checkout Behavior (Jan 2020))
  if ($('input[name="payment-option"]:checked').val() != "") {
    updateCheckoutBehaviour("payment_method", true);
  } else {
    updateCheckoutBehaviour("payment_method", false);
  }
  //End:Changes done by Anshul Mittal on 09/01/2020 for updating payment data  (Feature: Checkout Behavior (Jan 2020))
  var selected_option = $('input:radio[name="payment-option"]:checked').attr(
    "id",
  );
  var payment_module_name = $(
    'input:radio[name="payment-option"]:checked',
  ).attr("data-module-name");

  //Div id="payment_methods_additional_container" changed to div id="payment-option-{payment_id}-additional-information".
  //SC-13032024
  /*
    if ($('#payment_methods_additional_container').length) {
        $('#payment_methods_additional_container .payment-additional-info').hide();
        if (payment_module_name == 'kbcodwithfee') {                                 // Code added by Priyanshu on 21-April-2018
            $('#payment_methods_additional_container .' + selected_option + '_info_container').hide();
        }
        else {
            $('#payment_methods_additional_container .' + selected_option + '_info_container').show();
        }
        set_column_inside_height();
    }
    */
  /**
   * Start Changes to replace the selected_payment_method with selected_option as it not defined in some cases
   * @date 16-10-2024
   * @modifier Nikhil Aggarwal
   * NAOct2024 selected_option
   */
  if ($("#" + selected_option + "-additional-information").length) {
    $(".js-additional-information").hide();
    $(".js-payment-option-form").hide();

    if (payment_module_name == "kbcodwithfee") {
      $("#" + selected_option + "-additional-information").hide();
      $("#pay-with-" + selected_option + "-form").hide();
    } else {
      $("#" + selected_option + "-additional-information").show();
      $("#pay-with-" + selected_option + "-form").show();
    }
    set_column_inside_height();
  }
  // Changes end by Nikhil

  if (!$("#" + selected_option).hasClass("binary")) {
    $("#placeorderButton").show();
  }
  /** Start Changes to add the Payment Fee on Checkout
   * Adding extra params in the ajax call to get the payment fee and the status
   * @date 15-10-2024
   * NAOct2024 payment_fee
   * @modifier Nikhil Aggarwal
   */
  var kbselectedPaymentMethod = $(
    'input:radio[name="payment-option"]:checked',
  ).val();
  var kbselectedPaymentMethodApplicableFee = $(
    "#kb_payment_fee_applicable_" + kbselectedPaymentMethod,
  ).val();
  var kbselectedPaymentMethodStatus = $(
    "#kb_payment_fee_status_" + kbselectedPaymentMethod,
  ).val();
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: getURLwithTime($("#module_url").val()),
    async: true,
    cache: false,
    dataType: "json",
    data:
      "ajax=true" +
      "&selected_payment_method_id=" +
      $('input:radio[name="payment-option"]:checked').val() +
      "&method=loadPaymentAdditionalInfo&token=" +
      prestashop.static_token +
      "&kbselectedPaymentMethodApplicableFee=" +
      kbselectedPaymentMethodApplicableFee +
      "&kbselectedPaymentMethodStatus=" +
      kbselectedPaymentMethodStatus,
    // Changes end by Nikhil
    beforeSend: function () {
      $("#payment_method_update_warning .permanent-warning").remove();
    },
    complete: function () {
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
      $("#paymentMethodLoader").hide();
    },
    success: function (jsonData) {
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
      $("#paymentMethodLoader").hide();
      var payment_paypal_module_name = $(
        'input:radio[name="payment-option"]:checked',
      ).attr("data-module-name");
      /*
       * Condition added for checking the payment method paypal
       * @modifier Ashish Kumar
       * @date 06-05-2024
       * AKMay2024 stripe-checkout-compatible
       */
      if (
        jsonData["html"] != "" &&
        payment_paypal_module_name != "ps_checkout_paypal" &&
        payment_paypal_module_name != "paypal"
      ) {
        $("#velsof_payment_dialog .velsof_content_section").html(
          jsonData["html"],
        );
      }
      // Changes made by rishabh jain
      if (
        typeof initStripeOfficial != "undefined" &&
        $.isFunction(initStripeOfficial)
      ) {
        var stripe_isInit = false;
        var cardType;
        var stripe_v3;

        if (!stripe_isInit) {
          if (StripePubKey && typeof stripe_v3 !== "object") {
            stripe_v3 = Stripe(StripePubKey);
          }
          initStripeOfficial(stripe_v3);
        }
      }
      //EOC Changes made by rishabh jain

      // Start: Changes made by Anshul Mittal for PayPal Plus
      if (
        !$("#ppplus").length &&
        $("input[name=payment-option]:checked").attr("data-module-name") ==
          "paypalplus"
      ) {
        callbackPayPalPlus();
      }

      /* *
       * To enable to payment method on cart OR shipping method change. Otherwise its coming as disabled.
       * @modifier Ashish Kumar
       * @date 06-05-2024
       * AKMay2024 stripe-checkout-compatible
       */
      if (
        $("input[name=payment-option]:checked").attr("data-module-name") ==
        "paypal"
      ) {
        var selected_payment_id = $("input[name=payment-option]:checked").attr(
          "id",
        );
        $("#" + selected_payment_id).trigger("click");
      }

      if (
        $("input[name=payment-option]:checked").attr("data-module-name") ==
        "stripe_official"
      ) {
        $.getScript(stripe_checkout_url);
      }

      /* Start Code added By Kanishka on 08-12-2022 to fix the if payment_module_name is not defined*/
      //var is_ps_checkout_payment = payment_module_name.includes("ps_checkout");
      if (payment_module_name != undefined) {
        var is_ps_checkout_payment =
          payment_module_name.includes("ps_checkout");
      } else {
        var is_ps_checkout_payment = false;
      }
      /* Start Code added By Kanishka on 08-12-2022 to fix the if payment_module_name is not defined*/
      console.log(is_ps_checkout_payment);

      if (is_ps_checkout_payment) {
        $("#supercheckout_confirm_order").hide();
        $("#payment_methods_binaries").show();
        $(".js-payment-binary").hide();
        $(".js-payment-" + payment_module_name).show();
        $(".js-payment-" + payment_module_name + " .accept-cgv").hide();

        if (
          typeof $(
            'input[name="conditions_to_approve[terms-and-conditions]"]:checked',
          ).val() == "undefined"
        ) {
          $("#" + payment_module_name + "-buttons-container").css(
            "pointer-events",
            "none",
          );
          $(".js-payment-" + payment_module_name + " .accept-cgv").show();
        }
        //$('input[name="conditions_to_approve[terms-and-conditions]"]').click();
      } else {
        $("#payment_methods_binaries").hide();
        $("#supercheckout_confirm_order").show();
      }
      /**
       * To hide our module's confirm order button in case of module is paypal
       * @modifier Ashsish Kumar
       * @date 06-05-2024
       * AKMay2024 stripe-checkout-compatible
       */
      if (
        $("input[name=payment-option]:checked").attr("data-module-name") ==
        "paypal"
      ) {
        /**
         * Start Changes for the compatibility with the PS Checkout module
         * Add the condition such that, if the payment method is paypal then the confirm order button should be hidden only if popup in Paypal Module settings is enabled
         * @date 31-05-2024
         * @modifier Nikhil Aggarwal
         */
        if (paypal_exp_checkout == "1") {
          $("#supercheckout_confirm_order").hide();
        }
        // Changes end by Nikhil
      }
      // End: Changes made by Anshul Mittal for stripe v2.0.1 - v2.0.3
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      $("#payment_method_update_warning").html(
        '<div class="permanent-warning">' + errors + "</div>",
      );
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
  });

  if (typeof changeCODPaymentMethodFeeCartNew == "function") {
    /*
     *
     * @type Boolean
     * Added by Anshul to detect if codwithfee exists or not
     */
    var cod_fee = false;
    $('input:radio[name="payment-option"]').each(function () {
      if ($(this).attr("data-module-name") == "kbcodwithfee") {
        cod_fee = true;
      }
    });
    if (cod_fee) {
      changeCODPaymentMethodFeeCartNew();
    }
  }
  /** Start Changes to add the Payment Fee on Checkout
   * Calling the function to update the fee as per the selected payment method
   * @date 15-10-2024
   * NAOct2024 payment_fee
   * @modifier Nikhil Aggarwal
   */
  kbchangePaymentMethodFee();
  // Changes end by Nikhil
}

// Function added by Anshul Mittal for PayPal Plus
function callbackPayPalPlus() {
  if (typeof ppp_global_ajax !== "undefined" && ppp_global_ajax) {
    if (typeof ppp_global_ajax_error === "undefined") {
      if (typeof ppp_global_ajax_url !== "undefined") {
        try {
          $("#placeholder_ppplus").parent("div").css({ display: "block" });
          $(
            "#" +
              $("#placeholder_ppplus")
                .parent("div")
                .attr("id")
                .replace("-additional-information", ""),
          ).prop("checked", true);
        } catch (e) {
          console.log(e);
        }
        $.ajax({
          url: ppp_global_ajax_url,
          type: "GET",
          success: function (data) {
            $("#placeholder_ppplus").html(data);
            initPPPiFrame();
          },
          error: function (data) {
            $("#placeholder_ppplus").html("Paypal PLUS error" + data);
          },
        });
      }
    } else {
      alert("Paypal PLUS error");
    }
  } else {
    initPPPiFrame();
  }
}

function display_progress(value) {
  $("#supercheckout_confirm_order").attr("disabled", true);
  $("#submission_progress_overlay").css(
    "height",
    $("#supercheckout-fieldset").height(),
  );
  $("#supercheckout_order_progress_status_text").html(value + "%");
  /* Code added by Anshul for showing new progress bar*/
  $("#supercheckout_order_progress_status_text")
    .parent()
    .css("width", value + "%");
  /* Code added by Anshul for showing new progress bar*/
  $("#submission_progress_overlay").show();
  $("#supercheckout_order_progress_bar").show();
}

function hide_progress() {
  $("#supercheckout_confirm_order").removeAttr("disabled");
  $("#submission_progress_overlay").hide();
  $("#supercheckout_order_progress_bar").hide();
  $("#supercheckout_order_progress_status_text").html("0%");
}

/*
 *
 * @param {type} element
 * @returns {undefined}
 * Added by Anshul to upload the images using AJAX
 */

function upload(fd) {
  var has_content = false;
  $('input[type="file"]').each(function () {
    if (fd.has($(this).attr("name"))) {
      has_content = true;
    }
  });

  /**
   * Start Changes to fix the issue of wrong ajax url being created
   * Checking in the url that if it already contains & or not
   * NAMar2025 ajax_url
   * @date 04-03-2025
   * @modifier Nikhil Aggarwal
   */
  let kbajaxurl = getURLwithTime($("#module_url").val());
  kbajaxurl +=
    (kbajaxurl.indexOf("?") !== -1 ? "&" : "?") +
    "ajax=true&method=SaveFilesCustomField&rand=" +
    new Date().getTime();

  if (has_content) {
    $.ajax({
      url: kbajaxurl,
      type: "post",
      data: fd,
      dataType: "json",
      processData: false,
      contentType: false,
      beforeSend: function () {
        display_progress(10);
      },
      success: function (json) {
        if (json["error_occured"] == 1) {
          hide_progress();
          $("html, body").animate({ scrollTop: 0 }, "fast");
          displayGeneralError(json["msg"]);
        } else {
          display_progress(10);
          kbAfterPlaceOrder();
        }
      },
    });
  } else {
    display_progress(10);
    kbAfterPlaceOrder();
  }
}

/*
 * Added by Anshul to validate the images before uploading
 */

function validateFilesData() {
  var error = false;
  $(".errorsmall_custom").hide();
  $(".errorsmall_custom").parent().parent().css("border-color", "#CCCCCC");
  $('input[type="file"]').each(function () {
    if (
      $(this).closest(".supercheckout-blocks").find(".supercheckout-required")
        .length
    ) {
      if ($(this).prop("files").length == 0) {
        error = true;
        hide_progress();
        $("html, body").animate({ scrollTop: 0 }, "fast");
        $(this).next().html(upload_file_text);
        $(this).next().show();
        $(this).parent().parent().css("border-color", "#FF0000");
      } else {
        var extension_arr = [
          "pdf",
          "jpg",
          "jpeg",
          "png",
          "doc",
          "docx",
          "csv",
          "gif",
        ];
        var file_ext = $(this)
          .val()
          .trim()
          .substring($(this).val().trim().lastIndexOf(".") + 1)
          .toLowerCase();
        if ($.inArray(file_ext, extension_arr) == -1) {
          error = true;
          hide_progress();
          $("html, body").animate({ scrollTop: 0 }, "fast");
          $(this).next().html(valid_format_file_text);
          $(this).next().show();
          $(this).parent().parent().css("border-color", "#FF0000");
        }
      }
    } else {
      if ($(this).prop("files").length != 0) {
        var extension_arr = [
          "pdf",
          "jpg",
          "jpeg",
          "png",
          "doc",
          "docx",
          "csv",
          "gif",
        ];
        var file_ext = $(this)
          .val()
          .trim()
          .substring($(this).val().trim().lastIndexOf(".") + 1)
          .toLowerCase();
        if ($.inArray(file_ext, extension_arr) == -1) {
          error = true;
          hide_progress();
          $("html, body").animate({ scrollTop: 0 }, "fast");
          $(this).next().html(valid_format_file_text);
          $(this).next().show();
          $(this).parent().parent().css("border-color", "#FF0000");
        }
      }
    }
  });
  if (error) {
    return false;
  }
  return true;
}

/* Start Code Added By Priyanshu on 11-Feb-2021 for the packetery ( Zasilkovna ) compatibility */
var validators = [];

function addSupercheckoutOrderValidator(validator) {
  validators.push(validator);
}
/* End Code Added By Priyanshu on 11-Feb-2021 for the packetery ( Zasilkovna ) compatibility */

// This function is called when ajax request is made
function placeOrder() {
  /* Start Code Added By Priyanshu on 11-Feb-2021 for the packetery ( Zasilkovna ) compatibility */
  var isValid = true;
  if (is_virtual_cart == false) {
    $.each(validators, function (i, validator) {
      try {
        validator();
      } catch (error) {
        isValid = false;
        displayGeneralError(error.message);
      }
    });
    if (!isValid) {
      return;
    }
  }
  /* End Code Added By Priyanshu on 11-Feb-2021 for the packetery ( Zasilkovna ) compatibility */

  // Changes by rishabh jain for product availablility by zipcode
  if ($("#product_not_available .alert").length) {
    displayGeneralError(zipcode_error);
    $("html, body").animate({ scrollTop: 0 }, "fast");
    return;
  }
  // changes over

  /*
   * Start: Added by Anshul to check if opened form is saved or not.
   */
  if (
    $(".shipping_update_form").length ||
    ($(".payment_update_form").length && !$("#use_for_invoice").is(":checked"))
  ) {
    displayGeneralError(save_update_address);
    $("html, body").animate(
      {
        scrollTop: 0,
      },
      "fast",
    );
    return;
  }
  /*
   * End: Added by Anshul to check if opened form is saved or not.
   */

  if ($("#conditions-to-approve").length) {
    if (typeof mandatory_tos != "undefined" && mandatory_tos) {
      var is_toc_checked = true;
      $('#conditions-to-approve input[type="checkbox"]').each(function () {
        if (!$(this).is(":checked")) {
          is_toc_checked = false;
        }
      });
      if (!is_toc_checked) {
        displayGeneralError(toc_error);
        $("html, body").animate(
          {
            scrollTop: 0,
          },
          "fast",
        );
        return;
      }
    }
  }

  // Changes by rishabh jain for product availablility by zipcode
  if ($("#product_not_available .alert").length) {
    displayGeneralError(zipcode_error);
    $("html, body").animate(
      {
        scrollTop: 0,
      },
      "fast",
    );
    return;
  }
  // changes over
  var fd = new FormData();

  //Code added by Anshul to upload and save the files first
  $('input[type="file"]').each(function () {
    if ($(this).hasClass("kbfiletype")) {
      if ($(this).prop("files").length != 0) {
        fd.append($(this).attr("name"), $(this)[0].files[0]);
      }
    }
  });

  // Change added by kanishka on 28-12-2022 to check if file custom field is displayed or not
  if ($(".kbfiletype").length && $(".kbfiletype").parent().is(":visible")) {
    display_progress(5);
    if (validateFilesData()) {
      upload(fd);
    } else {
      displayGeneralError(validationfailedMsg);
      return false;
    }
  } else {
    display_progress(10);
    kbAfterPlaceOrder();
  }
}

/**
 * Added by Anshul for making it compatible with PayPlug
 */

function loadPaymentsPayPlug() {
  var params = "";
  if ($('input:radio[name="payment-option"]').length) {
    params =
      "&selected_payment_method_id=" +
      $('input:radio[name="payment_method"]:checked').val();
  }
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: getURLwithTime($("#module_url").val()),
    async: true,
    cache: false,
    dataType: "json",
    data:
      "ajax=true" +
      params +
      "&method=loadPayment&token=" +
      prestashop.static_token +
      "&lightbox=1",
    beforeSend: function () {
      $("#payment_method_update_warning .permanent-warning").remove();
      $(".kb_velsof_sc_overlay").show();
      $(".pay-loader").show();
      $("#paymentMethodLoader").show();
    },
    complete: function () {
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
      $("#paymentMethodLoader").hide();
    },
    success: function (jsonData) {
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
      $("#paymentMethodLoader").hide();
      $("#payment-method").html(jsonData["html"]);
      set_column_inside_height();
      loadPaymentAddtionalInfo();
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      $("#payment_method_update_warning").html(
        '<div class="permanent-warning">' + errors + "</div>",
      );
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
  });
}

/**
 * Added by Anshul for calling the Place order after file upload
 */

function kbAfterPlaceOrder() {
  $(".errorsmall").remove();
  hideGeneralError();
  var payment_module_name = $(
    'input:radio[name="payment-option"]:checked',
  ).attr("data-module-name");
  // Start: Added by Anshul for PayPlug
  if (payment_module_name == "payplug") {
    loadPaymentsPayPlug();
  }
  // End: Added by Anshul for PayPlug
  var errors = "";

  /**
   * Start Changes to fix the issue of wrong ajax url being created
   * Checking in the url that if it already contains & or not
   * NAMar2025 ajax_url
   * @date 04-03-2025
   * @modifier Nikhil Aggarwal
   */
  let kbajaxurl = getURLwithTime($("#module_url").val());
  kbajaxurl += (kbajaxurl.indexOf("?") !== -1 ? "&" : "?") + "ajax=true";

  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: kbajaxurl,
    async: true,
    cache: false,
    dataType: "json",
    data: $("#velsof_supercheckout_form").serialize(),
    beforeSend: function () {
      display_progress(20);
    },
    complete: function () {},
    success: function (jsonData) {
      // Checking if jsonData is having property as custom_fields_errors
      // If true it means that all other validations are correct and error occured in custom fields
      if (jsonData.hasOwnProperty("custom_fields_errors")) {
        $(".errorsmall_custom").hide();
        $(".errorsmall_custom")
          .parent()
          .parent()
          .css("border-color", "#CCCCCC");
        $.each(jsonData.custom_fields_errors.error, function (key, data) {
          hide_progress();
          $("html, body").animate(
            {
              scrollTop: 0,
            },
            "fast",
          );
          $("#error_" + key).html(data);
          $("#error_" + key).show();
          $("#error_" + key)
            .parent()
            .parent()
            .css("border-color", "#FF0000");
        });
      }

      if (jsonData["error"] != undefined) {
        var has_validation_error = false;
        var i = 0;
        if (jsonData["error"]["checkout_option"] != undefined) {
          has_validation_error = true;
          for (i in jsonData["error"]["checkout_option"]) {
            $(
              'input[name="' +
                jsonData["error"]["checkout_option"][i]["key"] +
                '"]',
            )
              .parent()
              .append(
                '<span class="errorsmall">' +
                  jsonData["error"]["checkout_option"][i]["error"] +
                  "</span>",
              );
            if (inline_validation == 1)
              $(
                'input[name="' +
                  jsonData["error"]["checkout_option"][i]["key"] +
                  '"]',
              )
                .addClass("error-form")
                .removeClass("ok-form");
          }
        }

        var i = 0;
        var key = "";
        if (jsonData["error"]["customer_personal"] != undefined) {
          has_validation_error = true;
          for (i in jsonData["error"]["customer_personal"]) {
            key = jsonData["error"]["customer_personal"][i]["key"];
            if (key == "dob" || key == "id_gender") {
              $(".supercheckout_personal_" + key).append(
                '<span class="errorsmall">' +
                  jsonData["error"]["customer_personal"][i]["error"] +
                  "</span>",
              );
            } else if (key == "password") {
              $('input[name="customer_personal[' + key + ']"]')
                .parent()
                .append(
                  '<span class="errorsmall">' +
                    jsonData["error"]["customer_personal"][i]["error"] +
                    "</span>",
                );
              if (inline_validation == 1)
                $('input[name="customer_personal[' + key + ']"]')
                  .addClass("error-form")
                  .removeClass("ok-form");
            } else {
              $('input[name="customer_personal[' + key + ']"]')
                .parent()
                .parent()
                .parent()
                .parent()
                .append(
                  '<span class="errorsmall">' +
                    jsonData["error"]["customer_personal"][i]["error"] +
                    "</span>",
                );
              if (inline_validation == 1)
                $('input[name="customer_personal[' + key + ']"]')
                  .addClass("error-form")
                  .removeClass("ok-form");
            }
          }
        }

        var tmp_index;
        if (jsonData["error"]["shipping_address"] != undefined) {
          has_validation_error = true;
          for (tmp_index in jsonData["error"]["shipping_address"]) {
            var element_name =
              jsonData["error"]["shipping_address"][tmp_index]["key"];
            $(
              'input[name="shipping_address[' +
                element_name +
                ']"], select[name="shipping_address[' +
                element_name +
                ']"]',
            )
              .parent()
              .append(
                '<span class="errorsmall">' +
                  jsonData["error"]["shipping_address"][tmp_index]["error"] +
                  "</span>",
              );
            if (inline_validation == 1)
              $('input[name="shipping_address[' + element_name + ']"]')
                .addClass("error-form")
                .removeClass("ok-form");
            if (
              jsonData["error"]["shipping_address"][tmp_index]["key"] ==
              "postcode"
            )
              $("#shipping_post_code").css("display", "block");
            // helpful when postcode is hidden from our module but is equired for some country
            delete element_name;
          }
        }

        var tmp_index;
        if (jsonData["error"]["payment_address"] != undefined) {
          has_validation_error = true;
          for (tmp_index in jsonData["error"]["payment_address"]) {
            var element_name =
              jsonData["error"]["payment_address"][tmp_index]["key"];
            $(
              'input[name="payment_address[' +
                element_name +
                ']"], select[name="payment_address[' +
                element_name +
                ']"]',
            )
              .parent()
              .append(
                '<span class="errorsmall">' +
                  jsonData["error"]["payment_address"][tmp_index]["error"] +
                  "</span>",
              );
            if (inline_validation == 1)
              $('input[name="payment_address[' + element_name + ']"]')
                .addClass("error-form")
                .removeClass("ok-form");
            if (
              jsonData["error"]["payment_address"][tmp_index]["key"] ==
              "postcode"
            )
              $("#payment_post_code").css("display", "block");
            // helpful when postcode is hidden from our module but is equired for some country
            delete element_name;
          }
        }
        i = 0;
        if (jsonData["error"]["general"] != undefined) {
          errors = "";
          for (var i in jsonData["error"]["general"]) {
            errors += jsonData["error"]["general"][i] + "<br>";
          }
        } else if (has_validation_error) {
          errors = validationfailedMsg;
        } else {
          errors = scOtherError;
        }
        displayGeneralError(errors);
        hide_progress();
        $("html, body").animate(
          {
            scrollTop: 0,
          },
          "fast",
        );
      } else {
        if (jsonData["warning"] != undefined) {
          //handle warning here
        }
        display_progress(30);
        var is_carrier_selected = true;

        //validate Methods
        $(
          "#shipping-method .supercheckout-checkout-content .permanent-warning",
        ).remove();
        if ($("#shipping-method .supercheckout_shipping_option").length) {
          if (
            !$("#shipping-method .supercheckout_shipping_option:checked").length
          ) {
            is_carrier_selected = false;
          }
        }

        var is_payment_selected = true;
        $(
          "#payment-method .supercheckout-checkout-content .permanent-warning",
        ).remove();
        if ($('#payment-method input[name="payment-option"]').length) {
          if (
            !$('#payment-method input[name="payment-option"]:checked').length
          ) {
            is_payment_selected = false;
          }
        }

        if (is_virtual_cart) {
          is_carrier_selected = true;
        }

        if (!is_carrier_selected) {
          $("#shipping-method .supercheckout-checkout-content").html(
            '<div class="permanent-warning">' + ShippingRequired + "</div>",
          );
        }
        if (!is_payment_selected) {
          $("#payment-method .supercheckout-checkout-content").html(
            '<div class="permanent-warning">' + paymentRequired + "</div>",
          );
        }

        if (!is_carrier_selected || !is_payment_selected) {
          hide_progress();
          displayGeneralError(display_general_error_msg);
          $("html, body").animate(
            {
              scrollTop: 0,
            },
            "fast",
          );
        } else {
          display_progress(50);
          //Validate Order Extras
          var messagePattern = /[<>{}]/i;
          var message = "";
          var extrasError = false;
          if ($("#supercheckout-comment_order").length) {
            message = $("#supercheckout-comment_order").val();
            if (messagePattern.test(message)) {
              extrasError = true;
              $("#supercheckout-comment_order")
                .parent()
                .append(
                  '<span class="errorsmall">' + commentInvalid + "</span>",
                );
            }
          }

          if ($("#gift").length && $("#gift").is(":checked")) {
            message = $("#gift_message").val();
            if (messagePattern.test(message)) {
              extrasError = true;
              $("#gift_message")
                .parent()
                .append(
                  '<span class="errorsmall">' + commentInvalid + "</span>",
                );
            }
          }

          if (extrasError) {
            hide_progress();
          } else {
            display_progress(80);
            if (jsonData["is_free_order"]) {
              createFreeOrder();
            } else {
              var selected_payment = $(
                'input:radio[name="payment-option"]:checked',
              ).attr("id");

              if (payment_module_name == "kbwallet") {
                $("#kbwallet_form").submit();
              }

              /**
               * Start Changes for the compatibility with the authorized.net
               * @date 15 December 2025
               *
               */
              if (
                $("input[name=payment-option]:checked").attr(
                  "data-module-name",
                ) == "tfauthorizedotnet"
              ) {
                try {
                  $("#tf-payment-form").paymentForm("valid");
                } catch (error) {
                  $("#tf-payment-form").paymentForm();
                }

                $(".tf_authorized_gif").show();
                hide_progress();
                var valid = $("#tf-payment-form").paymentForm("valid");
                if (valid) {
                  form_data = {
                    number: $("#cc-number").val(),
                    cvv: $("#cc-cvc").val(),
                    expiry: $("#cc-exp").val(),
                  };
                  $('input[name="tf_information"]').attr(
                    "value",
                    JSON.stringify(form_data),
                  );
                  var tf_payment_form_action = $(".js-additional-information")
                    .find("form#tf-payment-form")
                    .attr("action");
                  $("#kb-tfauthorizedotnet-payment-form-div")
                    .find("form#tf-payment-form")
                    .attr("action", tf_payment_form_action);
                  $("#kb-tfauthorizedotnet-payment-form-div")
                    .find("form#tf-payment-form")
                    .submit();
                } else {
                  $(".tf_authorized_gif").hide();
                }
                return;
              }

              /**
               * Start Changes for the compatibility with the PS Checkout module
               * Add the condition such that, if the payment method is paypal then the confirm order button should be hidden only if popup in Paypal Module settings is enabled
               * @date 31-05-2024
               * @modifier Nikhil Aggarwal
               */
              if (
                $("input[name=payment-option]:checked").attr(
                  "data-module-name",
                ) == "paypal"
              ) {
                if (paypal_exp_checkout != "1") {
                  $("#payment-" + selected_payment + "-form").submit();
                }
              }
              // Changes end by Nikhil
              /* Start Code added By Kanishka on 08-12-2022 to fix the Mollie Payment Method Compaibility issue */
              if (
                $('input:radio[name="payment-option"]:checked').attr(
                  "data-module-name",
                ) == "mollie"
              ) {
                var pay_value = $(
                  'input:radio[name="payment-option"]:checked',
                ).val();
                //Div id="payment_methods_additional_container" changed to div id="payment-option-{payment_id}-additional-information".
                //SC-13032024
                //$('#payment_methods_additional_container .'+pay_value+'_info_container form#payment-form').submit();
                $(
                  "#" + pay_value + "-additional-information form#payment-form",
                ).submit();
                return;
              }
              /* Start Code added By Kanishka on 08-12-2022 to fix the Mollie Payment Method Compaibility issue */

              if (
                $('input:radio[name="payment-option"]:checked').attr(
                  "data-module-name",
                ) == "payplug"
              ) {
                //Div id="payment_methods_additional_container" changed to div id="payment-option-{payment_id}-additional-information".
                //SC-13032024
                //$('.' + selected_payment + '_info_container #payment-form').submit();
                $(
                  "#" +
                    selected_payment +
                    "-additional-information #payment-form",
                ).submit();
                return;
              }

              // Start: Added by Anshul for making it compatible with a4ppaypalpro
              if (
                $("#payment-method")
                  .find("input[data-module-name='a4ppaypalpro']")
                  .is(":checked")
              ) {
                $("#a4ppaypalpro_formblock").card({
                  container: ".card-wrapper",
                });
                $(".jp-card").css("min-width", "auto");
              }
              // End: Added by Anshul for making it compatible with a4ppaypalpro

              // Start: Added by Anshul for making it compatible with Amazon Pay
              if (
                $('input:radio[name="payment-option"]:checked').attr(
                  "data-module-name",
                ) == "amzpayments"
              ) {
                $(
                  "span#pay_with_amazon_list_button #OffAmazonPaymentsWidgets0",
                ).trigger("click");
                return;
              }
              // End: Added by Anshul for making it compatible with Amazon Pay

              //Start: Added by Anshul for making it compatible with PayPlug
              if (payment_module_name == "payplug") {
                setTimeout(function () {
                  var url = $("#payplug_form_js").data("payment-url");
                  Payplug.showPayment(url);
                  hide_progress();
                }, 3000);
                return;
              }
              //End: Added by Anshul for making it compatible with PayPlug

              // Start: Changes made by Anshul Mittal for stripe v2.0.1 - v2.0.3
              if (
                $('input:radio[name="payment-option"]:checked').attr(
                  "data-module-name",
                ) == "stripe_official"
              ) {
                //$('#supercheckout_confirm_order_kb').trigger('click');
                hide_progress();
                //Condition based on Stripe is set to Integrated payment form OR Redirect to Stripe
                if (stripe_payment_elements_enabled == 1) {
                  $("#payment-confirmation").find("button").trigger("click");
                } else {
                  $("#payment-form").submit();
                }
                return;
              }
              // End: Changes made by Anshul Mittal for stripe v2.0.1 - v2.0.3

              // Start: Changes made by Anshul Mittal for PayPal Plus
              if (payment_module_name == "paypalplus") {
                var disabled = $("#pppContinueButton").prop("disabled");
                if (typeof disabled != "undefined" && !disabled) {
                  doPaypalPlusCheckout();
                  return;
                }
              }
              // Start: Changes made by Anshul Mittal for PayPal Plus

              // Start: Changes done by Anshul for KLARNA PAYMENT MODULE
              if (
                payment_module_name == "klarnapayments_pay_later_module" ||
                payment_module_name == "klarnapayments_pay_over_time_module"
              ) {
                var klarna_options = $(".klarna-container");
                for (var i = 0; i < klarna_options.length; i++) {
                  var payment_category = klarna_options[i].id.substring(
                    26,
                    klarna_options[i].id.length,
                  );
                  if (
                    $(
                      "input[data-module-name=klarnapayments_" +
                        payment_category +
                        "_module]",
                    ).is(":checked")
                  ) {
                    setupKlarnaAuthCallKb(payment_category);
                    hide_progress();
                    return;
                  }
                }
              }
              // End: Changes done by Anshul for KLARNA PAYMENT MODULE

              if (payment_module_name == "ps_checkout_hostedFields") {
                $("#hosted-fields-form").submit();
                hide_progress();
                $("html, body").animate(
                  { scrollTop: $("#hosted-fields-form").offset().top },
                  "fast",
                );
                return;
              }

              if (
                $('input:radio[name="payment-option"]:checked').hasClass(
                  "binary",
                )
              ) {
                if ($("#payment_methods_binaries").length) {
                  $("#velsof_payment_dialog .velsof_content_section").html(
                    $(
                      "#payment_methods_binaries .js-payment-" +
                        selected_payment,
                    ).html(),
                  );
                  $("#placeorderButton").hide();

                  // Code added by Priyanshu on 21-April-2018
                  if (payment_module_name == "kbcodwithfee") {
                    $("#velsof_payment_dialog").hide();
                    /**
                     * Start Changes to fix the issue of COD fee being applied for the first profile only even if we select another profile
                     * The form of the first profile is being targeted which is resulting to the wrong fee in the order
                     * NADec2023 cod_fee_profile_price_update
                     * @date 22-12-2023
                     * @modifier Nikhil Aggarwal
                     */
                    var codselectedPaymentMethod = $(
                      'input:radio[name="payment-option"]:checked',
                    ).val();
                    $(
                      "#" +
                        codselectedPaymentMethod +
                        "-additional-information #PayButton",
                    ).trigger("click");
                    // Changes end by Nikhil
                  } else {
                    if (
                      $("#velsof_payment_dialog .velsof_content_section form")
                        .length
                    ) {
                      $(
                        "#velsof_payment_dialog .velsof_content_section form",
                      ).submit();
                    } else {
                      $(
                        "." + selected_payment + "_info_container form",
                      ).submit();
                    }
                  }
                } else {
                  alert(
                    "Error with selected Payment Method. Please contact with store.",
                  );
                }
              } else {
                if (
                  $(
                    "." +
                      selected_payment +
                      "_info_container #stripe-payment-form",
                  ).length
                ) {
                  $(
                    "#velsof_payment_dialog .velsof_content_section #pay-with-form",
                  ).html("");
                  $("#stripe-payment-form").submit();
                  hide_progress();
                } else {
                  if (
                    $("#velsof_payment_dialog .velsof_content_section form")
                      .length
                  ) {
                    $(
                      "#velsof_payment_dialog .velsof_content_section form",
                    ).submit();
                  } else {
                    $("." + selected_payment + "_info_container form").submit();
                  }
                }
              }
            }
          }
        }
      }
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      displayGeneralError(errors);
      hide_progress();
      $("html, body").animate(
        {
          scrollTop: 0,
        },
        "fast",
      );
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
  });
}

function setupKlarnaAuthCallKb(category) {
  $("#velsof_supercheckout_form #placeorderButton #supercheckout_confirm_order")
    .find("button")
    .prop("disabled", true);
  $(
    "#velsof_supercheckout_form #placeorderButton #supercheckout_confirm_order",
  ).append('<img id="loading-icon" src="' + img_path + 'loader.gif" />');
  makeAuthorizeCall(category);
}

function createFreeOrder() {
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: getURLwithTime($("#module_url").val()),
    async: true,
    cache: false,
    dataType: "json",
    data:
      "ajax=true" + "&method=createFreeOrder&token=" + prestashop.static_token,
    beforeSend: function () {},
    success: function (jsonData) {
      if (typeof isGuest != "undefined")
        document.location.href =
          scp_guest_tracking_url +
          "?id_order=" +
          encodeURIComponent(jsonData["order_reference"]) +
          "&email=" +
          encodeURIComponent(jsonData["email"]);
      else document.location.href = scp_history_url;
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      displayGeneralError(errors);
      hide_progress();
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
  });
}

function saveAddress() {
  // changes by rishabh jain for google recaptcha integration
  var request_params = "";
  if ($("#g-recaptcha-response").length) {
    request_params +=
      "&g-recaptcha-response=" + $("#g-recaptcha-response").val();
  }
  // changes over
  var errors = "";
  /**
   * Start Changes to fix the issue of wrong ajax url being created
   * Checking in the url that if it already contains & or not
   * NAMar2025 ajax_url
   * @date 04-03-2025
   * @modifier Nikhil Aggarwal
   */
  let kbajaxurl = getURLwithTime($("#module_url").val());
  kbajaxurl +=
    (kbajaxurl.indexOf("?") !== -1 ? "&" : "?") +
    "ajax=true&method=saveAddress&rand=" +
    new Date().getTime() +
    request_params;
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: kbajaxurl,
    async: true,
    cache: false,
    dataType: "json",
    data: $("#velsof_supercheckout_form").serialize(),
    beforeSend: function () {
      $(".errorsmall").remove();
      hideGeneralError();
      display_progress(20);
    },
    complete: function () {},
    success: function (jsonData) {
      display_progress(30);
      if (jsonData["error"] != undefined) {
        var has_validation_error = false;
        var i = 0;
        if (jsonData["error"]["checkout_option"] != undefined) {
          has_validation_error = true;
          for (i in jsonData["error"]["checkout_option"]) {
            $(
              'input[name="' +
                jsonData["error"]["checkout_option"][i]["key"] +
                '"]',
            )
              .parent()
              .append(
                '<span class="errorsmall">' +
                  jsonData["error"]["checkout_option"][i]["error"] +
                  "</span>",
              );
            if (inline_validation == 1)
              $(
                'input[name="' +
                  jsonData["error"]["checkout_option"][i]["key"] +
                  '"]',
              )
                .addClass("error-form")
                .removeClass("ok-form");
          }
        }
        /**
         * Start changes to fix issue of saving custom field at the time of saving address
         * NASep2023 custom_field_persistence
         * @date 26-09-2023
         * @modifier Nikhil Aggarwal
         */
        $(".errorsmall_custom").hide();
        $(".errorsmall_custom")
          .parent()
          .parent()
          .css("border-color", "#CCCCCC");
        if (jsonData.hasOwnProperty("custom_fields_errors")) {
          $.each(jsonData.custom_fields_errors.error, function (key, data) {
            hide_progress();
            $("html, body").animate(
              {
                scrollTop: 0,
              },
              "fast",
            );
            $("#error_" + key).html(data);
            $("#error_" + key).show();
            $("#error_" + key)
              .parent()
              .parent()
              .css("border-color", "#FF0000");
          });
        }
        var i = 0;
        var key = "";
        if (jsonData["error"]["customer_personal"] != undefined) {
          has_validation_error = true;
          for (i in jsonData["error"]["customer_personal"]) {
            key = jsonData["error"]["customer_personal"][i]["key"];
            if (key == "dob" || key == "id_gender") {
              $(".supercheckout_personal_" + key).append(
                '<span class="errorsmall">' +
                  jsonData["error"]["customer_personal"][i]["error"] +
                  "</span>",
              );
            } else if (key == "password") {
              $('input[name="customer_personal[' + key + ']"]')
                .parent()
                .append(
                  '<span class="errorsmall">' +
                    jsonData["error"]["customer_personal"][i]["error"] +
                    "</span>",
                );
              if (inline_validation == 1)
                $('input[name="customer_personal[' + key + ']"]')
                  .addClass("error-form")
                  .removeClass("ok-form");
            } else {
              $('input[name="customer_personal[' + key + ']"]')
                .parent()
                .parent()
                .parent()
                .parent()
                .append(
                  '<span class="errorsmall">' +
                    jsonData["error"]["customer_personal"][i]["error"] +
                    "</span>",
                );
              if (inline_validation == 1)
                $('input[name="customer_personal[' + key + ']"]')
                  .addClass("error-form")
                  .removeClass("ok-form");
            }
          }
        }

        var tmp_index;
        if (jsonData["error"]["shipping_address"] != undefined) {
          has_validation_error = true;
          for (tmp_index in jsonData["error"]["shipping_address"]) {
            var element_name =
              jsonData["error"]["shipping_address"][tmp_index]["key"];
            $(
              'input[name="shipping_address[' +
                element_name +
                ']"], select[name="shipping_address[' +
                element_name +
                ']"]',
            )
              .parent()
              .append(
                '<span class="errorsmall">' +
                  jsonData["error"]["shipping_address"][tmp_index]["error"] +
                  "</span>",
              );
            if (inline_validation == 1)
              $('input[name="shipping_address[' + element_name + ']"]')
                .addClass("error-form")
                .removeClass("ok-form");
            if (
              jsonData["error"]["shipping_address"][tmp_index]["key"] ==
              "postcode"
            )
              $("#shipping_post_code").css("display", "block");
            // helpful when postcode is hidden from our module but is equired for some country
            delete element_name;
          }
        }

        var tmp_index;
        if (jsonData["error"]["payment_address"] != undefined) {
          has_validation_error = true;
          for (tmp_index in jsonData["error"]["payment_address"]) {
            var element_name =
              jsonData["error"]["payment_address"][tmp_index]["key"];
            $(
              'input[name="payment_address[' +
                element_name +
                ']"], select[name="payment_address[' +
                element_name +
                ']"]',
            )
              .parent()
              .append(
                '<span class="errorsmall">' +
                  jsonData["error"]["payment_address"][tmp_index]["error"] +
                  "</span>",
              );
            if (inline_validation == 1)
              $('input[name="payment_address[' + element_name + ']"]')
                .addClass("error-form")
                .removeClass("ok-form");
            if (
              jsonData["error"]["payment_address"][tmp_index]["key"] ==
              "postcode"
            )
              $("#payment_post_code").css("display", "block");
            // helpful when postcode is hidden from our module but is equired for some country
            delete element_name;
          }
        }
        i = 0;
        if (jsonData["error"]["general"] != undefined) {
          errors = "";
          for (var i in jsonData["error"]["general"]) {
            errors += jsonData["error"]["general"][i] + "<br>";
          }
        } else if (has_validation_error) {
          errors = validationfailedMsg;
        } else {
          errors = scOtherError;
        }
        displayGeneralError(errors);
        hide_progress();
        $("html, body").animate(
          {
            scrollTop: 0,
          },
          "fast",
        );
      } else {
        display_progress(80);
        if ($("input:radio[name=checkout_option]:checked").val() == 1) {
          /* Start - Code Added by Raghu on 21-Aug-2017 for fixing 'URL Append Issue in case of Guest Checkout Save Address' issue */
          var supercheckout_page = window.location.href.replace(
            "?checkout_option=guest",
            "",
          );
          supercheckout_page = supercheckout_page.replace(
            "?checkout_option=guest",
            "",
          );
          /* End - Code Added by Raghu on 21-Aug-2017 for fixing 'URL Append Issue in case of Guest Checkout Save Address' issue */
          supercheckout_page_wparam = "";

          // If current page has a query string, append action to the end of the query string, else
          // create our query string
          if (supercheckout_page.indexOf("?") > -1) {
            supercheckout_page_wparam =
              supercheckout_page + "&checkout_option=guest";
          } else {
            supercheckout_page_wparam =
              supercheckout_page + "?checkout_option=guest";
          }
          // Redirect to next page
          window.location = supercheckout_page_wparam;
        } else {
          location.reload(true);
        }
      }
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      displayGeneralError(errors);
      hide_progress();
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
      $("html, body").animate(
        {
          scrollTop: 0,
        },
        "fast",
      );
    },
  });
}

function KbsaveAddress() {
  // changes by rishabh jain for google recaptcha integration
  var request_params = "";
  if ($("#g-recaptcha-response").length) {
    request_params +=
      "&g-recaptcha-response=" + $("#g-recaptcha-response").val();
  }
  // changes over
  var errors = "";
  /**
   * Start Changes to fix the issue of wrong ajax url being created
   * Checking in the url that if it already contains & or not
   * NAMar2025 ajax_url
   * @date 04-03-2025
   * @modifier Nikhil Aggarwal
   */
  let kbajaxurl = getURLwithTime($("#module_url").val());
  kbajaxurl +=
    (kbajaxurl.indexOf("?") !== -1 ? "&" : "?") +
    "ajax=true&method=saveAddress&rand=" +
    new Date().getTime() +
    request_params;
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: kbajaxurl,
    async: true,
    cache: false,
    dataType: "json",
    data: $("#velsof_supercheckout_form").serialize(),
    beforeSend: function () {
      $(".errorsmall").remove();
      hideGeneralError();
    },
    complete: function () {},
    success: function (jsonData) {
      if (jsonData["error"] != undefined) {
        var has_validation_error = false;
        var i = 0;
        if (jsonData["error"]["checkout_option"] != undefined) {
          has_validation_error = true;
          for (i in jsonData["error"]["checkout_option"]) {
            $(
              'input[name="' +
                jsonData["error"]["checkout_option"][i]["key"] +
                '"]',
            )
              .parent()
              .append(
                '<span class="errorsmall">' +
                  jsonData["error"]["checkout_option"][i]["error"] +
                  "</span>",
              );
            if (inline_validation == 1)
              $(
                'input[name="' +
                  jsonData["error"]["checkout_option"][i]["key"] +
                  '"]',
              )
                .addClass("error-form")
                .removeClass("ok-form");
          }
        }

        var i = 0;
        var key = "";
        if (jsonData["error"]["customer_personal"] != undefined) {
          has_validation_error = true;
          for (i in jsonData["error"]["customer_personal"]) {
            key = jsonData["error"]["customer_personal"][i]["key"];
            if (key == "dob" || key == "id_gender") {
              $(".supercheckout_personal_" + key).append(
                '<span class="errorsmall">' +
                  jsonData["error"]["customer_personal"][i]["error"] +
                  "</span>",
              );
            } else if (key == "password") {
              $('input[name="customer_personal[' + key + ']"]')
                .parent()
                .append(
                  '<span class="errorsmall">' +
                    jsonData["error"]["customer_personal"][i]["error"] +
                    "</span>",
                );
              if (inline_validation == 1)
                $('input[name="customer_personal[' + key + ']"]')
                  .addClass("error-form")
                  .removeClass("ok-form");
            } else {
              $('input[name="customer_personal[' + key + ']"]')
                .parent()
                .parent()
                .parent()
                .parent()
                .append(
                  '<span class="errorsmall">' +
                    jsonData["error"]["customer_personal"][i]["error"] +
                    "</span>",
                );
              if (inline_validation == 1)
                $('input[name="customer_personal[' + key + ']"]')
                  .addClass("error-form")
                  .removeClass("ok-form");
            }
          }
        }

        var tmp_index;
        if (jsonData["error"]["shipping_address"] != undefined) {
          has_validation_error = true;
          for (tmp_index in jsonData["error"]["shipping_address"]) {
            var element_name =
              jsonData["error"]["shipping_address"][tmp_index]["key"];
            $(
              'input[name="shipping_address[' +
                element_name +
                ']"], select[name="shipping_address[' +
                element_name +
                ']"]',
            )
              .parent()
              .append(
                '<span class="errorsmall">' +
                  jsonData["error"]["shipping_address"][tmp_index]["error"] +
                  "</span>",
              );
            if (inline_validation == 1)
              $('input[name="shipping_address[' + element_name + ']"]')
                .addClass("error-form")
                .removeClass("ok-form");
            if (
              jsonData["error"]["shipping_address"][tmp_index]["key"] ==
              "postcode"
            )
              $("#shipping_post_code").css("display", "block");
            // helpful when postcode is hidden from our module but is equired for some country
            delete element_name;
          }
        }

        var tmp_index;
        if (jsonData["error"]["payment_address"] != undefined) {
          has_validation_error = true;
          for (tmp_index in jsonData["error"]["payment_address"]) {
            var element_name =
              jsonData["error"]["payment_address"][tmp_index]["key"];
            $(
              'input[name="payment_address[' +
                element_name +
                ']"], select[name="payment_address[' +
                element_name +
                ']"]',
            )
              .parent()
              .append(
                '<span class="errorsmall">' +
                  jsonData["error"]["payment_address"][tmp_index]["error"] +
                  "</span>",
              );
            if (inline_validation == 1)
              $('input[name="payment_address[' + element_name + ']"]')
                .addClass("error-form")
                .removeClass("ok-form");
            if (
              jsonData["error"]["payment_address"][tmp_index]["key"] ==
              "postcode"
            )
              $("#payment_post_code").css("display", "block");
            // helpful when postcode is hidden from our module but is equired for some country
            delete element_name;
          }
        }
        i = 0;
        if (jsonData["error"]["general"] != undefined) {
          errors = "";
          for (var i in jsonData["error"]["general"]) {
            errors += jsonData["error"]["general"][i] + "<br>";
          }
        } else if (has_validation_error) {
          errors = validationfailedMsg;
        } else {
          errors = scOtherError;
        }
        displayGeneralError(errors);
        hide_progress();
        $("html, body").animate(
          {
            scrollTop: 0,
          },
          "fast",
        );
      }
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      displayGeneralError(errors);
      hide_progress();
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
      $("html, body").animate(
        {
          scrollTop: 0,
        },
        "fast",
      );
    },
  });
}

/*
 * Function Added by Raghu on 22-Aug-2017 for fixing 'Missing isValidDni Function from SuperCheckout JS File' issue
 * @returns
 */

function isValidDni(type) {
  var id_country = $(
    'select[name="shipping_address[id_country]"] option:selected',
  ).val();
  var dni = $('input[name="shipping_address[dni]"]').val();
  if (type == "invoice") {
    id_country = $(
      'select[name="payment_address[id_country]"] option:selected',
    ).val();
    dni = $('input[name="payment_address[dni]"]').val();
  }
  if (dni) {
    $.ajax({
      type: "POST",
      headers: {
        "cache-control": "no-cache",
      },
      // changes done by kanishka as the URL is not found due to &
      //url: $('#module_url').val() + '&rand=' + new Date().getTime(),
      url: getURLwithTime($("#module_url").val()),
      async: true,
      cache: false,
      dataType: "json",
      data:
        "ajax=true" +
        "&method=isValidDni" +
        "&id_country=" +
        id_country +
        "&dni=" +
        dni +
        "&token=" +
        prestashop.static_token,
      beforeSend: function () {
        hideGeneralError();
        if (inline_validation == 1) {
          if (type == "delivery") {
            $('input[name="shipping_address[dni]"]').removeClass(
              "ok-form error-form",
            );
          }
          if (type == "invoice") {
            $('input[name="payment_address[dni]"]').removeClass(
              "ok-form error-form",
            );
          }
        }
      },
      complete: function () {},
      success: function (jsonData) {
        if (jsonData["error"] != undefined) {
          if (type == "delivery") {
            $('input[name="shipping_address[dni]"]')
              .parent()
              .append(
                '<span class="errorsmall">' + jsonData["error"] + "</span>",
              );
            if (inline_validation == 1)
              $('input[name="shipping_address[dni]"]').addClass("error-form");
          }
          if (type == "invoice") {
            $('input[name="payment_address[dni]"]')
              .parent()
              .append(
                '<span class="errorsmall">' + jsonData["error"] + "</span>",
              );
            if (inline_validation == 1)
              $('input[name="payment_address[dni]"]').addClass("error-form");
          }
        } else {
          if (inline_validation == 1) {
            if (type == "delivery") {
              $('input[name="shipping_address[dni]"]').addClass("ok-form");
            }
            if (type == "invoice") {
              $('input[name="payment_address[dni]"]').addClass("ok-form");
            }
          }
        }
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
        displayGeneralError(errors);
        $(".kb_velsof_sc_overlay").hide();
        $(".pay-loader").hide();
      },
    });
  }
}

function refresh() {
  if (cartRefreshURL != undefined) {
    var refreshURL = cartRefreshURL;
  } else {
    var refreshURL = $("#_desktop_cart")
      .find(".blockcart")
      .attr("data-refresh-url");
  }
  if (typeof refreshURL == "undefined") {
    var refreshURL = $("#_mobile_cart")
      .find(".blockcart")
      .attr("data-refresh-url");
  }
  if (refreshURL.trim() != "") {
    $.ajax({
      type: "POST",
      url: refreshURL,
      success: function (q) {
        var requestData = {};
        $.post(refreshURL, requestData)
          .then(function (resp) {
            $(".blockcart").replaceWith($(resp.preview).find(".blockcart"));
            if (resp.modal) {
              showModal(resp.modal);
            }
          })
          .fail(function (resp) {
            prestashop.emit("handleError", {
              eventType: "updateShoppingCart",
              resp: resp,
            });
          });
      },
    });
  }
}
function showEnlargedImage(a) {
  // Get the modal
  var modal = document.getElementById("myModal_supercheckout");

  // Get the image and insert it inside the modal - use its "alt" text as a caption
  var img = a.src;
  var modalImg = document.getElementById("img01_supercheckout");
  var captionText = document.getElementById("caption_supercheckout");

  modal.style.display = "block";
  modalImg.src = img;
  captionText.innerHTML = a.alt;

  //// Get the <span> element that closes the modal
  //    var span = document.getElementsByClassName("close_supercheckout")[0];
  //
  //// When the user clicks on <span> (x), close the modal
  //    span.onclick = function () {
  //        modal.style.display = "none";
  //    }
}
function hideEnlargedImage() {
  var modal = document.getElementById("myModal_supercheckout");
  modal.style.display = "none";
}
/*
 * Function Modified by Raghu on 21-Aug-2017 for fixing 'If we check log into shop and the enter the wrong password and click enter that the user is getting redirect to guest chekout option' issue
 * @param {type} e
 * @returns {undefined}
 */
function checkAction(e) {
  if (typeof e == "undefined" && window.event) {
    e = window.event;
  }
  if (e.keyCode == 13) {
    event.preventDefault();
    supercheckoutlogin();
  }
}

function supercheckoutlogin() {
  // changes by rishabh jain for google recaptcha integration
  var email_field_value = $('input:text[name="supercheckout_email"]').val();
  if (email_field_value == "") {
    $('input:text[name="supercheckout_email"]')
      .parent()
      .find("span.errorsmall")
      .remove();
    $('input:text[name="supercheckout_email"]').removeClass("error-form");
    $('input:text[name="supercheckout_email"]').removeClass("ok-form");
    $('input:text[name="supercheckout_email"]').addClass("error-form");
    $('input[name="supercheckout_email"]')
      .parent()
      .append('<span class="errorsmall">' + required_error + "</span>");
    return false;
  } else if (!validateEmail(email_field_value)) {
    $('input:text[name="supercheckout_email"]')
      .parent()
      .find("span.errorsmall")
      .remove();
    $('input:text[name="supercheckout_email"]').removeClass("error-form");
    $('input:text[name="supercheckout_email"]').removeClass("ok-form");
    $('input:text[name="supercheckout_email"]').addClass("error-form");
    $('input[name="supercheckout_email"]')
      .parent()
      .append('<span class="errorsmall">' + invalid_email + "</span>");
    return false;
  }
  var request_params = "";
  if ($("#g-recaptcha-response").length) {
    request_params +=
      "&g-recaptcha-response=" + $("#g-recaptcha-response").val();
  }
  // changes over
  /**
   * Start Changes to fix the issue of wrong ajax url being created
   * Checking in the url that if it already contains & or not
   * NAMar2025 ajax_url
   * @date 04-03-2025
   * @modifier Nikhil Aggarwal
   */
  let kbajaxurl = getURLwithTime($("#module_url").val());
  kbajaxurl +=
    (kbajaxurl.indexOf("?") !== -1 ? "&" : "?") + "ajax=true" + request_params;
  $.ajax({
    type: "POST",
    url: kbajaxurl,
    data: $(
      'input:text[name="supercheckout_email"], #supercheckout-login-box input',
    ),
    dataType: "json",
    beforeSend: function () {
      $(".kb_velsof_sc_overlay").show();
      $(".pay-loader").show();
      $(
        "#checkoutLogin .supercheckout-checkout-content .permanent-warning",
      ).remove();
      $(".errorsmall").remove();
    },
    complete: function () {
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
    success: function (json) {
      if (json["success"] != undefined) {
        location.href = json["success"];
      } else if (json["error"]["general"] != undefined) {
        $("#button-login").parent().find("img").hide();
        $("#checkoutLogin .supercheckout-checkout-content").html(
          '<div class="permanent-warning">' +
            json["error"]["general"] +
            "</div>",
        );
      } else {
        $("#button-login").parent().find("img").hide();
        if (json["error"]["email"] != undefined) {
          $('#checkoutLogin input:text[name="supercheckout_email"]')
            .parent()
            .append(
              '<span class="errorsmall">' + json["error"]["email"] + "</span>",
            );
          if (inline_validation == 1)
            $('#checkoutLogin input:text[name="supercheckout_email"]')
              .addClass("error-form")
              .removeClass("ok-form");
        }
        if (json["error"]["password"] != undefined) {
          $(
            '#supercheckout-login-box input:password[name="supercheckout_password"]',
          )
            .parent()
            .append(
              '<span class="errorsmall">' +
                json["error"]["password"] +
                "</span>",
            );
          if (inline_validation == 1)
            $(
              '#supercheckout-login-box input:password[name="supercheckout_password"]',
            )
              .addClass("error-form")
              .removeClass("ok-form");
        }
      }
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      $("#checkoutLogin .supercheckout-checkout-content").html(
        '<div class="permanent-warning">' + errors + "</div>",
      );
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
  });
}

function ColorLuminance(hex, lum) {
  // validate hex string
  hex = String(hex).replace(/[^0-9a-f]/gi, "");
  if (hex.length < 6) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  lum = lum || 0;

  // convert to decimal and change luminosity
  var rgb = "#",
    c,
    i;
  for (i = 0; i < 3; i++) {
    c = parseInt(hex.substr(i * 2, 2), 16);
    c = Math.round(Math.min(Math.max(0, c + c * lum), 255)).toString(16);
    rgb += ("00" + c).substr(c.length);
  }

  return rgb;
}

function subscribeCustomer(email, platform) {
  /**
   * Start Changes to fix the issue of wrong ajax url being created
   * Checking in the url that if it already contains & or not
   * NAMar2025 ajax_url
   * @date 04-03-2025
   * @modifier Nikhil Aggarwal
   */
  let kbajaxurl = getURLwithTime($("#module_url").val());
  kbajaxurl += (kbajaxurl.indexOf("?") !== -1 ? "&" : "?") + "email=" + email;
  $.ajax({
    type: "POST",
    // changes done by kanishka as the URL is not found due to &
    url: kbajaxurl,
    async: true,
    cache: false,
    dataType: "json",
    data: "ajax=true" + "&method=addEmailToList&platform=" + platform,
    beforeSend: function () {},
    success: function (jsonData) {},
  });
}

function checkCustomFieldBlocks() {
  var customFieldsContainers = $(".div_custom_fields");
  customFieldsContainers.each(function (index) {
    var divValue = $(this).html();
    if ($.trim(divValue) == "") {
      $(this).hide();
    }
  });

  //for displaying custom field accroding to seelcted profile

  if ($('input[name="profile_customers"]').length) {
    setFieldsAcctToCustomerProfile(
      $('[name="profile_customers"]:checked').val(),
    );
  }

  if ($('select[name="profile_customers"]').length) {
    setFieldsAcctToCustomerProfile($('[name="profile_customers"]').val());
  }
}

function validateName(s) {
  var reg = /^[^0-9!<>,;?=+()@#"°{}_$%:]+$/;
  return reg.test(s);
}

function validateAddress(s) {
  var reg = /^[^!<>?=+@{}_$%]+$/;
  return reg.test(s);
}

function validateCityName(s) {
  var reg = /^[^!<>;?=+@#"°{}_$%]+$/;
  return reg.test(s);
}

function validateMessage(s) {
  var reg = /^[^<>{}]+$/;
  return reg.test(s);
}

function validatePhoneNumber(s) {
  var reg = /^[+0-9. ()-]+$/;
  return reg.test(s);
}
function validateEmail(s) {
  /*var reg = unicode_hack(/^[a-z\p{L}0-9!#$%&'*+\/=?^`{}|~_-]+[.a-z\p{L}0-9!#$%&'*+\/=?^`{}|~_-]*@[a-z\p{L}0-9]+[._a-z\p{L}0-9-]*\.[a-z\p{L}0-9]+$/i, false);*/
  var reg = unicode_hack(
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/i,
    false,
  );
  return reg.test(s);
}

function validatePasswd(s) {
  return s.length >= 5 && s.length < 255;
}

function validateAddressTitle(s) {
  var reg = /^[^<>={}]+$/;
  return reg.test(s);
}

function validateOnlyNumber(s) {
  var reg = /^[a-zA-Z0-9]*$/;
  return reg.test(s);
}

var unicode_hack = (function () {
  /* Regexps to match characters in the BMP according to their Unicode category.
     Extracted from Unicode specification, version 5.0.0, source:
     http://unicode.org/versions/Unicode5.0.0/
     */
  var unicodeCategories = {
    Pi: "[\u00ab\u2018\u201b\u201c\u201f\u2039\u2e02\u2e04\u2e09\u2e0c\u2e1c]",
    Sk: "[\u005e\u0060\u00a8\u00af\u00b4\u00b8\u02c2-\u02c5\u02d2-\u02df\u02e5-\u02ed\u02ef-\u02ff\u0374\u0375\u0384\u0385\u1fbd\u1fbf-\u1fc1\u1fcd-\u1fcf\u1fdd-\u1fdf\u1fed-\u1fef\u1ffd\u1ffe\u309b\u309c\ua700-\ua716\ua720\ua721\uff3e\uff40\uffe3]",
    Sm: "[\u002b\u003c-\u003e\u007c\u007e\u00ac\u00b1\u00d7\u00f7\u03f6\u2044\u2052\u207a-\u207c\u208a-\u208c\u2140-\u2144\u214b\u2190-\u2194\u219a\u219b\u21a0\u21a3\u21a6\u21ae\u21ce\u21cf\u21d2\u21d4\u21f4-\u22ff\u2308-\u230b\u2320\u2321\u237c\u239b-\u23b3\u23dc-\u23e1\u25b7\u25c1\u25f8-\u25ff\u266f\u27c0-\u27c4\u27c7-\u27ca\u27d0-\u27e5\u27f0-\u27ff\u2900-\u2982\u2999-\u29d7\u29dc-\u29fb\u29fe-\u2aff\ufb29\ufe62\ufe64-\ufe66\uff0b\uff1c-\uff1e\uff5c\uff5e\uffe2\uffe9-\uffec]",
    So: "[\u00a6\u00a7\u00a9\u00ae\u00b0\u00b6\u0482\u060e\u060f\u06e9\u06fd\u06fe\u07f6\u09fa\u0b70\u0bf3-\u0bf8\u0bfa\u0cf1\u0cf2\u0f01-\u0f03\u0f13-\u0f17\u0f1a-\u0f1f\u0f34\u0f36\u0f38\u0fbe-\u0fc5\u0fc7-\u0fcc\u0fcf\u1360\u1390-\u1399\u1940\u19e0-\u19ff\u1b61-\u1b6a\u1b74-\u1b7c\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211e-\u2123\u2125\u2127\u2129\u212e\u213a\u213b\u214a\u214c\u214d\u2195-\u2199\u219c-\u219f\u21a1\u21a2\u21a4\u21a5\u21a7-\u21ad\u21af-\u21cd\u21d0\u21d1\u21d3\u21d5-\u21f3\u2300-\u2307\u230c-\u231f\u2322-\u2328\u232b-\u237b\u237d-\u239a\u23b4-\u23db\u23e2-\u23e7\u2400-\u2426\u2440-\u244a\u249c-\u24e9\u2500-\u25b6\u25b8-\u25c0\u25c2-\u25f7\u2600-\u266e\u2670-\u269c\u26a0-\u26b2\u2701-\u2704\u2706-\u2709\u270c-\u2727\u2729-\u274b\u274d\u274f-\u2752\u2756\u2758-\u275e\u2761-\u2767\u2794\u2798-\u27af\u27b1-\u27be\u2800-\u28ff\u2b00-\u2b1a\u2b20-\u2b23\u2ce5-\u2cea\u2e80-\u2e99\u2e9b-\u2ef3\u2f00-\u2fd5\u2ff0-\u2ffb\u3004\u3012\u3013\u3020\u3036\u3037\u303e\u303f\u3190\u3191\u3196-\u319f\u31c0-\u31cf\u3200-\u321e\u322a-\u3243\u3250\u3260-\u327f\u328a-\u32b0\u32c0-\u32fe\u3300-\u33ff\u4dc0-\u4dff\ua490-\ua4c6\ua828-\ua82b\ufdfd\uffe4\uffe8\uffed\uffee\ufffc\ufffd]",
    Po: "[\u0021-\u0023\u0025-\u0027\u002a\u002c\u002e\u002f\u003a\u003b\u003f\u0040\u005c\u00a1\u00b7\u00bf\u037e\u0387\u055a-\u055f\u0589\u05be\u05c0\u05c3\u05c6\u05f3\u05f4\u060c\u060d\u061b\u061e\u061f\u066a-\u066d\u06d4\u0700-\u070d\u07f7-\u07f9\u0964\u0965\u0970\u0df4\u0e4f\u0e5a\u0e5b\u0f04-\u0f12\u0f85\u0fd0\u0fd1\u104a-\u104f\u10fb\u1361-\u1368\u166d\u166e\u16eb-\u16ed\u1735\u1736\u17d4-\u17d6\u17d8-\u17da\u1800-\u1805\u1807-\u180a\u1944\u1945\u19de\u19df\u1a1e\u1a1f\u1b5a-\u1b60\u2016\u2017\u2020-\u2027\u2030-\u2038\u203b-\u203e\u2041-\u2043\u2047-\u2051\u2053\u2055-\u205e\u2cf9-\u2cfc\u2cfe\u2cff\u2e00\u2e01\u2e06-\u2e08\u2e0b\u2e0e-\u2e16\u3001-\u3003\u303d\u30fb\ua874-\ua877\ufe10-\ufe16\ufe19\ufe30\ufe45\ufe46\ufe49-\ufe4c\ufe50-\ufe52\ufe54-\ufe57\ufe5f-\ufe61\ufe68\ufe6a\ufe6b\uff01-\uff03\uff05-\uff07\uff0a\uff0c\uff0e\uff0f\uff1a\uff1b\uff1f\uff20\uff3c\uff61\uff64\uff65]",
    Mn: "[\u0300-\u036f\u0483-\u0486\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u0615\u064b-\u065e\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0901\u0902\u093c\u0941-\u0948\u094d\u0951-\u0954\u0962\u0963\u0981\u09bc\u09c1-\u09c4\u09cd\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a70\u0a71\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3f\u0b41-\u0b43\u0b4d\u0b56\u0b82\u0bc0\u0bcd\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0cbc\u0cbf\u0cc6\u0ccc\u0ccd\u0ce2\u0ce3\u0d41-\u0d43\u0d4d\u0dca\u0dd2-\u0dd4\u0dd6\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032\u1036\u1037\u1039\u1058\u1059\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1dc0-\u1dca\u1dfe\u1dff\u20d0-\u20dc\u20e1\u20e5-\u20ef\u302a-\u302f\u3099\u309a\ua806\ua80b\ua825\ua826\ufb1e\ufe00-\ufe0f\ufe20-\ufe23]",
    Ps: "[\u0028\u005b\u007b\u0f3a\u0f3c\u169b\u201a\u201e\u2045\u207d\u208d\u2329\u2768\u276a\u276c\u276e\u2770\u2772\u2774\u27c5\u27e6\u27e8\u27ea\u2983\u2985\u2987\u2989\u298b\u298d\u298f\u2991\u2993\u2995\u2997\u29d8\u29da\u29fc\u3008\u300a\u300c\u300e\u3010\u3014\u3016\u3018\u301a\u301d\ufd3e\ufe17\ufe35\ufe37\ufe39\ufe3b\ufe3d\ufe3f\ufe41\ufe43\ufe47\ufe59\ufe5b\ufe5d\uff08\uff3b\uff5b\uff5f\uff62]",
    Cc: "[\u0000-\u001f\u007f-\u009f]",
    Cf: "[\u00ad\u0600-\u0603\u06dd\u070f\u17b4\u17b5\u200b-\u200f\u202a-\u202e\u2060-\u2063\u206a-\u206f\ufeff\ufff9-\ufffb]",
    Ll: "[\u0061-\u007a\u00aa\u00b5\u00ba\u00df-\u00f6\u00f8-\u00ff\u0101\u0103\u0105\u0107\u0109\u010b\u010d\u010f\u0111\u0113\u0115\u0117\u0119\u011b\u011d\u011f\u0121\u0123\u0125\u0127\u0129\u012b\u012d\u012f\u0131\u0133\u0135\u0137\u0138\u013a\u013c\u013e\u0140\u0142\u0144\u0146\u0148\u0149\u014b\u014d\u014f\u0151\u0153\u0155\u0157\u0159\u015b\u015d\u015f\u0161\u0163\u0165\u0167\u0169\u016b\u016d\u016f\u0171\u0173\u0175\u0177\u017a\u017c\u017e-\u0180\u0183\u0185\u0188\u018c\u018d\u0192\u0195\u0199-\u019b\u019e\u01a1\u01a3\u01a5\u01a8\u01aa\u01ab\u01ad\u01b0\u01b4\u01b6\u01b9\u01ba\u01bd-\u01bf\u01c6\u01c9\u01cc\u01ce\u01d0\u01d2\u01d4\u01d6\u01d8\u01da\u01dc\u01dd\u01df\u01e1\u01e3\u01e5\u01e7\u01e9\u01eb\u01ed\u01ef\u01f0\u01f3\u01f5\u01f9\u01fb\u01fd\u01ff\u0201\u0203\u0205\u0207\u0209\u020b\u020d\u020f\u0211\u0213\u0215\u0217\u0219\u021b\u021d\u021f\u0221\u0223\u0225\u0227\u0229\u022b\u022d\u022f\u0231\u0233-\u0239\u023c\u023f\u0240\u0242\u0247\u0249\u024b\u024d\u024f-\u0293\u0295-\u02af\u037b-\u037d\u0390\u03ac-\u03ce\u03d0\u03d1\u03d5-\u03d7\u03d9\u03db\u03dd\u03df\u03e1\u03e3\u03e5\u03e7\u03e9\u03eb\u03ed\u03ef-\u03f3\u03f5\u03f8\u03fb\u03fc\u0430-\u045f\u0461\u0463\u0465\u0467\u0469\u046b\u046d\u046f\u0471\u0473\u0475\u0477\u0479\u047b\u047d\u047f\u0481\u048b\u048d\u048f\u0491\u0493\u0495\u0497\u0499\u049b\u049d\u049f\u04a1\u04a3\u04a5\u04a7\u04a9\u04ab\u04ad\u04af\u04b1\u04b3\u04b5\u04b7\u04b9\u04bb\u04bd\u04bf\u04c2\u04c4\u04c6\u04c8\u04ca\u04cc\u04ce\u04cf\u04d1\u04d3\u04d5\u04d7\u04d9\u04db\u04dd\u04df\u04e1\u04e3\u04e5\u04e7\u04e9\u04eb\u04ed\u04ef\u04f1\u04f3\u04f5\u04f7\u04f9\u04fb\u04fd\u04ff\u0501\u0503\u0505\u0507\u0509\u050b\u050d\u050f\u0511\u0513\u0561-\u0587\u1d00-\u1d2b\u1d62-\u1d77\u1d79-\u1d9a\u1e01\u1e03\u1e05\u1e07\u1e09\u1e0b\u1e0d\u1e0f\u1e11\u1e13\u1e15\u1e17\u1e19\u1e1b\u1e1d\u1e1f\u1e21\u1e23\u1e25\u1e27\u1e29\u1e2b\u1e2d\u1e2f\u1e31\u1e33\u1e35\u1e37\u1e39\u1e3b\u1e3d\u1e3f\u1e41\u1e43\u1e45\u1e47\u1e49\u1e4b\u1e4d\u1e4f\u1e51\u1e53\u1e55\u1e57\u1e59\u1e5b\u1e5d\u1e5f\u1e61\u1e63\u1e65\u1e67\u1e69\u1e6b\u1e6d\u1e6f\u1e71\u1e73\u1e75\u1e77\u1e79\u1e7b\u1e7d\u1e7f\u1e81\u1e83\u1e85\u1e87\u1e89\u1e8b\u1e8d\u1e8f\u1e91\u1e93\u1e95-\u1e9b\u1ea1\u1ea3\u1ea5\u1ea7\u1ea9\u1eab\u1ead\u1eaf\u1eb1\u1eb3\u1eb5\u1eb7\u1eb9\u1ebb\u1ebd\u1ebf\u1ec1\u1ec3\u1ec5\u1ec7\u1ec9\u1ecb\u1ecd\u1ecf\u1ed1\u1ed3\u1ed5\u1ed7\u1ed9\u1edb\u1edd\u1edf\u1ee1\u1ee3\u1ee5\u1ee7\u1ee9\u1eeb\u1eed\u1eef\u1ef1\u1ef3\u1ef5\u1ef7\u1ef9\u1f00-\u1f07\u1f10-\u1f15\u1f20-\u1f27\u1f30-\u1f37\u1f40-\u1f45\u1f50-\u1f57\u1f60-\u1f67\u1f70-\u1f7d\u1f80-\u1f87\u1f90-\u1f97\u1fa0-\u1fa7\u1fb0-\u1fb4\u1fb6\u1fb7\u1fbe\u1fc2-\u1fc4\u1fc6\u1fc7\u1fd0-\u1fd3\u1fd6\u1fd7\u1fe0-\u1fe7\u1ff2-\u1ff4\u1ff6\u1ff7\u2071\u207f\u210a\u210e\u210f\u2113\u212f\u2134\u2139\u213c\u213d\u2146-\u2149\u214e\u2184\u2c30-\u2c5e\u2c61\u2c65\u2c66\u2c68\u2c6a\u2c6c\u2c74\u2c76\u2c77\u2c81\u2c83\u2c85\u2c87\u2c89\u2c8b\u2c8d\u2c8f\u2c91\u2c93\u2c95\u2c97\u2c99\u2c9b\u2c9d\u2c9f\u2ca1\u2ca3\u2ca5\u2ca7\u2ca9\u2cab\u2cad\u2caf\u2cb1\u2cb3\u2cb5\u2cb7\u2cb9\u2cbb\u2cbd\u2cbf\u2cc1\u2cc3\u2cc5\u2cc7\u2cc9\u2ccb\u2ccd\u2ccf\u2cd1\u2cd3\u2cd5\u2cd7\u2cd9\u2cdb\u2cdd\u2cdf\u2ce1\u2ce3\u2ce4\u2d00-\u2d25\ufb00-\ufb06\ufb13-\ufb17\uff41-\uff5a]",
    Lm: "[\u02b0-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ee\u037a\u0559\u0640\u06e5\u06e6\u07f4\u07f5\u07fa\u0e46\u0ec6\u10fc\u17d7\u1843\u1d2c-\u1d61\u1d78\u1d9b-\u1dbf\u2090-\u2094\u2d6f\u3005\u3031-\u3035\u303b\u309d\u309e\u30fc-\u30fe\ua015\ua717-\ua71a\uff70\uff9e\uff9f]",
    Lo: "[\u01bb\u01c0-\u01c3\u0294\u05d0-\u05ea\u05f0-\u05f2\u0621-\u063a\u0641-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u076d\u0780-\u07a5\u07b1\u07ca-\u07ea\u0904-\u0939\u093d\u0950\u0958-\u0961\u097b-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d28\u0d2a-\u0d39\u0d60\u0d61\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e45\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0edc\u0edd\u0f00\u0f40-\u0f47\u0f49-\u0f6a\u0f88-\u0f8b\u1000-\u1021\u1023-\u1027\u1029\u102a\u1050-\u1055\u10d0-\u10fa\u1100-\u1159\u115f-\u11a2\u11a8-\u11f9\u1200-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u1676\u1681-\u169a\u16a0-\u16ea\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17dc\u1820-\u1842\u1844-\u1877\u1880-\u18a8\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19a9\u19c1-\u19c7\u1a00-\u1a16\u1b05-\u1b33\u1b45-\u1b4b\u2135-\u2138\u2d30-\u2d65\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3006\u303c\u3041-\u3096\u309f\u30a1-\u30fa\u30ff\u3105-\u312c\u3131-\u318e\u31a0-\u31b7\u31f0-\u31ff\u3400\u4db5\u4e00\u9fbb\ua000-\ua014\ua016-\ua48c\ua800\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\uac00\ud7a3\uf900-\ufa2d\ufa30-\ufa6a\ufa70-\ufad9\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff66-\uff6f\uff71-\uff9d\uffa0-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]",
    Co: "[\ue000\uf8ff]",
    Nd: "[\u0030-\u0039\u0660-\u0669\u06f0-\u06f9\u07c0-\u07c9\u0966-\u096f\u09e6-\u09ef\u0a66-\u0a6f\u0ae6-\u0aef\u0b66-\u0b6f\u0be6-\u0bef\u0c66-\u0c6f\u0ce6-\u0cef\u0d66-\u0d6f\u0e50-\u0e59\u0ed0-\u0ed9\u0f20-\u0f29\u1040-\u1049\u17e0-\u17e9\u1810-\u1819\u1946-\u194f\u19d0-\u19d9\u1b50-\u1b59\uff10-\uff19]",
    Lt: "[\u01c5\u01c8\u01cb\u01f2\u1f88-\u1f8f\u1f98-\u1f9f\u1fa8-\u1faf\u1fbc\u1fcc\u1ffc]",
    Lu: "[\u0041-\u005a\u00c0-\u00d6\u00d8-\u00de\u0100\u0102\u0104\u0106\u0108\u010a\u010c\u010e\u0110\u0112\u0114\u0116\u0118\u011a\u011c\u011e\u0120\u0122\u0124\u0126\u0128\u012a\u012c\u012e\u0130\u0132\u0134\u0136\u0139\u013b\u013d\u013f\u0141\u0143\u0145\u0147\u014a\u014c\u014e\u0150\u0152\u0154\u0156\u0158\u015a\u015c\u015e\u0160\u0162\u0164\u0166\u0168\u016a\u016c\u016e\u0170\u0172\u0174\u0176\u0178\u0179\u017b\u017d\u0181\u0182\u0184\u0186\u0187\u0189-\u018b\u018e-\u0191\u0193\u0194\u0196-\u0198\u019c\u019d\u019f\u01a0\u01a2\u01a4\u01a6\u01a7\u01a9\u01ac\u01ae\u01af\u01b1-\u01b3\u01b5\u01b7\u01b8\u01bc\u01c4\u01c7\u01ca\u01cd\u01cf\u01d1\u01d3\u01d5\u01d7\u01d9\u01db\u01de\u01e0\u01e2\u01e4\u01e6\u01e8\u01ea\u01ec\u01ee\u01f1\u01f4\u01f6-\u01f8\u01fa\u01fc\u01fe\u0200\u0202\u0204\u0206\u0208\u020a\u020c\u020e\u0210\u0212\u0214\u0216\u0218\u021a\u021c\u021e\u0220\u0222\u0224\u0226\u0228\u022a\u022c\u022e\u0230\u0232\u023a\u023b\u023d\u023e\u0241\u0243-\u0246\u0248\u024a\u024c\u024e\u0386\u0388-\u038a\u038c\u038e\u038f\u0391-\u03a1\u03a3-\u03ab\u03d2-\u03d4\u03d8\u03da\u03dc\u03de\u03e0\u03e2\u03e4\u03e6\u03e8\u03ea\u03ec\u03ee\u03f4\u03f7\u03f9\u03fa\u03fd-\u042f\u0460\u0462\u0464\u0466\u0468\u046a\u046c\u046e\u0470\u0472\u0474\u0476\u0478\u047a\u047c\u047e\u0480\u048a\u048c\u048e\u0490\u0492\u0494\u0496\u0498\u049a\u049c\u049e\u04a0\u04a2\u04a4\u04a6\u04a8\u04aa\u04ac\u04ae\u04b0\u04b2\u04b4\u04b6\u04b8\u04ba\u04bc\u04be\u04c0\u04c1\u04c3\u04c5\u04c7\u04c9\u04cb\u04cd\u04d0\u04d2\u04d4\u04d6\u04d8\u04da\u04dc\u04de\u04e0\u04e2\u04e4\u04e6\u04e8\u04ea\u04ec\u04ee\u04f0\u04f2\u04f4\u04f6\u04f8\u04fa\u04fc\u04fe\u0500\u0502\u0504\u0506\u0508\u050a\u050c\u050e\u0510\u0512\u0531-\u0556\u10a0-\u10c5\u1e00\u1e02\u1e04\u1e06\u1e08\u1e0a\u1e0c\u1e0e\u1e10\u1e12\u1e14\u1e16\u1e18\u1e1a\u1e1c\u1e1e\u1e20\u1e22\u1e24\u1e26\u1e28\u1e2a\u1e2c\u1e2e\u1e30\u1e32\u1e34\u1e36\u1e38\u1e3a\u1e3c\u1e3e\u1e40\u1e42\u1e44\u1e46\u1e48\u1e4a\u1e4c\u1e4e\u1e50\u1e52\u1e54\u1e56\u1e58\u1e5a\u1e5c\u1e5e\u1e60\u1e62\u1e64\u1e66\u1e68\u1e6a\u1e6c\u1e6e\u1e70\u1e72\u1e74\u1e76\u1e78\u1e7a\u1e7c\u1e7e\u1e80\u1e82\u1e84\u1e86\u1e88\u1e8a\u1e8c\u1e8e\u1e90\u1e92\u1e94\u1ea0\u1ea2\u1ea4\u1ea6\u1ea8\u1eaa\u1eac\u1eae\u1eb0\u1eb2\u1eb4\u1eb6\u1eb8\u1eba\u1ebc\u1ebe\u1ec0\u1ec2\u1ec4\u1ec6\u1ec8\u1eca\u1ecc\u1ece\u1ed0\u1ed2\u1ed4\u1ed6\u1ed8\u1eda\u1edc\u1ede\u1ee0\u1ee2\u1ee4\u1ee6\u1ee8\u1eea\u1eec\u1eee\u1ef0\u1ef2\u1ef4\u1ef6\u1ef8\u1f08-\u1f0f\u1f18-\u1f1d\u1f28-\u1f2f\u1f38-\u1f3f\u1f48-\u1f4d\u1f59\u1f5b\u1f5d\u1f5f\u1f68-\u1f6f\u1fb8-\u1fbb\u1fc8-\u1fcb\u1fd8-\u1fdb\u1fe8-\u1fec\u1ff8-\u1ffb\u2102\u2107\u210b-\u210d\u2110-\u2112\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u2130-\u2133\u213e\u213f\u2145\u2183\u2c00-\u2c2e\u2c60\u2c62-\u2c64\u2c67\u2c69\u2c6b\u2c75\u2c80\u2c82\u2c84\u2c86\u2c88\u2c8a\u2c8c\u2c8e\u2c90\u2c92\u2c94\u2c96\u2c98\u2c9a\u2c9c\u2c9e\u2ca0\u2ca2\u2ca4\u2ca6\u2ca8\u2caa\u2cac\u2cae\u2cb0\u2cb2\u2cb4\u2cb6\u2cb8\u2cba\u2cbc\u2cbe\u2cc0\u2cc2\u2cc4\u2cc6\u2cc8\u2cca\u2ccc\u2cce\u2cd0\u2cd2\u2cd4\u2cd6\u2cd8\u2cda\u2cdc\u2cde\u2ce0\u2ce2\uff21-\uff3a]",
    Cs: "[\ud800\udb7f\udb80\udbff\udc00\udfff]",
    Zl: "[\u2028]",
    Nl: "[\u16ee-\u16f0\u2160-\u2182\u3007\u3021-\u3029\u3038-\u303a]",
    Zp: "[\u2029]",
    No: "[\u00b2\u00b3\u00b9\u00bc-\u00be\u09f4-\u09f9\u0bf0-\u0bf2\u0f2a-\u0f33\u1369-\u137c\u17f0-\u17f9\u2070\u2074-\u2079\u2080-\u2089\u2153-\u215f\u2460-\u249b\u24ea-\u24ff\u2776-\u2793\u2cfd\u3192-\u3195\u3220-\u3229\u3251-\u325f\u3280-\u3289\u32b1-\u32bf]",
    Zs: "[\u0020\u00a0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000]",
    Sc: "[\u0024\u00a2-\u00a5\u060b\u09f2\u09f3\u0af1\u0bf9\u0e3f\u17db\u20a0-\u20b5\ufdfc\ufe69\uff04\uffe0\uffe1\uffe5\uffe6]",
    Pc: "[\u005f\u203f\u2040\u2054\ufe33\ufe34\ufe4d-\ufe4f\uff3f]",
    Pd: "[\u002d\u058a\u1806\u2010-\u2015\u2e17\u301c\u3030\u30a0\ufe31\ufe32\ufe58\ufe63\uff0d]",
    Pe: "[\u0029\u005d\u007d\u0f3b\u0f3d\u169c\u2046\u207e\u208e\u232a\u2769\u276b\u276d\u276f\u2771\u2773\u2775\u27c6\u27e7\u27e9\u27eb\u2984\u2986\u2988\u298a\u298c\u298e\u2990\u2992\u2994\u2996\u2998\u29d9\u29db\u29fd\u3009\u300b\u300d\u300f\u3011\u3015\u3017\u3019\u301b\u301e\u301f\ufd3f\ufe18\ufe36\ufe38\ufe3a\ufe3c\ufe3e\ufe40\ufe42\ufe44\ufe48\ufe5a\ufe5c\ufe5e\uff09\uff3d\uff5d\uff60\uff63]",
    Pf: "[\u00bb\u2019\u201d\u203a\u2e03\u2e05\u2e0a\u2e0d\u2e1d]",
    Me: "[\u0488\u0489\u06de\u20dd-\u20e0\u20e2-\u20e4]",
    Mc: "[\u0903\u093e-\u0940\u0949-\u094c\u0982\u0983\u09be-\u09c0\u09c7\u09c8\u09cb\u09cc\u09d7\u0a03\u0a3e-\u0a40\u0a83\u0abe-\u0ac0\u0ac9\u0acb\u0acc\u0b02\u0b03\u0b3e\u0b40\u0b47\u0b48\u0b4b\u0b4c\u0b57\u0bbe\u0bbf\u0bc1\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcc\u0bd7\u0c01-\u0c03\u0c41-\u0c44\u0c82\u0c83\u0cbe\u0cc0-\u0cc4\u0cc7\u0cc8\u0cca\u0ccb\u0cd5\u0cd6\u0d02\u0d03\u0d3e-\u0d40\u0d46-\u0d48\u0d4a-\u0d4c\u0d57\u0d82\u0d83\u0dcf-\u0dd1\u0dd8-\u0ddf\u0df2\u0df3\u0f3e\u0f3f\u0f7f\u102c\u1031\u1038\u1056\u1057\u17b6\u17be-\u17c5\u17c7\u17c8\u1923-\u1926\u1929-\u192b\u1930\u1931\u1933-\u1938\u19b0-\u19c0\u19c8\u19c9\u1a19-\u1a1b\u1b04\u1b35\u1b3b\u1b3d-\u1b41\u1b43\u1b44\ua802\ua823\ua824\ua827]",
  };
  /* Also supports the general category (only the first letter) */
  var firstLetters = {};
  for (var p in unicodeCategories) {
    if (firstLetters[p[0]])
      firstLetters[p[0]] =
        unicodeCategories[p].substring(0, unicodeCategories[p].length - 1) +
        firstLetters[p[0]].substring(1);
    else firstLetters[p[0]] = unicodeCategories[p];
  }
  for (var p in firstLetters) unicodeCategories[p] = firstLetters[p];

  /* Gets a regex written in a dialect that supports unicode categories and
     translates it to a dialect supported by JavaScript. */
  return function (regexpString, classes) {
    var modifiers = "";
    if (regexpString instanceof RegExp) {
      modifiers =
        (regexpString.global ? "g" : "") +
        (regexpString.ignoreCase ? "i" : "") +
        (regexpString.multiline ? "m" : "");
      regexpString = regexpString.source;
    }
    regexpString = regexpString.replace(
      /\\p\{(..?)\}/g,
      function (match, group) {
        var unicode_categorie = unicodeCategories[group];
        if (!classes)
          unicode_category = unicode_categorie.replace(/\[(.*?)\]/g, "$1");
        return unicode_category || match;
      },
    );
    return new RegExp(regexpString, modifiers);
  };
})();

function showMobileLoginPopup() {
  $("#divkbmobilelogin").dialog("open");
  mobile_option("input:radio[name=mobile_option]:checked");
}
// changes by rishabh jain to show gift message popup
/**
 * Start Changes to fix the issue with the dialog() because of jQuery
 * Commenting out #divKbgiftMessage code and adding #popup1 code
 * NANov2023 dialog_jquery
 * @date 20-11-2023
 * @modifier Nikhil Aggarwal
 */
function showGiftMessagePopup() {
  // $("#divKbgiftMessage").dialog('open');
  $("#popup1").css("visibility", "visible");
  $("#popup1").css("opacity", "1");
}
$(document).ready(function () {
  $("body").on("click", "#popup1 .close", function () {
    $("#popup1").css("visibility", "hidden");
    $("#popup1").css("opacity", "0");
    return false;
  });
});
// Changes end by Nikhil
// changes over
function mobile_option(e) {
  $(".mobile_send_otp").hide();
  $(".mobile_verify_otp").hide();
  $('input[name="supercheckout_mobile_otp"]')
    .closest(".supercheckout-extra-wrap")
    .hide();
  $("input:radio[name=password_option]")
    .closest(".supercheckout-extra-wrap")
    .hide();
  $(
    '#divkbmobilelogin :input[type="text"], #divkbmobilelogin :input[type="password"], #divkbmobilelogin :input[type="number"]',
  ).each(function () {
    $(this).val("");
  });
  if ($(e).val() == 0) {
    $("#mobile_login").closest(".supercheckout-extra-wrap").show();
    if (login_by_otp == 1) {
      $("input:radio[name=password_option]")
        .closest(".supercheckout-extra-wrap")
        .show();
    }

    $('input[name="supercheckout_mobile_firstname"]')
      .closest(".supercheckout-extra-wrap")
      .hide();
    $('input[name="supercheckout_mobile_lastname"]')
      .closest(".supercheckout-extra-wrap")
      .hide();
    $('input[name="supercheckout_mobile_email"]')
      .closest(".supercheckout-extra-wrap")
      .hide();
    $("#mobile_register").closest(".supercheckout-extra-wrap").hide();
    password_option("input:radio[name=password_option]:checked");
  } else {
    $('input[name="supercheckout_mobile_firstname"]')
      .closest(".supercheckout-extra-wrap")
      .show();
    $('input[name="supercheckout_mobile_lastname"]')
      .closest(".supercheckout-extra-wrap")
      .show();
    $('input[name="supercheckout_mobile_email"]')
      .closest(".supercheckout-extra-wrap")
      .show();
    $("#mobile_register").closest(".supercheckout-extra-wrap").show();
    $(".mobile_send_otp").show();

    $("#mobile_login").closest(".supercheckout-extra-wrap").hide();
    $('input[name="supercheckout_mobile_Password"]')
      .closest(".supercheckout-extra-wrap")
      .show();
  }
}

function password_option(e) {
  if ($("input:radio[name=mobile_option]:checked").val() == 0) {
    $("#mobile_otp").val("");
    if (login_by_otp == 1) {
      if ($(e).val() == 0) {
        $('input[name="supercheckout_mobile_Password"]')
          .closest(".supercheckout-extra-wrap")
          .show();
        $('input[name="supercheckout_mobile_otp"]')
          .closest(".supercheckout-extra-wrap")
          .hide();
        $(".mobile_send_otp").hide();
      } else {
        $('input[name="supercheckout_mobile_Password"]')
          .closest(".supercheckout-extra-wrap")
          .hide();
        $('input[name="supercheckout_mobile_otp"]')
          .closest(".supercheckout-extra-wrap")
          .show();
        $(".mobile_send_otp").show();
      }
    }
  }
}

function MobileLogin() {
  var kbMobileNumber = $.trim($("#mobile_number").val());
  var kbCountryId = $.trim($('select[name="mobile_country"]').val());
  var kbPassword = $.trim($("#mobile_Password").val());
  var kbCurrentOTP = $.trim($("#mobile_otp").val());

  if ($("input:radio[name=password_option]:checked").val() == 0) {
    if (kbMobileNumber != "" && kbCountryId != "" && kbPassword != "") {
      $.ajax({
        url: kbmobile_front_url,
        type: "post",
        data: {
          ajax: true,
          method: "supercheckouLoginByPassword",
          kbMobileNumber: kbMobileNumber,
          kbCountryId: kbCountryId,
          kbPassword: kbPassword,
        },
        dataType: "json",
        beforeSend: function () {
          $(".kb_velsof_sc_overlay").show();
          $(".pay-loader").show();
        },
        complete: function () {
          $(".kb_velsof_sc_overlay").hide();
          $(".pay-loader").hide();
        },
        success: function (json) {
          if (json.success) {
            $("#divkbmobilelogin").dialog("close");
            location.reload();
          } else {
            $.gritter.add({
              title: notification_title,
              text: json.message,
              class_name: "gritter-warning",
              sticky: false,
              time: "3000",
            });
          }
        },
      });
    } else {
      $.gritter.add({
        title: notification_title,
        text: kb_input_error_msg,
        class_name: "gritter-warning",
        sticky: false,
        time: "3000",
      });
    }
  } else {
    if (kbMobileNumber != "" && kbCountryId != "" && kbCurrentOTP != "") {
      $.ajax({
        url: kbmobile_front_url,
        type: "post",
        data: {
          ajax: true,
          method: "supercheckouLoginByOTP",
          kbMobileNumber: kbMobileNumber,
          kbCountryId: kbCountryId,
          kbCurrentOTP: kbCurrentOTP,
        },
        dataType: "json",
        beforeSend: function () {
          $(".kb_velsof_sc_overlay").show();
          $(".pay-loader").show();
        },
        complete: function () {
          $(".kb_velsof_sc_overlay").hide();
          $(".pay-loader").hide();
        },
        success: function (json) {
          if (json.success) {
            $("#divkbmobilelogin").dialog("close");
            location.reload();
          } else {
            $.gritter.add({
              title: notification_title,
              text: json.message,
              class_name: "gritter-warning",
              sticky: false,
              time: "3000",
            });
          }
        },
      });
    } else {
      $.gritter.add({
        title: notification_title,
        text: kb_input_error_msg,
        class_name: "gritter-warning",
        sticky: false,
        time: "3000",
      });
    }
  }
}

function sendOtp() {
  var kbMobileNumber = $.trim($("#mobile_number").val());
  var kbCountryId = $.trim($('select[name="mobile_country"]').val());
  if (true) {
    if (kbMobileNumber != "" && kbCountryId != "") {
      $.ajax({
        url: kbmobile_front_url,
        type: "post",
        data: {
          ajax: true,
          method: "sendOTP",
          kbMobileNumber: kbMobileNumber,
          kbCountryId: kbCountryId,
        },
        dataType: "json",
        beforeSend: function () {
          $(".kb_velsof_sc_overlay").show();
          $(".pay-loader").show();
        },
        complete: function () {
          $(".kb_velsof_sc_overlay").hide();
          $(".pay-loader").hide();
        },
        success: function (json) {
          if (json.success) {
            if ($("input:radio[name=mobile_option]:checked").val() == 1) {
              $(".mobile_verify_otp").show();
            }
            $('input[name="supercheckout_mobile_otp"]').val("");
            $('input[name="supercheckout_mobile_otp"]')
              .closest(".supercheckout-extra-wrap")
              .show();
            $.gritter.add({
              title: notification_title,
              text: json.message,
              class_name: "gritter-success",
              sticky: false,
              time: "3000",
            });
          } else {
            $.gritter.add({
              title: notification_title,
              text: json.message,
              class_name: "gritter-warning",
              sticky: false,
              time: "3000",
            });
          }
        },
      });
    } else {
      $.gritter.add({
        title: notification_title,
        text: kb_input_error_msg,
        class_name: "gritter-warning",
        sticky: false,
        time: "3000",
      });
    }
  }
}

function checkMobileNumberExist() {
  var kbMobileNumber = $.trim($("#mobile_number").val());
  var kbCountryId = $.trim($('select[name="mobile_country"]').val());
  if ($("input:radio[name=mobile_option]:checked").val() == 1) {
    if (kbMobileNumber != "" && kbCountryId != "") {
      $.ajax({
        url: kbmobile_front_url,
        type: "post",
        data: {
          ajax: true,
          method: "checkMobileNumberExist",
          kbMobileNumber: kbMobileNumber,
          currentCustomerId: "",
          kbCountryId: kbCountryId,
        },
        dataType: "json",
        async: false,
        beforeSend: function () {
          $(".kb_velsof_sc_overlay").show();
          $(".pay-loader").show();
        },
        complete: function () {
          $(".kb_velsof_sc_overlay").hide();
          $(".pay-loader").hide();
        },
        success: function (json) {
          if (json) {
            $.gritter.add({
              title: notification_title,
              text: "Mobile Number already used with some other account.",
              class_name: "gritter-warning",
              sticky: false,
              time: "3000",
            });
            $("#mobile_register").closest(".supercheckout-extra-wrap").hide();
            $(".mobile_send_otp").hide();
            $(".mobile_verify_otp").hide();
            $('input[name="supercheckout_mobile_otp"]')
              .closest(".supercheckout-extra-wrap")
              .hide();
          } else {
            $("#mobile_register").closest(".supercheckout-extra-wrap").show();
            $(".mobile_send_otp").show();
          }
        },
      });
    } else {
      $("#mobile_register").closest(".supercheckout-extra-wrap").show();
    }
  }
}

function MobileRegister() {
  var kbMobileNumber = $.trim($("#mobile_number").val());
  var kbCountryId = $.trim($('select[name="mobile_country"]').val());
  var kbPassword = $.trim($("#mobile_Password").val());
  var kbFirstName = $.trim($("#mobile_firstname").val());
  var kbLastName = $.trim($("#mobile_lastname").val());
  var kbEmail = $.trim($("#mobile_email").val());
  //start by dharmanshu for the supercheckout compatiblity related to email 1-7-2021
  if (email_require == 1 && kbLastName == "") {
    $.gritter.add({
      title: notification_title,
      text: kb_input_error_msg,
      class_name: "gritter-warning",
      sticky: false,
      time: "3000",
    });
    return false;
  } else {
    kbEmail = "";
  }
  //end by dharmanshu for the supercheckout compatiblity related to email 1-7-2021
  if (
    kbMobileNumber != "" &&
    kbCountryId != "" &&
    kbPassword != "" &&
    kbFirstName != "" &&
    kbLastName != ""
  ) {
    if (true) {
      $.ajax({
        url: kbmobile_front_url,
        type: "post",
        data: {
          ajax: true,
          method: "supercheckouRegisterAccount",
          kbMobileNumber: kbMobileNumber,
          kbCountryId: kbCountryId,
          kbPassword: kbPassword,
          kbFirstName: kbFirstName,
          kbLastName: kbLastName,
          kbEmail: kbEmail,
        },
        dataType: "json",
        beforeSend: function () {
          $(".kb_velsof_sc_overlay").show();
          $(".pay-loader").show();
        },
        complete: function () {
          $(".kb_velsof_sc_overlay").hide();
          $(".pay-loader").hide();
        },
        success: function (json) {
          if (json.success) {
            $("#divkbmobilelogin").dialog("close");
            location.reload();
          } else {
            $.gritter.add({
              title: notification_title,
              text: json.message,
              class_name: "gritter-warning",
              sticky: false,
              time: "3000",
            });
          }
        },
      });
    }
  } else {
    $.gritter.add({
      title: notification_title,
      text: kb_input_error_msg,
      class_name: "gritter-warning",
      sticky: false,
      time: "3000",
    });
  }
}

function verfyOtp() {
  var kbMobileNumber = $.trim($("#mobile_number").val());
  var kbCountryId = $.trim($('select[name="mobile_country"]').val());
  var kbCurrentOTP = $.trim($("#mobile_otp").val());
  if (kbMobileNumber != "" && kbCountryId != "" && kbCurrentOTP != "") {
    $.ajax({
      url: kbmobile_front_url,
      type: "post",
      data: {
        ajax: true,
        method: "verifyOTP",
        kbMobileNumber: kbMobileNumber,
        kbCountryId: kbCountryId,
        kbCurrentOTP: kbCurrentOTP,
      },
      dataType: "json",
      beforeSend: function () {
        $(".kb_velsof_sc_overlay").show();
        $(".pay-loader").show();
      },
      success: function (json) {
        if (json.success) {
          $.gritter.add({
            title: notification_title,
            text: json.message,
            class_name: "gritter-success",
            sticky: false,
            time: "3000",
          });
          $(".mobile_send_otp").hide();
          $(".mobile_verify_otp").hide();
          $('input[name="supercheckout_mobile_otp"]')
            .closest(".supercheckout-extra-wrap")
            .hide();
          $("#mobile_otp").val("");
        } else {
          $.gritter.add({
            title: notification_title,
            text: json.message,
            class_name: "gritter-warning",
            sticky: false,
            time: "3000",
          });
        }
      },
      complete: function () {
        $(".kb_velsof_sc_overlay").hide();
        $(".pay-loader").hide();
      },
    });
  } else {
    $.gritter.add({
      title: notification_title,
      text: kb_input_error_msg,
      class_name: "gritter-warning",
      sticky: false,
      time: "3000",
    });
  }
}

/*
 * Code added by Anshul for adding update & remove address -->
 */

function updateAddressForm(address_type) {
  $("#shipping-address-existing").trigger("click");
  $("#shipping-address-existing").parent().addClass("checked");
  $("#shipping-address-new").parent().removeClass("checked");
  var selected_address_id = "";
  if (address_type == "delivery") {
    selected_address_id = $(
      '#shipping-existing select[name="shipping_address_id"]',
    ).val();
  } else if (address_type == "invoice") {
    selected_address_id = $(
      '#payment-existing select[name="payment_address_id"]',
    ).val();
  }
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    // changes done by kanishka as the URL is not found due to &
    //url: $('#module_url').val() + '&rand=' + new Date().getTime(),
    url: getURLwithTime($("#module_url").val()),
    async: true,
    cache: false,
    dataType: "html",
    data:
      "ajax=true&method=getAddressFormToUpdate&address_type=" +
      address_type +
      "&selected_address_id=" +
      selected_address_id,
    beforeSend: function () {
      $(".kb_velsof_sc_overlay").show();
      $(".pay-loader").show();
    },
    complete: function () {
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
    success: function (jsonData) {
      if (
        address_type == "delivery" &&
        $("#checkoutShippingAddress .shipping_update_form").length == 0
      ) {
        $(jsonData).insertAfter($("#shipping-existing"));
        showSelectedState(
          $(
            '#checkoutShippingAddress .shipping_update_form select[name="shipping_address[id_country]"]',
          ).val(),
          address_type,
        );
        checkDniandVatNumber("delivery");
        $('select[name="shipping_address[id_country]"]').change(function () {
          var selected_country = $(this).find("option:selected").attr("value");
          var selected_state = 0;
          statelist(
            selected_country,
            selected_state,
            'select[name="shipping_address[id_state]"]',
          );
          checkDniandVatNumber("delivery");
          if (
            $('input[name="shipping_address[postcode]"]').length &&
            $('input[name="shipping_address[postcode]"]').val() != ""
          ) {
            checkZipCode(this, true);
          } else {
            loadCarriers();
          }
        });
        applyInlineValidation(); //apply inline validation
        $('input[name="shipping_address[postcode]"]').on("blur", function () {
          checkZipCode(this, true);
        });

        $("#supercheckout_update_address_shipping").click(function () {
          $("#shipping-new").insertAfter($("#velsof_supercheckout_form"));
          $("#shipping-new").hide();
          if (
            $(".payment_update_form").length ||
            $("#supercheckout_update_address_button_payment").length
          ) {
            $(".payment_update_form").remove();
            $("#supercheckout_update_address_button_payment").remove();
          }
          saveAddress();
        });
      } else if (
        address_type == "invoice" &&
        $("#checkoutBillingAddress .payment_update_form").length == 0
      ) {
        $(jsonData).insertAfter($("#payment-existing"));
        showSelectedState(
          $(
            '#checkoutBillingAddress .payment_update_form select[name="payment_address[id_country]"]',
          ).val(),
          address_type,
        );
        checkDniandVatNumber("invoice");
        $('select[name="payment_address[id_country]"]').change(function () {
          var selected_country = $(this).find("option:selected").attr("value");
          var selected_state = 0;
          statelist(
            selected_country,
            selected_state,
            'select[name="payment_address[id_state]"]',
          );
          checkDniandVatNumber("invoice");
          if (
            $('input[name="payment_address[postcode]"]').length &&
            $('input[name="payment_address[postcode]"]').val() != ""
          ) {
            checkZipCode(this, true);
          } else {
            loadCarriers();
          }
        });
        applyInlineValidation(); //apply inline validation
        $('input[name="payment_address[postcode]"]').on("blur", function () {
          checkZipCode(this, false);
        });

        $("#supercheckout_update_address_payment").click(function () {
          $("#payment-new").insertAfter($("#velsof_supercheckout_form"));
          $("#payment-new").hide();
          if (
            $(".shipping_update_form").length ||
            $("#supercheckout_update_address_button").length
          ) {
            $(".shipping_update_form").remove();
            $("#supercheckout_update_address_button").remove();
          }
          saveAddress();
        });
      }
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      $("#supercheckout-empty-page-content").html(
        '<div class="permanent-warning">' + "issues" + "</div>",
      );
    },
  });
}

function showSelectedState(id_country, address_type) {
  if (address_type == "delivery") {
    //        console.log(id_country);
    statelist(
      id_country,
      0,
      '.shipping_update_form select[name="shipping_address[id_state]"]',
    );
    var selected_state_id = $(
      ".shipping_update_form #shipping_saved_state",
    ).val();
    $(
      '.shipping_update_form select[name="shipping_address[id_state]"] option[value="' +
        selected_state_id +
        '"]',
    ).prop("selected", true);
  } else {
    statelist(
      id_country,
      0,
      '.payment_update_form select[name="payment_address[id_state]"]',
    );
    var selected_state_id = $(
      ".payment_update_form #payment_saved_state",
    ).val();
    $(
      '.payment_update_form select[name="payment_address[id_state]"] option[value="' +
        selected_state_id +
        '"]',
    ).prop("selected", true);
  }
}

/*
 * Code added by Anshul for adding update & remove address -->
 */

function deleteAddressForm(address_type) {
  var selected_address_id = "";
  if (address_type == "delivery") {
    selected_address_id = $(
      '#shipping-existing select[name="shipping_address_id"]',
    ).val();
  } else if (address_type == "invoice") {
    selected_address_id = $(
      '#payment-existing select[name="payment_address_id"]',
    ).val();
  }

  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    // changes done by kanishka as the URL is not found due to &
    //url: $('#module_url').val() + '&rand=' + new Date().getTime(),
    url: getURLwithTime($("#module_url").val()),
    async: true,
    cache: false,
    dataType: "json",
    data:
      "ajax=true&method=deleteAddress&address_type=" +
      address_type +
      "&selected_address_id=" +
      selected_address_id,
    beforeSend: function () {
      $(".kb_velsof_sc_overlay").show();
      $(".pay-loader").show();
    },
    complete: function () {
      $(".kb_velsof_sc_overlay").hide();
      $(".pay-loader").hide();
    },
    success: function (jsonData) {
      if (jsonData["status"] == 1) {
        $.gritter.add({
          title: notification_title,
          text: jsonData["msg"],
          class_name: "gritter-success",
          sticky: false,
          time: "3000",
        });

        /*To remove the deleted address from the list on the checkout page*/
        if (address_type == "delivery") {
          if (
            $(
              'select[name="shipping_address_id"] option[value="' +
                selected_address_id +
                '"]',
            ).length
          ) {
            $(
              'select[name="shipping_address_id"] option[value="' +
                selected_address_id +
                '"]',
            ).remove();
            if (
              $(
                '#shipping-existing select[name="shipping_address_id"]',
              ).val() == null
            ) {
              location.reload();
            }
            $('#shipping-existing select[name="shipping_address_id"]').trigger(
              "change",
            );
          } else {
          }
        } else if (address_type == "invoice") {
          if (
            $(
              'select[name="payment_address_id"] option[value="' +
                selected_address_id +
                '"]',
            ).length
          ) {
            $(
              'select[name="payment_address_id"] option[value="' +
                selected_address_id +
                '"]',
            ).remove();
            if (
              $('#payment-existing select[name="payment_address_id"]').val() ==
              null
            ) {
              location.reload();
            }
            $('#payment-existing select[name="payment_address_id"]').trigger(
              "change",
            );
          } else {
          }
        }
      } else if (jsonData["error_occured"] == 1) {
        $.gritter.add({
          title: notification_title,
          text: jsonData["error"],
          class_name: "gritter-warning",
          sticky: false,
          time: "3000",
        });
      }
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      $("#supercheckout-empty-page-content").html(
        '<div class="permanent-warning">' + "issues" + "</div>",
      );
    },
  });
}

/*
 * Added by Anshul for COD With Fee compatibility
 */
/** Start Changes to add the Payment Fee on Checkout
 * Below function updated the payment fee and the order total in the totals block as per the selected payment method
 * @date 15-10-2024
 * NAOct2024 payment_fee
 * @modifier Nikhil Aggarwal
 */

function kbchangePaymentMethodFee() {
  $("#kbpayment-fee-cart").remove();
  var kbselectedPaymentMethod = $(
    'input:radio[name="payment-option"]:checked',
  ).val();
  var kbselectedPaymentMethodElement = $(
    "#kb_payment_fee_" + kbselectedPaymentMethod,
  );
  var kbselectedPaymentMethodFee = kbselectedPaymentMethodElement.val();
  var kbselectedPaymentMethodStatus = $(
    "#kb_payment_fee_status_" + kbselectedPaymentMethod,
  );
  var kbselectedPaymentMethodTOtal = $("#total_price_wfee").val();
  var kbselectedPaymentMethodText = $(
    "#kb_payment_fee_text_" + kbselectedPaymentMethod,
  ).val();
  var kbselectedPaymentMethodApplicableFee = $(
    "#kb_payment_fee_applicable_" + kbselectedPaymentMethod,
  ).val();
  var kbstorecurrency = $("#kb_payment_fee_currency").val();
  if (
    kbselectedPaymentMethodStatus.val() == "1" &&
    kbselectedPaymentMethodApplicableFee != "0"
  ) {
    /*
     * Format payment fee for consistency with cart totals
     * @modifier Himanshu Vishwakarma
     * @date 10-02-2026
     */
    var feeNum =
      parseFloat(
        String(kbselectedPaymentMethodFee || "")
          .replace(/[^\d.,-]/g, "")
          .replace(",", "."),
      ) || 0;
    var feeFormatted = (kbstorecurrency || "") + " " + feeNum.toFixed(2);
    var total_html =
      '<tr id="kbpayment-fee-cart"><td class="title" colspan="5"> ' +
      kbselectedPaymentMethodText +
      ' </td><td class="value"><span class="price"> ' +
      feeFormatted +
      "</span></td></tr>";
    //Update totals when payment fee is applied; never set same value to both tax excl/incl
    var fee = parseFloat(kbselectedPaymentMethodApplicableFee) || 0;
    var hasDualSpans =
      $("#total_price_excl").length && $("#total_price_incl").length;

    if (hasDualSpans) {
      //Dual layout: update tax excl and tax incl separately so they stay different
      var exclBase, inclBase;
      var parsePrice = function (str) {
        if (!str) return 0;
        return (
          parseFloat(
            String(str)
              .replace(/[^\d.,-]/g, "")
              .replace(",", "."),
          ) || 0
        );
      };
      if (
        $("#total_price_wfee_exclusive").length &&
        $("#total_price_wfee_inclusive").length
      ) {
        exclBase = parsePrice($("#total_price_wfee_exclusive").val());
        inclBase = parsePrice($("#total_price_wfee_inclusive").val());
      } else {
        /* After cart refresh hidden fields may be missing; use current span values */
        exclBase = parsePrice($("#total_price_excl").text());
        inclBase = parsePrice($("#total_price_incl").text());
      }
      $("#total_price_excl").html(
        kbstorecurrency + (exclBase + fee).toFixed(2),
      );
      $("#total_price_incl").html(
        kbstorecurrency + (inclBase + fee).toFixed(2),
      );
    } else if (typeof kbselectedPaymentMethodTOtal !== "undefined") {
      /*
       * Single total layout: apply payment fee on one total element
       * 10-02-2026
       */
      $(".amountMoney").html(
        kbstorecurrency +
          (
            parseFloat(kbselectedPaymentMethodTOtal) +
            parseFloat(kbselectedPaymentMethodApplicableFee)
          ).toFixed(2),
      );
    }
    $(".supercheckout-totals").prepend(total_html);
  } else {
    /*
     * Restore original totals when payment fee is not applied; keep tax excl/incl distinct
     * @modifier Himanshu Vishwakarma
     * @date 10-02-2026
     */
    if (
      $("#total_price_excl").length &&
      $("#total_price_incl").length &&
      $("#total_price_wfee_exclusive").length &&
      $("#total_price_wfee_inclusive").length
    ) {
      /*
       * Parse numeric value from hidden field for display; currency is prepended so totals always show currency when payment fee is not configured
       * 23-02-2025
       */
      var parsePriceRestore = function (str) {
        if (!str) return "0";
        var n = parseFloat(
          String(str)
            .replace(/[^\d.,-]/g, "")
            .replace(",", "."),
        );
        return isNaN(n) ? "0" : n.toFixed(2);
      };
      var exclNum = parsePriceRestore($("#total_price_wfee_exclusive").val());
      var inclNum = parsePriceRestore($("#total_price_wfee_inclusive").val());
      $("#total_price_excl").html((kbstorecurrency || "") + exclNum);
      $("#total_price_incl").html((kbstorecurrency || "") + inclNum);
    } else if (
      $("#total_price_wfee").length &&
      !$("#total_price_excl").length
    ) {
      /*
       * Single total layout: restore total with currency so currency displays when payment fee is not configured
       * 23-02-2025
       */
      var total_price = $("#total_price_wfee").val();
      // $(".amountMoney").html((kbstorecurrency || "") + " " + total_price);
      $(".amountMoney").html(total_price);
    }
  }
}
// Changes end by Nikhil
function changeCODPaymentMethodFeeCartNew() {
  var payment_module_name = $(
    'input:radio[name="payment-option"]:checked',
  ).attr("data-module-name");
  if (payment_module_name == "kbcodwithfee") {
    var payment_method_value = $(
      'input:radio[name="payment-option"]:checked',
    ).val();
    //var fee_amount = $('.' + payment_method_value + '_info_container').find(".total_fee_fee_profile").val();
    //var total_amount = $('.' + payment_method_value + '_info_container').find(".total_amount_fee_profile").val();
    var fee_amount = $("#pay-with-" + payment_method_value + "-form")
      .find(".total_fee_fee_profile")
      .val();
    var total_amount = $("#pay-with-" + payment_method_value + "-form")
      .find(".total_amount_fee_profile")
      .val();
    $("#payment-fee-cart").remove();
    /*
     * Format COD fee with currency on the right for consistency with cart totals
     * 10-02-2026
     */
    var codFeeNum =
      parseFloat(
        String(fee_amount || "")
          .replace(/[^\d.,-]/g, "")
          .replace(",", "."),
      ) || 0;
    var codCurrency = $("#kb_payment_fee_currency").val() || "";
    var codFeeFormatted = codCurrency + codFeeNum.toFixed(2);
    var total_html =
      '<tr id="payment-fee-cart"><td class="title" colspan="5"> ' +
      COD_FEE +
      ' </td><td class="value"><span class="price"> ' +
      codFeeFormatted +
      "</span></td></tr>"; // Code modified by Priyanshu on 07-April-2018
    $(".supercheckout-totals").prepend(total_html);
    /*
     * Update tax excl/incl separately when dual total layout exists to avoid both showing same amount
     * @modifier Himanshu Vishwakarma
     * @date 10-02-2026
     */
    if ($("#total_price_excl").length && $("#total_price_incl").length) {
      var codFee = parseFloat(fee_amount) || 0;
      var currency = $("#kb_payment_fee_currency").val() || "";
      var parsePriceCod = function (str) {
        if (!str) return 0;
        return (
          parseFloat(
            String(str)
              .replace(/[^\d.,-]/g, "")
              .replace(",", "."),
          ) || 0
        );
      };
      if (
        $("#total_price_wfee_exclusive").length &&
        $("#total_price_wfee_inclusive").length
      ) {
        var codExclBase = parsePriceCod($("#total_price_wfee_exclusive").val());
        var codInclBase = parsePriceCod($("#total_price_wfee_inclusive").val());
        $("#total_price_excl").html(
          currency + " " + (codExclBase + codFee).toFixed(2),
        );
        $("#total_price_incl").html(
          currency + " " + (codInclBase + codFee).toFixed(2),
        );
      } else {
        var codExclBase = parsePriceCod($("#total_price_excl").text());
        var codInclBase = parsePriceCod($("#total_price_incl").text());
        $("#total_price_excl").html(
          currency + " " + (codExclBase + codFee).toFixed(2),
        );
        $("#total_price_incl").html(
          currency + " " + (codInclBase + codFee).toFixed(2),
        );
      }
    } else {
      $(".amountMoney").html(total_amount);
    }
  } else {
    $("#payment-fee-cart").remove();
    if (
      $("#total_price_excl").length &&
      $("#total_price_incl").length &&
      $("#total_price_wfee_exclusive").length &&
      $("#total_price_wfee_inclusive").length
    ) {
      var currency = $("#kb_payment_fee_currency").val() || "";
      $("#total_price_excl").html(
        currency + " " + ($("#total_price_wfee_exclusive").val() || 0),
      );
      $("#total_price_incl").html(
        currency + " " + ($("#total_price_wfee_inclusive").val() || 0),
      );
    } else if (
      $("#total_price_wfee").length &&
      !$("#total_price_excl").length
    ) {
      var total_price = $("#total_price_wfee").val();
      $(".amountMoney").html(
        ($("#kb_payment_fee_currency").val() || "") + " " + total_price,
      );
    }
  }
}

//Function added by Anshul to send ajax on server to update the checkout behavior data (Feature: Checkout Behavior (Jan 2020))
function updateCheckoutBehaviour(field, is_filled, use_for_invoice_val) {
  $.ajax({
    type: "POST",
    headers: {
      "cache-control": "no-cache",
    },
    url: getURLwithTime($("#module_url").val()),
    async: true,
    cache: false,
    dataType: "json",
    data: {
      ajax: true,
      method: "updateCheckoutBehaviour",
      field_name: field,
      filled: is_filled,
      use_for_invoice: use_for_invoice_val,
    },
    beforeSend: function () {},
    complete: function () {},
    success: function (jsonData) {},
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      var errors = sprintf(ajaxRequestFailedMsg, XMLHttpRequest, textStatus);
      $("#shipping_method_update_warning").html(
        '<div class="permanent-warning">' + errors + "</div>",
      );
    },
  });
}
/**
 * Start Changes to fix the issue of showing default payment method to be shown as selected on page reload
 * Marking the payment method checked by using the payment_method cookie
 * NASep2023 payment_method_cookie
 * @date 26-09-2023
 * @modifier Nikhil Aggarwal
 */
function getCookie(name) {
  var dc = document.cookie;
  var prefix = name + "=";
  var begin = dc.indexOf("; " + prefix);
  if (begin == -1) {
    begin = dc.indexOf(prefix);
    if (begin != 0) return null;
  } else {
    begin += 2;
    var end = document.cookie.indexOf(";", begin);
    if (end == -1) {
      end = dc.length;
    }
  }
  return decodeURI(dc.substring(begin + prefix.length, end));
}

function setCookie(cookie_name, cookie_value) {
  date = new Date();
  if (
    cookie_name == "velsof_exitpopup_used" ||
    cookie_name == "exitpopupmob" ||
    cookie_name == "velsof_exitpopup_used_entry" ||
    cookie_name == "exitpopupmob_entry"
  ) {
    date.setTime(date.getTime() + 24 * 60 * 60 * 1000 * parseInt(days_exipre));
  } else if (
    cookie_name == "velsof_newexitpopup_tab_entry" ||
    cookie_name == "velsof_newexitpopup_tab_exit"
  ) {
    date.setTime(
      date.getTime() + 24 * 60 * 60 * 1000 * parseInt(show_after_close),
    );
  } else {
    date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
  }
  expires = "; expires=" + date.toUTCString();
  document.cookie = cookie_name + "=" + cookie_value + expires + "; path=/";
}
// Changes end by Nikhil
function updateaddress() {
  var payment_module_name = $(
    'input:radio[name="payment-option"]:checked',
  ).attr("data-module-name");

  if (payment_module_name == "ps_checkout-paypal") {
    if (checkValidation() == 0) {
      KbsaveAddress();
    }
  }
}

function setFieldsAcctToCustomerProfile(id_profile) {
  var profile_data = kb_customer_profiles[id_profile];
  if (profile_data) {
    for (var i in profile_data["shipping_address"]) {
      if (
        $(
          '[name="shipping_address[' +
            profile_data["shipping_address"][i]["id"] +
            ']"]',
        ).length
      ) {
        var field = $(
          '[name="shipping_address[' +
            profile_data["shipping_address"][i]["id"] +
            ']"]',
        );
        if (profile_data["shipping_address"][i]["logged"]["display"] == 1) {
          field.parent().parent().show();
          if (profile_data["shipping_address"][i]["logged"]["require"] == 1) {
            field
              .parent()
              .find(".supercheckout-required")
              .css("display", "inline");
          } else {
            field
              .parent()
              .find(".supercheckout-required")
              .css("display", "none");
          }
        } else {
          field.parent().parent().hide();
        }
      }
    }

    for (var i in profile_data["payment_address"]) {
      if (
        $(
          '[name="payment_address[' +
            profile_data["payment_address"][i]["id"] +
            ']"]',
        ).length
      ) {
        var field = $(
          '[name="payment_address[' +
            profile_data["payment_address"][i]["id"] +
            ']"]',
        );
        if (profile_data["payment_address"][i]["logged"]["display"] == 1) {
          field.parent().parent().show();
          if (profile_data["payment_address"][i]["logged"]["require"] == 1) {
            field
              .parent()
              .find(".supercheckout-required")
              .css("display", "inline");
          } else {
            field
              .parent()
              .find(".supercheckout-required")
              .css("display", "none");
          }
        } else {
          field.parent().parent().hide();
        }
      }
    }

    /*
     * Hide/show custom fields per customer profile on all blocks
     * - Works for textbox/textarea/select, radio, and checkbox types
     * - Compatible with PS 1.7/8 and PS 9
     * 26-02-2026
     */
    var checker = 0;
    var allProfileBlocks = $(".div_custom_fields .supercheckout-blocks").not(
      $("#registration_custom_fields_block .supercheckout-blocks"),
    );
    allProfileBlocks.hide();
    for (var i in profile_data["custom_fields"]) {
      if (profile_data["custom_fields"][i] != 1) {
        continue;
      }
      var fieldBlocks = allProfileBlocks.filter(function () {
        return (
          $(this).find('[name^="custom_fields[field_' + i + ']"]').length > 0
        );
      });
      if (fieldBlocks.length) {
        fieldBlocks.show();
        checker = 1;
      }
    }
    if (checker == 0) {
      allProfileBlocks.hide();
    }
  }
}

/*
 * @author - Vishal
 * DOC - 17/02/20
 * For adding calender for all languages
 */
var date_trans_data = {
  en: {
    monthNames: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    monthNamesShort: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    dayNames: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    dayNamesMin: ["S", "M", "T", "W", "T", "F", "S"],
  },
  gb: {
    monthNames: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    monthNamesShort: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    dayNames: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    dayNamesMin: ["S", "M", "T", "W", "T", "F", "S"],
  },
  fr: {
    monthNames: [
      "Janvier",
      "F&eacute;rier",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Ao&eacute;t",
      "Septembre",
      "Octobre",
      "Novembre",
      "D&eacute;cembre",
    ],
    monthNamesShort: [
      "Jan",
      "Fev",
      "Mar",
      "Avr",
      "Mai",
      "Jui",
      "Jul",
      "Aou",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    dayNames: [
      "Dimanche",
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
    ],
    dayNamesShort: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
    dayNamesMin: ["D", "L", "Ma", "Me", "J", "V", "S", "D"],
  },
  bg: {
    monthNames: [
      "Януари",
      "Февруари",
      "Март",
      "пприл",
      "Май",
      "Юни",
      "Юли",
      "пвгуѿт",
      "Септември",
      "Октомври",
      "поември",
      "Декември",
    ],
    monthNamesShort: [
      "Яну",
      "Фев",
      "Мар",
      "ппр",
      "Май",
      "Юни",
      "Юли",
      "пвг",
      "Сеп",
      "Окт",
      "пов",
      "Дек",
    ],
    dayNames: [
      "педелѿ",
      "Понеделник",
      "Вторник",
      "Срѿда",
      "Четвъртък",
      "Петък",
      "Събота",
    ],
    dayNamesShort: ["пед", "Пон", "Вто", "Срѿ", "Чет", "Пет", "Съб"],
    dayNamesMin: ["пе", "По", "Вт", "Ср", "Че", "Пе", "Съ"],
  },
  cs: {
    monthNames: [
      "leden",
      "únor",
      "březen",
      "duben",
      "květen",
      "Ŀerven",
      "Ŀervenec",
      "srpen",
      "září",
      "říjen",
      "listopad",
      "prosinec",
    ],
    monthNamesShort: [
      "led",
      "úno",
      "bře",
      "dub",
      "kvě",
      "Ŀer",
      "Ŀvc",
      "srp",
      "zář",
      "říj",
      "lis",
      "pro",
    ],
    dayNames: [
      "neděle",
      "pondělí",
      "úterý",
      "středa",
      "Ŀtvrtek",
      "pátek",
      "sobota",
    ],
    dayNamesShort: ["ne", "po", "út", "st", "Ŀt", "pá", "so"],
    dayNamesMin: ["ne", "po", "út", "st", "Ŀt", "pá", "so"],
  },
  de: {
    monthNames: [
      "Januar",
      "Februar",
      "MÃ€rz",
      "April",
      "Mai",
      "Juni",
      "Juli",
      "August",
      "September",
      "Oktober",
      "November",
      "Dezember",
    ],
    monthNamesShort: [
      "Jan",
      "Feb",
      "MÃ€r",
      "Apr",
      "Mai",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Okt",
      "Nov",
      "Dez",
    ],
    dayNames: [
      "Sonntag",
      "Montag",
      "Dienstag",
      "Mittwoch",
      "Donnerstag",
      "Freitag",
      "Samstag",
    ],
    dayNamesShort: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    dayNamesMin: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  },
  el: {
    monthNames: [
      "ΙανουάϿιος",
      "ΦεβϿουάϿιος",
      "ΜάϿτιος",
      "ΑπϿίλιος",
      "Μάιος",
      "ΙοϿνιος",
      "ΙοϿλιος",
      "ΑϿγουστος",
      "ΣεπτέμβϿιος",
      "ΟκτώβϿιος",
      "οοέμβϿιος",
      "ΔεκέμβϿιος",
    ],
    monthNamesShort: [
      "Ιαν",
      "Φεβ",
      "ΜαϿ",
      "ΑπϿ",
      "Μαι",
      "Ιουν",
      "Ιουλ",
      "Αυγ",
      "Σεπ",
      "Οκτ",
      "οοε",
      "Δεκ",
    ],
    dayNames: [
      "ΚυϿιακή",
      "ΔευτέϿα",
      "ΤϿίτη",
      "ΤετάϿτη",
      "Πέμπτη",
      "ΠαϿασκευή",
      "Σάββατο",
    ],
    dayNamesShort: ["ΚυϿ", "Δευ", "ΤϿι", "Τετ", "Πεμ", "ΠαϿ", "Σαβ"],
    dayNamesMin: ["Κυ", "Δε", "ΤϿ", "Τε", "Πε", "Πα", "Σα"],
  },
  es: {
    monthNames: [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ],
    monthNamesShort: [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ],
    dayNames: [
      "Domingo",
      "Lunes",
      "Martes",
      "MiÃ©rcoles",
      "Jueves",
      "Viernes",
      "SÃ¡bado",
    ],
    dayNamesShort: ["Dom", "Lun", "Mar", "MiÃ©", "Juv", "Vie", "SÃ¡b"],
    dayNamesMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "SÃ¡"],
  },
  fi: {
    monthNames: [
      "Tammikuu",
      "Helmikuu",
      "Maaliskuu",
      "Huhtikuu",
      "Toukokuu",
      "KesÃ€kuu",
      "HeinÃ€kuu",
      "Elokuu",
      "Syyskuu",
      "Lokakuu",
      "Marraskuu",
      "Joulukuu",
    ],
    monthNamesShort: [
      "Tammi",
      "Helmi",
      "Maalis",
      "Huhti",
      "Touko",
      "KesÃ€",
      "HeinÃ€",
      "Elo",
      "Syys",
      "Loka",
      "Marras",
      "Joulu",
    ],
    dayNamesShort: ["Su", "Ma", "Ti", "Ke", "To", "Pe", "La"],
    dayNames: [
      "Sunnuntai",
      "Maanantai",
      "Tiistai",
      "Keskiviikko",
      "Torstai",
      "Perjantai",
      "Lauantai",
    ],
    dayNamesMin: ["Su", "Ma", "Ti", "Ke", "To", "Pe", "La"],
  },
  hu: {
    monthNames: [
      "Január",
      "Február",
      "Március",
      "ÿprilis",
      "Május",
      "Június",
      "Július",
      "Augusztus",
      "Szeptember",
      "Október",
      "November",
      "December",
    ],
    monthNamesShort: [
      "Jan",
      "Feb",
      "Már",
      "ÿpr",
      "Máj",
      "Jún",
      "Júl",
      "Aug",
      "Szep",
      "Okt",
      "Nov",
      "Dec",
    ],
    dayNames: [
      "Vasárnap",
      "Hétfő",
      "Kedd",
      "Szerda",
      "Csütörtök",
      "Péntek",
      "Szombat",
    ],
    dayNamesShort: ["Vas", "Hét", "Ked", "Sze", "Csü", "Pén", "Szo"],
    dayNamesMin: ["V", "H", "K", "Sze", "Cs", "P", "Szo"],
  },
  it: {
    monthNames: [
      "Gennaio",
      "Febbraio",
      "Marzo",
      "Aprile",
      "Maggio",
      "Giugno",
      "Luglio",
      "Agosto",
      "Settembre",
      "Ottobre",
      "Novembre",
      "Dicembre",
    ],
    monthNamesShort: [
      "Gen",
      "Feb",
      "Mar",
      "Apr",
      "Mag",
      "Giu",
      "Lug",
      "Ago",
      "Set",
      "Ott",
      "Nov",
      "Dic",
    ],
    dayNames: [
      "Domenica",
      "LunedÃ¬",
      "MartedÃ¬",
      "MercoledÃ¬",
      "GiovedÃ¬",
      "VenerdÃ¬",
      "Sabato",
    ],
    dayNamesShort: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
    dayNamesMin: ["Do", "Lu", "Ma", "Me", "Gi", "Ve", "Sa"],
  },
  nl: {
    monthNames: [
      "januari",
      "februari",
      "maart",
      "april",
      "mei",
      "juni",
      "juli",
      "augustus",
      "september",
      "oktober",
      "november",
      "december",
    ],
    monthNamesShort: [
      "jan",
      "feb",
      "mrt",
      "apr",
      "mei",
      "jun",
      "jul",
      "aug",
      "sep",
      "okt",
      "nov",
      "dec",
    ],
    dayNames: [
      "zondag",
      "maandag",
      "dinsdag",
      "woensdag",
      "donderdag",
      "vrijdag",
      "zaterdag",
    ],
    dayNamesShort: ["zon", "maa", "din", "woe", "don", "vri", "zat"],
    dayNamesMin: ["zo", "ma", "di", "wo", "do", "vr", "za"],
  },
  pl: {
    monthNames: [
      "Styczeń",
      "Luty",
      "Marzec",
      "Kwiecień",
      "Maj",
      "Czerwiec",
      "Lipiec",
      "Sierpień",
      "Wrzesień",
      "Październik",
      "Listopad",
      "Grudzień",
    ],
    monthNamesShort: [
      "Sty",
      "Lu",
      "Mar",
      "Kw",
      "Maj",
      "Cze",
      "Lip",
      "Sie",
      "Wrz",
      "Pa",
      "Lis",
      "Gru",
    ],
    dayNames: [
      "Niedziela",
      "Poniedziałek",
      "Wtorek",
      "Środa",
      "Czwartek",
      "Piątek",
      "Sobota",
    ],
    dayNamesShort: ["Nie", "Pn", "Wt", "Śr", "Czw", "Pt", "So"],
    dayNamesMin: ["N", "Pn", "Wt", "Śr", "Cz", "Pt", "So"],
  },
  pt: {
    monthNames: [
      "Janeiro",
      "Fevereiro",
      "MarÃ§o",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ],
    monthNamesShort: [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ],
    dayNames: [
      "Domingo",
      "Segunda-feira",
      "TerÃ§a-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "SÃ¡bado",
    ],
    dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "SÃ¡b"],
    dayNamesMin: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "SÃ¡b"],
  },
  ro: {
    monthNames: [
      "Ianuarie",
      "Februarie",
      "Martie",
      "Aprilie",
      "Mai",
      "Iunie",
      "Iulie",
      "August",
      "Septembrie",
      "Octombrie",
      "Noiembrie",
      "Decembrie",
    ],
    monthNamesShort: [
      "Ian",
      "Feb",
      "Mar",
      "Apr",
      "Mai",
      "Iun",
      "Iul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    dayNames: [
      "Duminică",
      "Luni",
      "Marţi",
      "Miercuri",
      "Joi",
      "Vineri",
      "Sâmbătă",
    ],
    dayNamesShort: ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"],
    dayNamesMin: ["Du", "Lu", "Ma", "Mi", "Jo", "Vi", "Sâ"],
  },
  ru: {
    monthNames: [
      "Январь",
      "Февраль",
      "Март",
      "ппрель",
      "Май",
      "Июнь",
      "Июль",
      "пвгуѿт",
      "Сентѿбрь",
      "Октѿбрь",
      "поѿбрь",
      "Декабрь",
    ],
    monthNamesShort: [
      "Янв",
      "Фев",
      "Мар",
      "ппр",
      "Май",
      "Июн",
      "Июл",
      "пвг",
      "Сен",
      "Окт",
      "поѿ",
      "Дек",
    ],
    dayNames: [
      "воѿкреѿенье",
      "понедельник",
      "вторник",
      "ѿреда",
      "четверг",
      "пѿтница",
      "ѿуббота",
    ],
    dayNamesShort: ["вѿк", "пнд", "втр", "ѿрд", "чтв", "птн", "ѿбт"],
    dayNamesMin: ["Вѿ", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  },
  sk: {
    monthNames: [
      "januÃ¡r",
      "februÃ¡r",
      "marec",
      "aprÃ­l",
      "mÃ¡j",
      "jÃºn",
      "jÃºl",
      "august",
      "september",
      "oktÃ³ber",
      "november",
      "december",
    ],
    monthNamesShort: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "MÃ¡j",
      "JÃºn",
      "JÃºl",
      "Aug",
      "Sep",
      "Okt",
      "Nov",
      "Dec",
    ],
    dayNames: [
      "nedeÄŸa",
      "pondelok",
      "utorok",
      "streda",
      "Å¡tvrtok",
      "piatok",
      "sobota",
    ],
    dayNamesShort: ["Ned", "Pon", "Uto", "Str", "Å tv", "Pia", "Sob"],
    dayNamesMin: ["Ne", "Po", "Ut", "St", "Å t", "Pia", "So"],
  },
  sv: {
    monthNames: [
      "Januari",
      "Februari",
      "Mars",
      "April",
      "Maj",
      "Juni",
      "Juli",
      "Augusti",
      "September",
      "Oktober",
      "November",
      "December",
    ],
    monthNamesShort: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Maj",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Okt",
      "Nov",
      "Dec",
    ],
    dayNamesShort: ["SÃ¶n", "MÃ¥n", "Tis", "Ons", "Tor", "Fre", "LÃ¶r"],
    dayNames: [
      "SÃ¶ndag",
      "MÃ¥ndag",
      "Tisdag",
      "Onsdag",
      "Torsdag",
      "Fredag",
      "LÃ¶rdag",
    ],
    dayNamesMin: ["SÃ¶", "MÃ¥", "Ti", "On", "To", "Fr", "LÃ¶"],
  },
  tr: {
    monthNames: [
      "Ocak",
      "Şubat",
      "Mart",
      "Nisan",
      "Mayıs",
      "Haziran",
      "Temmuz",
      "Ağustos",
      "Eylül",
      "Ekim",
      "Kasım",
      "Aralık",
    ],
    monthNamesShort: [
      "Oca",
      "Şub",
      "Mar",
      "Nis",
      "May",
      "Haz",
      "Tem",
      "Ağu",
      "Eyl",
      "Eki",
      "Kas",
      "Ara",
    ],
    dayNames: [
      "Pazar",
      "Pazartesi",
      "Salı",
      "Çarşamba",
      "Perşembe",
      "Cuma",
      "Cumartesi",
    ],
    dayNamesShort: ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"],
    dayNamesMin: ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"],
  },
  uk: {
    monthNames: [
      "Січень",
      "Лютий",
      "Березень",
      "Квітень",
      "Травень",
      "Червень",
      "Липень",
      "Серпень",
      "Вереѿень",
      "Жовтень",
      "Лиѿтопад",
      "Грудень",
    ],
    monthNamesShort: [
      "Січ",
      "Лют",
      "Бер",
      "Кві",
      "Тра",
      "Чер",
      "Лип",
      "Сер",
      "Вер",
      "Жов",
      "Лиѿ",
      "Гру",
    ],
    dayNames: [
      "неділѿ",
      "понеділок",
      "вівторок",
      "ѿереда",
      "четвер",
      "п’ѿтницѿ",
      "ѿубота",
    ],
    dayNamesShort: ["нед", "пнд", "вів", "ѿрд", "чтв", "птн", "ѿбт"],
    dayNamesMin: ["пд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  },
};

var current_iso = prestashop.language.iso_code;
