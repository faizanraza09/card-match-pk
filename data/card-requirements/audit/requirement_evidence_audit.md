# Requirement Evidence Audit

Audit date: 2026-05-21

This report classifies filled requirement fields into direct evidence versus inferred/account-relationship fills.

## Basis Summary

### minimum_monthly_salary_pkr
- explicit_apply_flow: 1
- explicit_card_page: 69
- inferred_account_relationship: 66
- missing: 36
- other_explicit_source: 6

### minimum_account_balance_pkr
- explicit_card_page: 48
- explicit_soc_or_summary_pdf: 22
- inferred_account_relationship: 40
- missing: 36
- normalized_from_alt_balance_key: 26
- other_explicit_source: 6

### annual_fee_pkr
- explicit_card_page: 52
- explicit_soc_or_summary_pdf: 63
- inferred_account_relationship: 43
- missing: 9
- other_explicit_source: 11

## Manual Review Buckets

### salary
- flagged rows: 74
- Al Baraka Bank | Mastercard Silver Debit Card | 0 | inferred_account_relationship | high
- Al Baraka Bank | Nexgen Student PayPak Debit Card | 0 | inferred_account_relationship | high
- Al Baraka Bank | PayPak Standard Debit Card | 0 | inferred_account_relationship | high
- Al Baraka Bank | UnionPay Silver Debit Card | 0 | inferred_account_relationship | medium
- Allied Bank | Allied Basic Debit Card | 0 | inferred_account_relationship | high
- Allied Bank | Allied UPI & PayPak Classic Plus | 0 | inferred_account_relationship | high
- Allied Bank | Allied UnionPay PayPak Classic Debit Card | 0 | inferred_account_relationship | high
- Allied Bank | Allied Visa Classic Debit Card | 0 | inferred_account_relationship | high
- Allied Bank | Allied Visa Premium Debit Card | 416667 | explicit_card_page | low
- Allied Bank | Allied Youth Visa Debit Card | 0 | other_explicit_source | medium
- Allied Bank | Cash+Shop Sapphire Visa Debit Card | 0 | inferred_account_relationship | medium
- Allied Bank | Islamic Banking VISA DebitCard | 0 | inferred_account_relationship | medium
- Askari Bank Limited | Askari PayPak Debit Card Gold | 0 | inferred_account_relationship | high
- Askari Bank Limited | Askari Visa Signature Debit Card | 0 | inferred_account_relationship | high
- Askari Bank Limited | Askari World Mastercard Credit Card | 1000000 | inferred_account_relationship | high
- Bank AL Habib | AL Habib Remit Debit Card | 0 | inferred_account_relationship | medium
- Bank AL Habib | AL Habib Woman Debit Card | 0 | inferred_account_relationship | medium
- Bank AL Habib | BAHL UnionPay Apna Debit Card | 0 | inferred_account_relationship | medium
- Bank AL Habib | BAHL UnionPay Debit Card | 0 | inferred_account_relationship | medium
- Bank AL Habib | PayPak Debit Card | 0 | inferred_account_relationship | medium
- Bank AL Habib | Signature Debit Card | 750000 | inferred_account_relationship | high
- Bank AL Habib | Visa Silver Debit Card | 0 | inferred_account_relationship | low
- Bank Alfalah | Bank Alfalah Islamic Gold Women Debit Card | 0 | inferred_account_relationship | high
- Bank Alfalah | Bank Alfalah Mastercard Titanium Credit Card | 50000 | explicit_card_page | low
- Bank Alfalah | Bank Alfalah Pehchaan Debit Card | 0 | inferred_account_relationship | high
- Bank Alfalah | Bank Alfalah Premier Visa Platinum Credit Card | 50000 | inferred_account_relationship | medium
- Bank Alfalah | Bank Alfalah Premier Visa Signature Debit Card | 0 | inferred_account_relationship | medium
- Bank Alfalah | Bank Alfalah Visa Ultra Cashback Card | 50000 | inferred_account_relationship | high
- Bank Alfalah | Visa Classic Credit Card | 50000 | inferred_account_relationship | high
- Bank Alfalah | Visa Gold Credit Card | 50000 | inferred_account_relationship | high
- Bank of Punjab | BOP KHAAS Platinum Debit Card | 500000 | inferred_account_relationship | medium
- Bank of Punjab | BOP Lahore Qalandars Debit Card | 0 | inferred_account_relationship | high
- Bank of Punjab | BOP Mastercard Classic Debit Card | 0 | inferred_account_relationship | high
- Bank of Punjab | BOP Mastercard Gold Debit Card | 0 | inferred_account_relationship | high
- Bank of Punjab | BOP Mastercard Platinum Debit Card | 0 | inferred_account_relationship | high
- Bank of Punjab | BOP Naaz Debit Card | 0 | inferred_account_relationship | high
- Bank of Punjab | BOP Taqwa KHAAS Platinum Islamic Debit Card | 0 | inferred_account_relationship | high
- Bank of Punjab | BOP Taqwa Platinum Islamic Debit Card | 0 | inferred_account_relationship | high
- Bank of Punjab | BOP Taqwa World Islamic Debit Card | 0 | inferred_account_relationship | high
- Bank of Punjab | BOP World Debit Card | 0 | inferred_account_relationship | medium
- ... 34 more rows omitted from markdown; see JSON.

