"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, googlesignIn, authClient } from "@/lib/auth-client";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";

type Inputs = {
  email: string;
  password: string;
};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const [error, setError] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setIsLogging(true);
    setError(null);

    // Track login attempt
    trackEvent("login_attempt", {
      email: data.email,
      method: "email_password",
    });

    const res = await signIn.email(
      {
        email: data.email,
        password: data.password,
      },
      {
        onError: (ctx) => {
          // Track failed login
          trackEvent("login_failed", {
            error: ctx.error.message,
            status: ctx.error.status,
          });

          if (ctx.error.status === 403) {
            toast.error("Please verify your email address");
          } else {
            toast.error(ctx.error.message);
          }
          setIsLogging(false);
        },
        onSuccess: async (ctx) => {
          console.log("onSuccess ctx.data:", ctx.data);

          // Track successful login
          trackEvent("login_success", {
            userId: ctx.data.user?.id,
          });

          toast.success("Login successful");
          router.push("/admin");
        },
        onSettled: () => {
          setIsLogging(false);
        },
      }
    );

    if (res.error) {
      setError(res.error.message || "Something went wrong.");
    } else {
      router.push("/admin");
    }
  };

  const handleGoogleLogin = async () => {
    // Track Google login attempt
    trackEvent("login_attempt", {
      method: "google",
    });

    try {
      await googlesignIn();
    } catch (err) {
      setError("Google sign-in failed.");
      console.error(err);

      // Track Google login failure
      trackEvent("login_failed", {
        method: "google",
        error: "Google sign-in failed",
      });
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Login with your email and password</CardDescription>
        </CardHeader>
        <CardContent>
          {process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === "true" && (
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Login with Google
            </Button>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-card text-muted-foreground relative z-10 px-2">
                Or continue with
              </span>
            </div>
          </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value:
                          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.email && (
                    <span className="text-red-500">{errors.email.message}</span>
                  )}
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters long",
                      },
                    })}
                  />
                  {errors.password && (
                    <span className="text-red-500">
                      {errors.password.message}
                    </span>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLogging}>
                  {isLogging && (
                    <Loader2 className="animate-spin h-6 w-6 text-white" />
                  )}
                  {isLogging ? "Logging..." : "Log In"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
