import { Loader2 } from "lucide-react"
 
import { cn } from "@kit/ui/utils";
 
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2
      role="status"
      aria-label="Cargando"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}
 
export { Spinner }