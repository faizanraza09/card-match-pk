# Food-Discovery — ranking + synthesis demo

Deterministic scorer: `0.3·quality + 0.45·dishMatch + 0.25·savings` (proximity omitted — no user location in demo).

## "best biryani in Karachi"

**Answer:** If you're looking for the best biryani in Karachi, I highly recommend trying The White Biryani! With a rating of 4.1/5 stars on Google and a score of 7 out of 7 reviews, it's clear that this spot is a fan favorite. Unfortunately, they don't accept card payments, so be prepared to pay cash - but trust me, it'll be worth it!

| # | branch | score | dish | evidence | google | card offer |
|--|--|--|--|--|--|--|
| 1 | Biryani Scene | Karachi best Biryani | 0.714 | 1 | branch(n=7) | 4.9★/20 | — |
| 2 | The White Biryani | 0.696 | 1 | branch+brand_prior(n=1) | 4.1★/1416 | — |
| 3 | ALLAH WALA BIRYANI Tariq Road Branch | 0.69 | 1 | branch+brand_prior(n=1) | 4★/1594 | — |
| 4 | Ghazi Biryani & Pakwan Centre | 0.252 | 0 | branch+brand_prior(n=1) | 4.2★/700 | — |
| 5 | Ghousia Biryani | 0.246 | 0 | branch+brand_prior(n=1) | 4.1★/729 | — |

## "best karahi in Karachi"

**Answer:** If you're looking for the best karahi in Karachi, I highly recommend Tayyabi'z Restaurant! With a perfect score of 4.1/5 on Google Reviews and over 2000 reviews, it's clear that this restaurant is a favorite among locals and visitors alike. Unfortunately, they don't offer any card payment options, so be prepared to pay cash.

| # | branch | score | dish | evidence | google | card offer |
|--|--|--|--|--|--|--|
| 1 | Tayyabi'z Restaurant۔ طیبیز ریسٹورنٹ | 0.696 | 1 | branch+brand_prior(n=1) | 4.1★/2036 | — |
| 2 | Bombay Koyla Karhai | 0.258 | 0 | branch+brand_prior(n=1) | 4.3★/3039 | — |
| 3 | Chaska Koyla Karahi چسکا کوئلہ کڑاھی | 0.247 | 0 | branch+brand_prior(n=1) | 4.1★/169 | — |

## "best nihari in Lahore"

**Answer:** I'd recommend trying Muhammadi Nehari House in Fazaia, Lahore, for the best nihari experience! With a perfect score of 4.7/5 stars on Google and 1 review that praises its deliciousness, you can't go wrong with this top-rated spot. Unfortunately, it doesn't offer any card payments, so be prepared to pay cash or consider an alternative payment method like PayPal (if available).

| # | branch | score | dish | evidence | google | card offer |
|--|--|--|--|--|--|--|
| 1 | Muhammadi Nehari House - Fazaia | 0.731 | 1 | branch+brand_prior(n=1) | 4.7★/1319 | — |
| 2 | Muhammadi Nehari House Bahria Town | 0.708 | 1 | branch+brand_prior(n=1) | 4.3★/1306 | — |
| 3 | Muhammadi Nahari House | 0.281 | 0 | brand_prior(n=0) | 4.7★/1301 | — |
| 4 | Muhammadi Nahari House | 0.272 | 0 | brand_prior(n=0) | 4.6★/262 | — |
| 5 | Muhammadi Nahari House | 0.246 | 0 | branch+brand_prior(n=1) | 4.1★/1984 | — |

## "best bbq in Lahore"

_no candidates with evidence_

## "best restaurant in Islamabad"

**Answer:** I'd recommend Coco Cafe in Islamabad, with an impressive 4.3-star rating from 78 reviews! This spot offers a great deal of 20% off with the Meezan Bank Mastercard World Debit Card, making it a convenient and affordable choice for diners.

| # | branch | score | dish | evidence | google | card offer |
|--|--|--|--|--|--|--|
| 1 | Coco Cafe | 0.692 | 0.6 | - | 4.3★/78 | 20% Meezan Bank [brand] |
| 2 | The Hot Spot | 0.611 | 0.6 | - | 4.3★/2716 | 10% National Bank of Pakistan [brand] |
| 3 | Tree House Cafe | 0.55 | 0.6 | - | 4.7★/637 | — |
| 4 | Cavo Rooftop | 0.544 | 0.6 | - | 4.8★/78 | — |
| 5 | MOJO's Lounge | 0.531 | 0.6 | - | 4.4★/143 | — |

