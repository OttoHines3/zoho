"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Lock, Loader2 } from "lucide-react"

const formSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type FormData = z.infer<typeof formSchema>

export default function SigninPage() {
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAutoLogin, setIsAutoLogin] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  // Check for auto-login parameters
  useEffect(() => {
    const zohoId = searchParams.get("zoho_id")
    const loginCode = searchParams.get("login_code")

    if (zohoId && loginCode) {
      setIsAutoLogin(true)
      // Auto-login with URL parameters
      void signIn("credentials", {
        zoho_id: zohoId,
        login_code: loginCode,
        redirect: true,
        callbackUrl: "/checkout/step-1",
      })
    }
  }, [searchParams])

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: true,
        callbackUrl: "/checkout/step-1",
      })
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg px-8 py-10">
        {/* Brand Logo */}
        <div className="flex justify-center mb-8">
          <svg className="w-12 h-12 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in to continue</h1>
          </div>
        </div>

        {isAutoLogin ? (
          /* Auto-login State */
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600 dark:text-slate-300" />
            <p className="text-slate-600 dark:text-slate-300">Signing you in…</p>
          </div>
        ) : (
          /* Manual Form State */
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Password
                </label>
                <input
                  {...register("password")}
                  type="password"
                  id="password"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue
              </button>
            </form>

            {/* Helper Text */}
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              The next screen will ask for payment details.
            </p>
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <a href="mailto:support@example.com" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Need help?
          </a>
        </div>
      </div>
    </div>
  )
}
