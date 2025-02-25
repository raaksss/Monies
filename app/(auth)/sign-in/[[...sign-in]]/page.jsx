import { SignIn } from '@clerk/nextjs'
import { ClerkProvider } from '@clerk/nextjs'
import React from 'react'

const Page = () => {
  return (
    <ClerkProvider>
    <SignIn />
    </ClerkProvider>
  )
}

export default Page
