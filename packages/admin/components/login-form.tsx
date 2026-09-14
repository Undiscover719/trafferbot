"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Admin Panel</CardTitle>
        <CardDescription>
          Sign in with your Telegram account to access the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          onClick={() => signIn("telegram")}
        >
          Sign in with Telegram
        </Button>
      </CardContent>
    </Card>
  );
}
