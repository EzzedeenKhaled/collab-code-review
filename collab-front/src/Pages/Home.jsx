import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="px-6 py-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-slate-900">
            Collab Code Review
          </div>
          <SignedIn>
            <UserButton />
          </SignedIn>
          {/* <SignedOut>
            <SignInButton />
          </SignedOut> */}
        </div>
      </header>

      <main className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <SignedIn>
            <h2 className="text-3xl font-semibold text-slate-800 mb-4">
              Welcome, {user?.firstName || "Developer"} 👋
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              You're signed in! Let's get started.
            </p>
            <button
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 text-lg"
              onClick={() => navigate("/dashboard")} // adjust route as needed
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </SignedIn>

          <SignedOut>
            {/* HERO CONTENT for signed-out users */}
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Collaborate on code reviews{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                in real time
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-12 leading-relaxed">
              Like Google Docs, but for pull requests.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <SignUpButton mode="modal">
                <button className="inline-flex items-center px-8 py-4 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors duration-200 text-lg">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </SignUpButton>

              <SignInButton mode="modal">
                <button className="inline-flex items-center px-8 py-4 bg-white text-slate-900 font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200 text-lg">
                  Sign In
                </button>
              </SignInButton>
            </div>

            <p className="text-lg text-slate-600 mb-20 max-w-2xl mx-auto leading-relaxed">
              Review code together with your team in real time. Comment inline, discuss changes live, and merge with confidence—all without leaving your browser.
            </p>

            {/* Benefits Section */}
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-8">
                Everything you need for modern code review
              </h2>

              <div className="grid md:grid-cols-3 gap-8 text-left">
                {[
                  {
                    title: "Live code collaboration",
                    desc: "See changes and comments appear instantly as your team reviews code together.",
                  },
                  {
                    title: "Inline code commenting",
                    desc: "Comment on specific lines and functions with context-aware discussions.",
                  },
                  {
                    title: "Works right in your browser",
                    desc: "No installations needed. Jump into code reviews from any device, anywhere.",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SignedOut>
        </div>
      </main>

      <footer className="px-6 py-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-500">Built for developers, by developers</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
