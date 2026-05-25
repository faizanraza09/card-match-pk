import { Offer } from "@/types";

export function getOfferSavingValue(offer: Offer, orderValue: number): number | null {
  const discountType = offer.discountType || "percentage";
  const discountPct = getOfferDiscountPct(offer);
  const fixedDiscountPkr = Number.isFinite(offer.fixedDiscountPkr as number)
    ? (offer.fixedDiscountPkr as number)
    : null;
  const capPkr = Number.isFinite(offer.capPkr as number) ? (offer.capPkr as number) : null;

  switch (discountType) {
    case "fixed":
      if (fixedDiscountPkr !== null && fixedDiscountPkr > 0) {
        return Math.min(fixedDiscountPkr, orderValue);
      }
      return null;

    case "up_to":
      if (Number.isFinite(discountPct as number) && (discountPct as number) > 0) {
        const effectivePct = (discountPct as number) * 0.6;
        const pctSaving = (orderValue * effectivePct) / 100;
        return Math.min(pctSaving, capPkr || Number.POSITIVE_INFINITY);
      }
      return null;

    case "bogo":
      if (Number.isFinite(discountPct as number) && (discountPct as number) > 0) {
        const bogoEffectivePct = (discountPct as number) * 0.3;
        const bogoPctSaving = (orderValue * bogoEffectivePct) / 100;
        return Math.min(bogoPctSaving, capPkr || Number.POSITIVE_INFINITY);
      }
      return null;

    case "percentage":
    default:
      if (Number.isFinite(discountPct as number) && (discountPct as number) > 0) {
        return Math.min(
          (orderValue * (discountPct as number)) / 100,
          fixedDiscountPkr || capPkr || Number.POSITIVE_INFINITY
        );
      }
      if (fixedDiscountPkr !== null && fixedDiscountPkr > 0)
        return Math.min(fixedDiscountPkr, orderValue);
      return null;
  }
}

export function getOfferDiscountPct(offer: Offer): number | null {
  if (Number.isFinite(offer.discountPct as number)) return Number(offer.discountPct);
  const text = `${offer.discountLabel || ""} ${offer.offerTitle || ""}`;
  const matches = text.match(/(\d+(?:\.\d+)?)\s*%/g) || [];
  if (!matches.length) return null;
  return Math.max(...matches.map((m) => Number.parseFloat(m)));
}
