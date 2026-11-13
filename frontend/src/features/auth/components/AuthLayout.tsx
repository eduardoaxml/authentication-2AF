import { Link, Outlet, useLocation } from "react-router-dom";

export default function AuthLayout() {
  const { pathname } = useLocation();
  const isRegister = pathname === "/register";

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <section className="relative flex min-h-[680px] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Authentication form */}
        <div
          className={`absolute inset-y-0 z-10 w-full overflow-y-auto p-6 transition-all duration-700 ease-in-out md:w-1/2 md:p-12 ${
            isRegister ? "left-0 md:left-1/2" : "left-0"
          }`}
        >
          <div className="flex min-h-full items-center justify-center py-6">
            <div className="w-full max-w-md">
              <Outlet />
            </div>
          </div>
        </div>

        {/* Sliding promotional panel */}
        <div
          className={`absolute inset-y-0 z-20 hidden w-1/2 items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-900 px-12 text-center text-white transition-all duration-700 ease-in-out md:flex ${
            isRegister ? "left-0" : "left-1/2"
          }`}
          style={{
            clipPath: isRegister
              ? "polygon(0 0, 100% 0, 88% 100%, 0 100%)"
              : "polygon(12% 0, 100% 0, 100% 100%, 0 100%)",
          }}
        >
          <div
            key={isRegister ? "register" : "login"}
            className="max-w-sm animate-in fade-in zoom-in-95 duration-500"
          >
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">
              Two Factor Auth
            </p>

            <h2 className="mb-5 text-4xl font-bold">
              {isRegister ? "Welcome back!" : "Hello, friend!"}
            </h2>

            <p className="mb-8 leading-relaxed text-blue-100">
              {isRegister
                ? "Already have an account? Sign in and continue protecting your digital identity."
                : "Create an account and add an extra layer of security to your digital life."}
            </p>

            <Link
              to={isRegister ? "/login" : "/register"}
              className="inline-flex min-w-40 items-center justify-center rounded-full border-2 border-white px-8 py-3 font-semibold transition-colors duration-300 hover:bg-white hover:text-blue-800"
            >
              {isRegister ? "Sign in" : "Register"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
