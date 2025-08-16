import { SignIn } from '@clerk/clerk-react';

function SignInPage() {
  return (
    <div className="flex justify-center items-center py-12">
      <SignIn 
        path="/sign-in" 
        routing="path" 
        signUpUrl="/sign-up" 
        // THIS IS THE FINAL, CORRECT PROP
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}

export default SignInPage;