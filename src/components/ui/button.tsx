import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'glass'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-98 cursor-pointer",
          // Variant mappings
          variant === 'default' && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5",
          variant === 'destructive' && "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:-translate-y-0.5",
          variant === 'outline' && "border border-border bg-background hover:bg-muted text-foreground hover:border-muted-foreground/30",
          variant === 'secondary' && "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:-translate-y-0.5",
          variant === 'ghost' && "hover:bg-muted hover:text-accent-foreground text-muted-foreground hover:text-foreground",
          variant === 'link' && "text-primary underline-offset-4 hover:underline",
          variant === 'glass' && "glass text-foreground hover:bg-primary/10 hover:border-primary/30 shadow-xs",
          // Size mappings
          size === 'default' && "h-11 px-5 py-2",
          size === 'sm' && "h-9 rounded-lg px-3 text-xs",
          size === 'lg' && "h-12 rounded-2xl px-8 text-base",
          size === 'icon' && "h-10 w-10 rounded-full",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
