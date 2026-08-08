# International card flow without a USD domiciliary account

1. Product prices remain based in USD.
2. Visitors may display prices in any currency available in the project.
3. The backend converts the USD price into the visitor display currency for presentation.
4. The backend independently converts the USD base price into `PAYSTACK_CHECKOUT_CURRENCY` (default `NGN`).
5. Only the configured merchant-enabled payment currency is sent to Paystack.
6. Eligible international Visa/Mastercard customers can attempt payment; their issuing bank handles conversion.
7. The service is activated only after backend verification of reference, amount, currency and successful status.

Recommended production values:

```env
PAYSTACK_CHECKOUT_CURRENCY=NGN
PAYSTACK_SUPPORTED_CURRENCIES=NGN
PLATFORM_CURRENCY=USD
```

Do not add GHS, EUR, GBP or other values to `PAYSTACK_SUPPORTED_CURRENCIES` unless Paystack has explicitly enabled them for the merchant account.


## International customer display
Public pages should emphasize the customer-selected local currency. Do not show a large NGN conversion block to international visitors. However, never conceal or misrepresent the actual charge: Paystack will display the final amount and charge currency before card authorization.
