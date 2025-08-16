import { SignUp } from '@clerk/clerk-react';

function SignUpPage() {
  return (
    <div className="flex justify-center items-center py-12">
      <SignUp 
        path="/sign-up" 
        routing="path" 
        signInUrl="/sign-in" 
        // THIS IS THE FINAL, CORRECT PROP
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}

export default SignUpPage;