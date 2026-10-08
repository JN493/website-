import Link from "next/link";

export default function NotFound() {
  return (
    <main className="p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-6">Page not found</h1>
      <p className="text-gray-600 mb-8">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="flex gap-4">
        <Link href="/" className="bg-black text-white px-6 py-3 font-semibold">Back to home</Link>
        <Link href="/contact" className="border px-6 py-3 font-semibold">Contact us</Link>
      </div>
    </main>
  );
}
