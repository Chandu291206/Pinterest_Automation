import { loadEnvConfig } from "@next/env";

async function run() {
  loadEnvConfig(process.cwd());
  const { generatePinContent } = await import("./lib/contentGenerator");

  const result = await generatePinContent({
    theme: "fitness",
    productName: "Adjustable Kettlebell Set",
    productPrice: "$79.99",
    trendingTerms: ["home gym setup", "kettlebell workout", "strength training at home"],
    variant: "a",
    pinFormat: "collage",
    relatedProducts: ["Yoga Mat Pro", "Resistance Bands Kit", "Foam Roller"],
  });

  console.log("Generated pin content:");
  console.log(JSON.stringify(result, null, 2));
}

run().catch((error) => {
  console.error("Failed to generate pin content:", error);
  process.exit(1);
});
