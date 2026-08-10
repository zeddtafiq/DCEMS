import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Server } from "lucide-react";
import { toast } from "sonner";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User,
} from "firebase/auth";
import { useServerFn } from "@tanstack/react-start";

import { firebaseAuth, googleProvider } from "@/lib/firebase";
import { exchangeFirebaseToken } from "@/lib/firebase-bridge.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — DCEMS" },
      { name: "description", content: "Sign in, register, or reset your password for the DCEMS dashboard." },
      { property: "og:title", content: "Sign in — DCEMS" },
      { property: "og:description", content: "Sign in, register, or reset your password for the DCEMS dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email({ message: "Invalid email" }).max(255);
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" }).max(72);
const nameSchema = z.string().trim().min(1, { message: "Name is required" }).max(100);

function firebaseMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password";
    case "auth/email-already-in-use":
      return "That email is already registered";
    case "auth/weak-password":
      return "Password is too weak";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled in Firebase yet";
    default:
      return (err as { message?: string })?.message ?? "Something went wrong";
  }
}

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const exchange = useServerFn(exchangeFirebaseToken);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  // Bridge the Firebase user into a backend session so data rules keep working.
  async function completeSignIn(user: User) {
    const idToken = await user.getIdToken();
    const { tokenHash } = await exchange({ data: { idToken } });
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    if (error) throw new Error(error.message);
  }

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
    }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, loginEmail, loginPassword);
      await completeSignIn(cred.user);
      toast.success("Signed in");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(firebaseMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    try {
      nameSchema.parse(regName);
      emailSchema.parse(regEmail);
      passwordSchema.parse(regPassword);
    } catch (err) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, regEmail, regPassword);
      await updateProfile(cred.user, { displayName: regName });
      await completeSignIn(cred.user);
      toast.success("Account created");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(firebaseMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const [forgotEmail, setForgotEmail] = useState("");
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    try {
      emailSchema.parse(forgotEmail);
    } catch (err) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, forgotEmail);
      toast.success("Password reset email sent");
    } catch (err) {
      toast.error(firebaseMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const cred = await signInWithPopup(firebaseAuth, googleProvider);
      await completeSignIn(cred.user);
      toast.success("Signed in");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(firebaseMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md animate-fade-up">
        <Link to="/" className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <Server className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold gradient-text">DCEMS</span>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="forgot">Forgot</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-4 space-y-4">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
                </div>
                <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
                  Continue with Google
                </Button>
              </TabsContent>

              <TabsContent value="register" className="mt-4 space-y-4">
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name">Full name</Label>
                    <Input id="reg-name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input id="reg-password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating…" : "Create account"}
                  </Button>
                </form>
                <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
                  Continue with Google
                </Button>
              </TabsContent>

              <TabsContent value="forgot" className="mt-4">
                <form onSubmit={handleForgot} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input id="forgot-email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending…" : "Send reset link"}
                  </Button>
                  <p className="text-xs text-muted-foreground">Firebase will email you a link to set a new password.</p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
