"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // If already authenticated, redirect to return URL or home
  useEffect(() => {
    if (status === "authenticated") {
      const returnUrl = searchParams.get("returnUrl") ?? "/"
      router.push(returnUrl)
    }
  }, [status, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        console.error("Authentication failed:", result.error)
        // Handle error (show message to user)
      }
      // Don't redirect here - the useEffect above will handle it

    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // If loading auth status, show loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="grid md:grid-cols-2 w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Form Section */}
        <div className="p-8">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
            <p className="text-gray-600 mb-8">Login to your account</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="mt-1"
                  placeholder="bob@test.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Continue"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>

            <p className="mt-4 text-center text-xs text-gray-500">
              By clicking continue, you agree to our{" "}
              <Link href="/terms" className="text-gray-600 hover:underline">
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-gray-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        {/* Gradient Design Section */}
        <div className="hidden md:block bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
          <div className="h-full w-full bg-opacity-50 backdrop-blur-sm"></div>
        </div>
      </div>
    </div>
  )
}
