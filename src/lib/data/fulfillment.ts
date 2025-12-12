"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders, getCacheOptions } from "@/lib/data/cookies"
import { StoreFreeShippingPrice } from "@/types/shipping-option/http"
import { HttpTypes } from "@medusajs/types"

export const listCartShippingMethods = async (cartId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("fulfillment")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreShippingOptionListResponse>(
      `/store/shipping-options`,
      {
        method: "GET",
        query: { cart_id: cartId },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ shipping_options }) => shipping_options)
    .catch(() => {
      return null
    })
}

export const listCartFreeShippingPrices = async (
  cartId: string
): Promise<StoreFreeShippingPrice[]> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("freeShipping")),
  }

  return sdk.client
    .fetch<{
      prices: StoreFreeShippingPrice[]
    }>(`/store/free-shipping/prices`, {
      method: "GET",
      query: { cart_id: cartId },
      headers,
      next,
      cache: "force-cache",
    })
    .then((data) => data.prices)
}

export type ShippoRate = {
  id: string
  amount: number
  currency: string
  servicelevel: {
    name: string
    token: string
  }
  estimated_days?: number
  duration_terms?: string
}

export const getShippoRates = async (
  carrierAccountId: string,
  cartId: string
): Promise<{ rates: ShippoRate[]; shipment_id: string } | null> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<{
      rates: ShippoRate[]
      shipment_id: string
      total: number
    }>(`/store/shippo/rates`, {
      method: "GET",
      query: {
        carrier_account_id: carrierAccountId,
        cart_id: cartId,
      },
      headers,
      cache: "no-store",
    })
    .then((response) => ({
      rates: response.rates,
      shipment_id: response.shipment_id,
    }))
    .catch(() => {
      return null
    })
}

export const calculatePriceForShippingOption = async (
  shippingOptionId: string,
  cartId: string
): Promise<{ id: string; amount: number }> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<{
      shipping_option: HttpTypes.StoreCartShippingOption
    }>(`/store/shipping-options/${shippingOptionId}/calculate`, {
      method: "POST",
      body: {
        cart_id: cartId,
      },
      headers,
      cache: "no-store",
    })
    .then((response) => ({
      id: response.shipping_option.id,
      amount: response.shipping_option.amount || 0,
    }))
    .catch(() => {
      // Return a fallback if calculation fails
      return {
        id: shippingOptionId,
        amount: 0,
      }
    })
}
