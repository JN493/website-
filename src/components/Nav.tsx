import Link from "next/link";

export default function Nav() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b">
      <Link href="/" className="font-bold text-xl">SLS</Link>
      <nav className="flex gap-6 text-sm">
        <Link href="/about">About</Link>
        <Link href="/capabilities">Capabilities</Link>
        <Link href="/industries">Industries</Link>
        <Link href="/projects">Projects</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </header>
  );
}
