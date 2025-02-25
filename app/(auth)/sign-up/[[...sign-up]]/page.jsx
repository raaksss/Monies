import { SignUp } from '@clerk/nextjs'
import React from 'react'
import { ClerkProvider } from '@clerk/nextjs'

const Page = () => {
  return (
    <ClerkProvider>
    <SignUp />
    </ClerkProvider>
  )
}

export default Page
