import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Curated Picks",
  description: "Our privacy policy and data collection practices.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <header className="space-y-2">
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            Back to homepage
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900">Privacy Policy</h1>
        </header>

        <section className="space-y-6 text-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">What Data We Collect</h2>
            <p className="mt-2">
              We collect minimal data to understand how our site performs:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Click tracking on product links (anonymized)</li>
              <li>Page view analytics (no personal identifiers)</li>
              <li>General traffic patterns</li>
            </ul>
            <p className="mt-2">
              We do not collect personal data such as names, email addresses, 
              or payment information.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Amazon Affiliate Links</h2>
            <p className="mt-2">
              This site uses Amazon affiliate links. When you click these links 
              and make purchases on Amazon, we may earn a commission. Amazon 
              handles all transaction data directly.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cookies</h2>
            <p className="mt-2">
              We use essential cookies only. No third-party tracking cookies 
              are placed on your device.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
            <p className="mt-2">
              For privacy-related questions, contact us at:{" "}
              <a 
                href="mailto:privacy@curatedpicks.com" 
                className="text-blue-600 hover:underline"
              >
                privacy@curatedpicks.com
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Updates</h2>
            <p className="mt-2">
              This privacy policy may be updated periodically. Last updated: April 2026.
            </p>
          </div>
        </section>

        <nav className="flex gap-4 text-sm">
          <Link href="/about" className="text-gray-500 hover:underline">
            About
          </Link>
          <Link href="/disclosure" className="text-gray-500 hover:underline">
            Affiliate Disclosure
          </Link>
        </nav>
      </div>
    </main>
  );
}
