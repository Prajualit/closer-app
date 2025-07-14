import { Button } from "@/components/ui/button";

export default function LoadingButton({
    pending,
    children,
    onClick,
    type = "button",
    variant = "default",
    size = "default",
    className = "",
    disabled = false,
    href,
    ...props
}) {
    if (href) {
        return (
            <a
                href={href}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${
                    variant === "default"
                        ? "bg-primary text-primary-foreground shadow hover:bg-primary/90"
                        : variant === "outline"
                        ? "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
                        : ""
                } ${
                    size === "default"
                        ? "h-9 px-4 py-2"
                        : size === "sm"
                        ? "h-8 rounded-md px-3 text-xs"
                        : size === "lg"
                        ? "h-10 rounded-md px-8"
                        : ""
                } ${className}`}
                {...props}
            >
                {pending && (
                    <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                )}
                {children}
            </a>
        );
    }

    return (
        <Button
            type={type}
            variant={variant}
            size={size}
            className={className}
            disabled={disabled || pending}
            onClick={onClick}
            {...props}
        >
            {pending && (
                <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
            )}
            {children}
        </Button>
    );
}
