import Link from "next/link";

export const metadata = {
  title: "About | Curated Picks",
  description: "Learn about our curated product picks across fitness, tech, home, and more.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <header className="space-y-2">
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            Back to homepage
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900">About</h1>
        </header>

        <section className="space-y-4 text-gray-700">
          <p>
            We curate the best products across fitness, tech, home, and more. 
            Every product is hand-picked and linked directly to Amazon for easy shopping.
          </p>
          <p>
            Our team researches and tests products to find items that deliver real value. 
            We focus on practical, everyday wins that make life easier.
          </p>
          <p>
            When you click on our links and make a purchase, we may earn a commission 
            through the Amazon Associates program. This helps support our work at no 
            additional cost to you.
          </p>
        </section>

        <nav className="flex gap-4 text-sm">
          <Link href="/privacy" className="text-gray-500 hover:underline">
            Privacy Policy
          </Link>
          <Link href="/disclosure" className="text-gray-500 hover:underline">
            Affiliate Disclosure
          </Link>
        </nav>
      </div>
    </main>
  );
}
