import { SignIn } from "@clerk/nextjs";

export default function AuthLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#E1E1E5] bg-white p-7 shadow-xl sm:p-10">
        <SignIn
          routing="path"
          path="/auth/login"
          signUpUrl="/auth/signup"
          fallbackRedirectUrl="/"
          appearance={{ variables: { colorPrimary: "#7C51F8" } }}
        />
      </div>
    </main>
  );
}
