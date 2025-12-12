"use client"

import React, { useEffect, useActionState } from "react"

import Input from "@/modules/common/components/input"

import AccountInfo from "../account-info"
import { B2BCustomer } from "@/types/global"
import { updateCustomer } from "@/lib/data/customer"

type ProfilePhoneProps = {
  customer: B2BCustomer
}

const ProfilePhone: React.FC<ProfilePhoneProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)

  const updateCustomerPhone = async (
    _currentState: Record<string, unknown>,
    formData: FormData
  ) => {
    const phone = formData.get("phone") as string

    try {
      await updateCustomer({ phone })
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: error.toString() }
    }
  }

  const [state, formAction] = useActionState(updateCustomerPhone, {
    error: false,
    success: false,
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
  }, [state])

  return (
    <form action={formAction} className="w-full">
      <AccountInfo
        label="Phone"
        currentInfo={customer.phone || "No phone number"}
        isSuccess={successState}
        isError={!!state.error}
        errorMessage={state.error as string}
        clearState={clearState}
        data-testid="account-phone-editor"
      >
        <div className="grid grid-cols-1 gap-y-2">
          <Input
            label="Phone"
            name="phone"
            type="phone"
            autoComplete="phone"
            required
            defaultValue={customer.phone ?? ""}
            data-testid="phone-input"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfilePhone
