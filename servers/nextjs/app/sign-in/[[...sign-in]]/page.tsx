import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#E1E1E5] bg-white p-7 shadow-xl sm:p-10">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
          appearance={{ variables: { colorPrimary: "#7C51F8" } }}
        />
      </div>
    </main>
  );
}
