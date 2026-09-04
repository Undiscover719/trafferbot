"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { Send } from "lucide-react";
import { withBasePath } from "@/lib/base-path";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    window.location.href = withBasePath("/api/auth/signin/telegram");
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">TrafferBot Admin</h1>
                <p className="text-balance text-muted-foreground">
                  Войдите через Telegram для доступа к панели управления
                </p>
              </div>

              <div className="flex items-center justify-center">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleLogin}
                  disabled={loading}
                >
                  <Send className="mr-2 size-4" />
                  {loading ? "Перенаправление..." : "Войти через Telegram"}
                </Button>
              </div>

              <FieldDescription className="text-center">
                Доступ только для администраторов проекта
              </FieldDescription>
            </FieldGroup>
          </div>
          <div className="relative hidden overflow-hidden bg-muted md:block">
            <img
              src={withBasePath("/bubalogo.png")}
              alt="TrafferBot"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
