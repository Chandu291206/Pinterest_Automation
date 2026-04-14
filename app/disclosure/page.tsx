import Link from "next/link";

export const metadata = {
  title: "Affiliate Disclosure | Curated Picks",
  description: "FTC-required affiliate disclosure for Amazon Associates program.",
};

export default function DisclosurePage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <header className="space-y-2">
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            Back to homepage
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900">Affiliate Disclosure</h1>
        </header>

        <section className="space-y-6 text-gray-700">
          <p>
            This site participates in the Amazon Services LLC Associates Program, 
            an affiliate advertising program designed to provide a means for sites 
            to earn advertising fees by advertising and linking to Amazon.com.
          </p>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">What This Means</h2>
            <p className="mt-2">
              When you click on affiliate links on this site and make a purchase 
              on Amazon, we may earn a small commission. This comes at no additional 
              cost to you.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Our Promise</h2>
            <p className="mt-2">
              We only recommend products we believe provide genuine value. Our 
              recommendations are based on research and testing, not just commission 
              rates. We aim to help you find products that solve real problems.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Transparency</h2>
            <p className="mt-2">
              You will see this disclosure on all pages containing affiliate links, 
              including directly below any "Buy on Amazon" buttons. This ensures you 
              are always informed before making a purchase.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              <strong>Disclosure:</strong> As an Amazon Associate I earn from qualifying purchases.
            </p>
          </div>
        </section>

        <nav className="flex gap-4 text-sm">
          <Link href="/about" className="text-gray-500 hover:underline">
            About
          </Link>
          <Link href="/privacy" className="text-gray-500 hover:underline">
            Privacy Policy
          </Link>
        </nav>
      </div>
    </main>
  );
}
