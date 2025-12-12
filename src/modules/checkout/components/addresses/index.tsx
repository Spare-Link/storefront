"use client"

import { setAddresses } from "@/lib/data/cart"
import compareAddresses from "@/lib/util/compare-addresses"
import { CheckCircleSolid } from "@medusajs/icons"
import { B2BCart, B2BCustomer } from "@/types"
import { ApprovalStatusType } from "@/types/approval"
import { clx, Container, Heading, Text, useToggleState } from "@medusajs/ui"
import Divider from "@/modules/common/components/divider"
import Checkbox from "@/modules/common/components/checkbox"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState, useCallback } from "react"
import BillingAddressForm from "../billing-address-form"
import ErrorMessage from "../error-message"
import ShippingAddressForm from "../shipping-address-form"
import { SubmitButton } from "../submit-button"
import Input from "@/modules/common/components/input"
import { useState, useEffect } from "react"

const Addresses = ({
  cart,
  customer,
}: {
  cart: B2BCart | null
  customer: B2BCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "address"), {
      scroll: false,
    })
  }

  const [message, formAction] = useActionState(setAddresses, null)
  const [email, setEmail] = useState(cart?.email || customer?.email || "")

  useEffect(() => {
    if (cart?.email) {
      setEmail(cart.email)
    } else if (customer?.email) {
      setEmail(customer.email)
    }
  }, [cart?.email, customer?.email])

  useEffect(() => {
    if (message === null && cart?.shipping_address && cart?.billing_address) {
      router.push(pathname + "?step=delivery", { scroll: false })
    }
  }, [message, cart?.shipping_address, cart?.billing_address, pathname, router])

  const cartApprovalStatus = cart?.approval_status?.status

  return (
    <Container>
      <div className="flex flex-col gap-y-2">
        <div className="flex small:flex-row flex-col small:items-center justify-between w-full">
          <div className="flex gap-x-2 items-center">
            <Heading
              level="h2"
              className={clx(
                "flex flex-row text-xl gap-x-2 items-center font-medium",
                {
                  "opacity-50 pointer-events-none select-none":
                    !isOpen && !cart?.shipping_address?.address_1,
                }
              )}
            >
              Shipping Address
            </Heading>
            {!isOpen && cart?.shipping_address?.address_1 && (
              <CheckCircleSolid />
            )}
          </div>
          {!isOpen &&
            cart?.shipping_address?.address_1 &&
            cartApprovalStatus !== ApprovalStatusType.PENDING && (
              <Text>
                <button
                  onClick={handleEdit}
                  className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                  data-testid="edit-address-button"
                >
                  Edit
                </button>
              </Text>
            )}
        </div>
        {!isOpen && cart?.shipping_address?.address_1 && <Divider />}
        {isOpen || !cart?.shipping_address?.address_1 ? (
          <div>
            {isOpen && <Divider />}
            {!isOpen && !cart?.shipping_address?.address_1 && <Divider />}
            <form action={formAction}>
              <div className="py-2">
                <ShippingAddressForm customer={customer} cart={cart} />

                <div className="my-8">
                  <Checkbox
                    label="Billing address same as shipping address"
                    name="same_as_billing"
                    checked={sameAsBilling}
                    onChange={toggleSameAsBilling}
                    data-testid="billing-address-checkbox"
                  />
                </div>

                {!sameAsBilling && (
                  <div>
                    <Heading
                      level="h2"
                      className="text-xl gap-x-4 pb-6 pt-8 font-medium"
                    >
                      Billing address
                    </Heading>

                    <BillingAddressForm cart={cart} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    title="Enter a valid email address."
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="shipping-email-input"
                  />
                </div>

                {sameAsBilling && (
                  <input type="hidden" name="same_as_billing" value="on" />
                )}
              </div>
              <div className="flex flex-col gap-y-2 items-end">
                <SubmitButton
                  className="mt-6"
                  data-testid="submit-address-button"
                >
                  Continue to delivery
                </SubmitButton>
                <ErrorMessage
                  error={message}
                  data-testid="address-error-message"
                />
              </div>
            </form>
          </div>
        ) : (
          cart &&
          cart.shipping_address?.address_1 && (
            <div className="text-small-regular">
              <div className="flex items-start gap-x-8">
                <div className="flex items-start gap-x-1 w-full">
                  <div
                    className="flex flex-col w-1/3"
                    data-testid="shipping-address-summary"
                  >
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      Shipping Address
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.first_name}{" "}
                      {cart.shipping_address.last_name}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.address_1}{" "}
                      {cart.shipping_address.address_2}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.postal_code},{" "}
                      {cart.shipping_address.city}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.country_code?.toUpperCase()}
                    </Text>
                  </div>

                  <div
                    className="flex flex-col w-1/3 "
                    data-testid="shipping-contact-summary"
                  >
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      Contact
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.phone}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.email}
                    </Text>
                  </div>

                  <div
                    className="flex flex-col w-1/3"
                    data-testid="billing-address-summary"
                  >
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      Billing Address
                    </Text>

                    {sameAsBilling ? (
                      <Text className="txt-medium text-ui-fg-subtle">
                        Billing and delivery address are the same.
                      </Text>
                    ) : (
                      <>
                        <Text className="txt-medium text-ui-fg-subtle">
                          {cart.billing_address?.first_name}{" "}
                          {cart.billing_address?.last_name}
                        </Text>
                        <Text className="txt-medium text-ui-fg-subtle">
                          {cart.billing_address?.address_1}{" "}
                          {cart.billing_address?.address_2}
                        </Text>
                        <Text className="txt-medium text-ui-fg-subtle">
                          {cart.billing_address?.postal_code},{" "}
                          {cart.billing_address?.city}
                        </Text>
                        <Text className="txt-medium text-ui-fg-subtle">
                          {cart.billing_address?.country_code?.toUpperCase()}
                        </Text>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </Container>
  )
}

export default Addresses
