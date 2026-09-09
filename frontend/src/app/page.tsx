import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <h1 className="text-3xl font-semibold">StockAura</h1>
      <p className="mt-3 max-w-md text-gray-500 dark:text-gray-400">
        Inventory and stock management with role-based access control and a full audit trail.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}