### balance
- flagged rows: 74
- Al Baraka Bank | Nexgen Student PayPak Debit Card | 100 | inferred_account_relationship | high
- Al Baraka Bank | PayPak Standard Debit Card | 0 | inferred_account_relationship | high
- Al Baraka Bank | UnionPay Silver Debit Card | 0 | inferred_account_relationship | medium
- Allied Bank | Allied Visa Premium Debit Card | 2000000 | normalized_from_alt_balance_key | low
- Allied Bank | Cash+Shop Sapphire Visa Debit Card | 1000 | inferred_account_relationship | medium
- Allied Bank | Islamic Banking VISA DebitCard | 1000 | inferred_account_relationship | medium
- Askari Bank Limited | Askari Mastercard Classic Credit Card | 150000 | normalized_from_alt_balance_key | high
- Askari Bank Limited | Askari Mastercard Gold Credit Card | 150000 | normalized_from_alt_balance_key | high
- Askari Bank Limited | Askari Mastercard Platinum Credit Card | 150000 | normalized_from_alt_balance_key | high
- Askari Bank Limited | Askari Visa Signature Debit Card | 5000000 | normalized_from_alt_balance_key | high
- Bank AL Habib | AL Habib Gold Credit Card | 25000 | normalized_from_alt_balance_key | medium
- Bank AL Habib | AL Habib Green Credit Card | 25000 | normalized_from_alt_balance_key | medium
- Bank AL Habib | AL Habib Remit Debit Card | 0 | inferred_account_relationship | medium
- Bank AL Habib | AL Habib Woman Debit Card | 0 | inferred_account_relationship | medium
- Bank AL Habib | BAHL UnionPay Apna Debit Card | 0 | inferred_account_relationship | medium
- Bank AL Habib | BAHL UnionPay Debit Card | 0 | inferred_account_relationship | medium
- Bank AL Habib | PayPak Debit Card | 0 | inferred_account_relationship | medium
- Bank AL Habib | Signature Debit Card | 2000000 | normalized_from_alt_balance_key | high
- Bank AL Habib | Visa Platinum Debit Card | 200000 | normalized_from_alt_balance_key | high
- Bank AL Habib | Visa Silver Debit Card | 0 | explicit_card_page | low
- Bank Alfalah | Bank Alfalah Islamic Power Pack Signature Debit Card | 250000 | normalized_from_alt_balance_key | medium
- Bank Alfalah | Bank Alfalah Islamic Power Pack Women Debit Card | 250000 | normalized_from_alt_balance_key | high
- Bank Alfalah | Bank Alfalah Islamic Premier Visa Signature Debit Card | 3000000 | normalized_from_alt_balance_key | medium
- Bank Alfalah | Bank Alfalah Mastercard Titanium Credit Card | None | missing | low
- Bank Alfalah | Bank Alfalah Premier Visa Platinum Credit Card | 3000000 | normalized_from_alt_balance_key | medium
- Bank Alfalah | Bank Alfalah Premier Visa Signature Debit Card | 3000000 | normalized_from_alt_balance_key | medium
- Bank Alfalah | Bank Alfalah Visa Islamic Signature Debit Card | 1000000 | normalized_from_alt_balance_key | medium
- Bank Alfalah | Visa Classic Credit Card | 75000 | normalized_from_alt_balance_key | high
- Bank Alfalah | Visa Gold Credit Card | 75000 | normalized_from_alt_balance_key | high
- Bank Alfalah | Visa Signature Debit Card | 1000000 | normalized_from_alt_balance_key | medium
- Bank of Punjab | BOP KHAAS Platinum Debit Card | 2000000 | inferred_account_relationship | medium
- Bank of Punjab | BOP Lahore Qalandars Debit Card | 0 | inferred_account_relationship | high
- Bank of Punjab | BOP Mastercard Classic Debit Card | 0 | inferred_account_relationship | high
- Bank of Punjab | BOP Mastercard Gold Debit Card | 0 | inferred_account_relationship | high
- Bank of Punjab | BOP Mastercard Platinum Debit Card | 0 | inferred_account_relationship | high
- Bank of Punjab | BOP Naaz Debit Card | 1000 | inferred_account_relationship | high
- Bank of Punjab | BOP Taqwa KHAAS Platinum Islamic Debit Card | 0 | inferred_account_relationship | high
- Bank of Punjab | BOP Taqwa Platinum Islamic Debit Card | 0 | inferred_account_relationship | high
- Bank of Punjab | BOP Taqwa World Islamic Debit Card | 0 | inferred_account_relationship | high
- Faysal Bank Limited | Faysal Islami Noor World Card | 0 | inferred_account_relationship | high
- ... 34 more rows omitted from markdown; see JSON.

