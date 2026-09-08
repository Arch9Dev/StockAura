import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 text-center text-neutral-100">
      <h1 className="text-3xl font-semibold text-white">StockAura</h1>
      <p className="mt-3 max-w-md text-neutral-400">
        Inventory and stock management with role-based access control and a full audit trail.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-neutral-700 px-5 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-800"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}