"use client"

import * as React from "react"
import { toast } from "sonner"

export interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

export function useToast() {
  return {
    toast: ({ title, description, variant = "default", duration = 4000 }: ToastProps) => {
      if (variant === "destructive") {
        return toast.error(title || "Error", {
          description,
          duration,
        })
      }
      
      return toast.success(title || "Success", {
        description,
        duration,
      })
    },
    dismiss: toast.dismiss,
  }
} 