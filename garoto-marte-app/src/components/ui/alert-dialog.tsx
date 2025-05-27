"use client"

import * as React from "react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const AlertDialog = ({ open, onOpenChange, children }: AlertDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

const AlertDialogContent = ({ children, className, ...props }: React.ComponentProps<typeof DialogContent>) => {
  return (
    <DialogContent className={className} {...props}>
      {children}
    </DialogContent>
  )
}

const AlertDialogHeader = ({ children, className, ...props }: React.ComponentProps<typeof DialogHeader>) => {
  return (
    <DialogHeader className={className} {...props}>
      {children}
    </DialogHeader>
  )
}

const AlertDialogTitle = ({ children, className, ...props }: React.ComponentProps<typeof DialogTitle>) => {
  return (
    <DialogTitle className={className} {...props}>
      {children}
    </DialogTitle>
  )
}

const AlertDialogDescription = ({ children, className, ...props }: React.ComponentProps<typeof DialogDescription>) => {
  return (
    <DialogDescription className={className} {...props}>
      {children}
    </DialogDescription>
  )
}

const AlertDialogFooter = ({ children, className, ...props }: React.ComponentProps<typeof DialogFooter>) => {
  return (
    <DialogFooter className={className} {...props}>
      {children}
    </DialogFooter>
  )
}

const AlertDialogAction = ({ children, ...props }: React.ComponentProps<typeof Button>) => {
  return (
    <Button {...props}>
      {children}
    </Button>
  )
}

const AlertDialogCancel = ({ children, variant = "outline", ...props }: React.ComponentProps<typeof Button>) => {
  return (
    <Button variant={variant} {...props}>
      {children}
    </Button>
  )
}

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
}