### annual_fee
- flagged rows: 56
- Al Baraka Bank | Nexgen Student PayPak Debit Card | 2200 | inferred_account_relationship | high
- Al Baraka Bank | PayPak Standard Debit Card | 2200 | inferred_account_relationship | high
- Al Baraka Bank | UnionPay Silver Debit Card | 2500 | inferred_account_relationship | medium
- Allied Bank | Allied Visa Premium Debit Card | 19500 | explicit_soc_or_summary_pdf | low
- Allied Bank | Cash+Shop Sapphire Visa Debit Card | 3000 | inferred_account_relationship | medium
- Allied Bank | Islamic Banking VISA DebitCard | 2900 | inferred_account_relationship | medium
- Bank AL Habib | Signature Debit Card | 22000 | inferred_account_relationship | high
- Bank AL Habib | Visa Gold Debit Card | 4500 | inferred_account_relationship | medium
- Bank AL Habib | Visa Silver Debit Card | 3700 | inferred_account_relationship | low
- Bank Alfalah | Bank Alfalah Mastercard Optimus Credit Card | 16000 | inferred_account_relationship | high
- Bank Alfalah | Bank Alfalah Mastercard Titanium Credit Card | None | missing | low
- Bank Alfalah | Bank Alfalah Premier Visa Platinum Credit Card | 0 | inferred_account_relationship | medium
- Bank Alfalah | Bank Alfalah Premier Visa Signature Debit Card | 0 | inferred_account_relationship | medium
- Bank Alfalah | Bank Alfalah Visa Platinum Credit Card | 23000 | inferred_account_relationship | high
- Bank Alfalah | Bank Alfalah Visa Ultra Cashback Card | 10000 | inferred_account_relationship | high
- Bank Alfalah | Visa Classic Credit Card | 7000 | inferred_account_relationship | high
- Bank Alfalah | Visa Gold Credit Card | 13000 | inferred_account_relationship | high
- Bank of Punjab | BOP KHAAS Platinum Debit Card | 0 | inferred_account_relationship | medium
- Bank of Punjab | BOP Lahore Qalandars Debit Card | 3000 | inferred_account_relationship | high
- Bank of Punjab | BOP Mastercard Classic Debit Card | 2800 | inferred_account_relationship | high
- Bank of Punjab | BOP Mastercard Gold Credit Card | 6250 | other_explicit_source | high
- Bank of Punjab | BOP Mastercard Gold Debit Card | 3600 | inferred_account_relationship | high
- Bank of Punjab | BOP Mastercard Platinum Credit Card | 12500 | other_explicit_source | high
- Bank of Punjab | BOP Mastercard Platinum Debit Card | 6000 | inferred_account_relationship | high
- Bank of Punjab | BOP Naaz Debit Card | 2400 | inferred_account_relationship | high
- Bank of Punjab | BOP Taqwa KHAAS Platinum Islamic Debit Card | 0 | inferred_account_relationship | high
- Bank of Punjab | BOP Taqwa Platinum Islamic Debit Card | 6000 | inferred_account_relationship | high
- Bank of Punjab | BOP Taqwa World Islamic Debit Card | 18000 | inferred_account_relationship | high
- Bank of Punjab | BOP World Credit Card | 25000 | other_explicit_source | high
- Bank of Punjab | BOP World Debit Card | 18000 | inferred_account_relationship | medium
- Bank of Punjab | Lahore Qalandars Gold Credit Card | 5000 | other_explicit_source | high
- Faysal Bank Limited | Faysal Islami Noor Flexi Card | 6500 | other_explicit_source | medium
- Faysal Bank Limited | Faysal Islami Noor Platinum  Card | 19000 | inferred_account_relationship | high
- Faysal Bank Limited | Faysal Islami Noor Velocity Card | 6500 | inferred_account_relationship | high
- HBL | HBL Classic DebitCard | 3000 | inferred_account_relationship | medium
- HBL | HBL Platinum CreditCard | 22000 | inferred_account_relationship | medium
- HBL | HBL World DebitCard | 20000 | inferred_account_relationship | medium
- HBL Islamic Bank Limited | HBL Islamic Business DebitCard | 0 | inferred_account_relationship | medium
- HBL Islamic Bank Limited | HBL Islamic Titanium DebitCard | 3000 | other_explicit_source | medium
- Habib Metro Bank | Visa Classic Debit Card | 3300 | inferred_account_relationship | high
- ... 16 more rows omitted from markdown; see JSON.

