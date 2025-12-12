"use client"

import { setShippingMethod } from "@/lib/data/cart"
import { calculatePriceForShippingOption } from "@/lib/data/fulfillment"
import { convertToLocale } from "@/lib/util/money"
import ErrorMessage from "@/modules/checkout/components/error-message"
import Divider from "@/modules/common/components/divider"
import Radio from "@/modules/common/components/radio"
import { ApprovalStatusType, B2BCart } from "@/types"
import { RadioGroup, Radio as RadioGroupOption } from "@headlessui/react"
import { CheckCircleSolid, Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text, Button, clx } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

type PickupLocation = {
  id: string
  name: string
  address: {
    address_1: string
    address_2?: string
    city: string
    postal_code: string
    province?: string
    country_code: string
    phone?: string
    company?: string
  }
}

type EnrichedShippingOption = HttpTypes.StoreCartShippingOption & {
  is_pickup?: boolean
  pickup_location?: PickupLocation | null
}

type ShippingProps = {
  cart: B2BCart
  availableShippingMethods: EnrichedShippingOption[] | null
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const cartApprovalStatus = cart?.approval_status?.status

  const selectedShippingMethod = availableShippingMethods?.find(
    (method) => method.id === cart.shipping_methods?.at(-1)?.shipping_option_id
  )

  const selectedMethodId = selectedShippingMethod?.id || ""

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=contact-details", { scroll: false })
  }

  const set = async (id: string) => {
    setIsLoading(true)
    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  useEffect(() => {
    setIsLoadingPrices(true)

    if (availableShippingMethods?.length && cart?.id) {
      const calculatedOptions = availableShippingMethods.filter(
        (sm) => sm.price_type === "calculated"
      )

      if (calculatedOptions.length) {
        const promises = calculatedOptions.map((sm) =>
          calculatePriceForShippingOption(sm.id, cart.id)
        )

        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res.forEach((r) => {
            if (r.status === "fulfilled") {
              const result = r.value
              if (
                result?.id &&
                typeof result.amount === "number" &&
                !isNaN(result.amount)
              ) {
                pricesMap[result.id] = result.amount
              }
            }
          })

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      } else {
        setIsLoadingPrices(false)
      }
    } else {
      setIsLoadingPrices(false)
    }
  }, [availableShippingMethods, cart?.id])

  const formatAddress = (address: {
    address_1: string
    address_2?: string
    city: string
    postal_code: string
    province?: string
    country_code: string
  }) => {
    const parts = [
      address.address_1,
      address.address_2,
      `${address.city}${address.postal_code ? `, ${address.postal_code}` : ""}`,
      address.province,
    ].filter(Boolean)
    return parts.join(", ")
  }

  return (
    <Container>
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-row items-center justify-between w-full">
          <Heading
            level="h2"
            className={clx("flex flex-row text-xl gap-x-2 items-center", {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            })}
          >
            Delivery Method
            {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
              <CheckCircleSolid />
            )}
          </Heading>
          {!isOpen &&
            cart?.shipping_address &&
            cart?.billing_address &&
            cart?.email &&
            cartApprovalStatus !== ApprovalStatusType.PENDING && (
              <Text>
                <button
                  onClick={handleEdit}
                  className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                  data-testid="edit-delivery-button"
                >
                  Edit
                </button>
              </Text>
            )}
        </div>
        {(isOpen || (cart && (cart.shipping_methods?.length ?? 0) > 0)) && (
          <Divider />
        )}
      </div>
      {isOpen ? (
        <div data-testid="delivery-options-container">
          <div className="">
            <RadioGroup value={selectedMethodId} onChange={set}>
              {availableShippingMethods?.map((option) => (
                <div key={option.id} className="mb-2">
                  <RadioGroupOption
                    value={option.id}
                    data-testid="delivery-option-radio"
                    className={clx(
                      "flex flex-col gap-y-2 text-small-regular cursor-pointer py-3 px-2 rounded-md",
                      {
                        "border-2 border-ui-border-interactive bg-ui-bg-subtle-hover":
                          option.id === selectedShippingMethod?.id,
                        "border border-ui-border-base":
                          option.id !== selectedShippingMethod?.id,
                      }
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-x-4 flex-1">
                        <Radio
                          checked={option.id === selectedShippingMethod?.id}
                        />
                        <div className="flex flex-col flex-1">
                          <span className="text-base-regular font-medium">
                            {option.name}
                          </span>
                          {option.is_pickup && option.pickup_location && (
                            <div className="flex items-start gap-x-2 mt-2 text-small-regular text-ui-fg-subtle">
                              <div className="flex flex-col gap-y-1">
                                <Text className="font-medium text-ui-fg-base">
                                  {option.pickup_location.name}
                                </Text>
                                <Text className="text-ui-fg-subtle">
                                  {formatAddress(
                                    option.pickup_location.address
                                  )}
                                </Text>
                                {option.pickup_location.address.phone && (
                                  <Text className="text-ui-fg-subtle">
                                    Tel: {option.pickup_location.address.phone}
                                  </Text>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {!(option.is_pickup && option.amount === 0) && (
                        <span className="justify-self-end text-ui-fg-base font-medium ml-4">
                          {option.price_type === "flat" ? (
                            convertToLocale({
                              amount: option.amount || 0,
                              currency_code: cart?.currency_code,
                            })
                          ) : typeof calculatedPricesMap[option.id] ===
                              "number" &&
                            !isNaN(calculatedPricesMap[option.id]) ? (
                            convertToLocale({
                              amount: calculatedPricesMap[option.id],
                              currency_code: cart?.currency_code,
                            })
                          ) : isLoadingPrices ? (
                            <Loader className="animate-spin" />
                          ) : (
                            "-"
                          )}
                        </span>
                      )}
                    </div>
                  </RadioGroupOption>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="flex flex-col gap-y-2 items-end">
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />

            <Button
              size="large"
              variant="primary"
              className="mt-4"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!cart.shipping_methods?.[0]}
              data-testid="submit-delivery-option-button"
            >
              Next step
            </Button>
          </div>
        </div>
      ) : (
        cart.shipping_methods &&
        cart.shipping_methods?.length > 0 && (
          <div className="text-small-regular pt-2">
            <div className="flex flex-col w-full">
              <Text className="txt-medium text-ui-fg-subtle">
                {selectedShippingMethod?.name}
                {!(
                  selectedShippingMethod?.is_pickup &&
                  selectedShippingMethod?.amount === 0
                ) && (
                  <>
                    {" "}
                    {selectedShippingMethod?.price_type === "flat"
                      ? convertToLocale({
                          amount: selectedShippingMethod?.amount || 0,
                          currency_code: cart?.currency_code,
                        })
                      : typeof calculatedPricesMap[
                          selectedShippingMethod?.id || ""
                        ] === "number" &&
                        !isNaN(
                          calculatedPricesMap[selectedShippingMethod?.id || ""]
                        )
                      ? convertToLocale({
                          amount:
                            calculatedPricesMap[
                              selectedShippingMethod?.id || ""
                            ],
                          currency_code: cart?.currency_code,
                        })
                      : "-"}
                  </>
                )}
              </Text>
              {selectedShippingMethod?.is_pickup &&
                selectedShippingMethod?.pickup_location && (
                  <div className="flex items-start gap-x-2 mt-2 text-small-regular text-ui-fg-subtle">
                    <div className="flex flex-col gap-y-1">
                      <Text className="font-medium text-ui-fg-base">
                        {selectedShippingMethod.pickup_location.name}
                      </Text>
                      <Text className="text-ui-fg-subtle">
                        {formatAddress(
                          selectedShippingMethod.pickup_location.address
                        )}
                      </Text>
                      {selectedShippingMethod.pickup_location.address.phone && (
                        <Text className="text-ui-fg-subtle">
                          Tel:{" "}
                          {selectedShippingMethod.pickup_location.address.phone}
                        </Text>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )
      )}
    </Container>
  )
}

export default Shipping
